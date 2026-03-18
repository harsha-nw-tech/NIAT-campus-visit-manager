import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import {
  getSectionsCompletion,
  generateDirectLink,
} from "../services/niatClient.js";
import { updateTemplate } from "../services/templateService.js";
import { getNiatConfig } from "../config/envConfig.js";
import { db, auditLogsTable } from "@workspace/db";

const router = Router();

router.post("/get-completion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { applicationId, userId } = req.body;
    if (!applicationId || !userId) {
      res.status(400).json({
        error: "Bad Request",
        message: "applicationId and userId are required",
      });
      return;
    }

    const {
      bookedCampusVisitSectionId,
      visitedCampusSectionId,
      personalDetailsSectionId,
    } = getNiatConfig();

    let bookedCampusVisit: number | null = null;
    let visitedCampus: number | null = null;
    let personalDetails: number | null = null;
    let completionAvailable = false;

    try {
      const data = await getSectionsCompletion(userId, applicationId);
      console.log("Get completion raw response:", JSON.stringify(data));

      const sections = Array.isArray(data?.data)
        ? data.data
        : (data?.data ?? data?.sections ?? data ?? {});

      const findCompletion = (id: string) => {
        if (Array.isArray(sections)) {
          const entry = sections.find(
            (s: any) => s.section_entity_config_id === id || s.id === id,
          );
          return entry?.completion ?? entry?.completion_value ?? 0;
        }
        return sections?.[id]?.completion ?? sections?.[id] ?? 0;
      };

      bookedCampusVisit = findCompletion(bookedCampusVisitSectionId);
      visitedCampus = findCompletion(visitedCampusSectionId);
      personalDetails = findCompletion(personalDetailsSectionId);
      completionAvailable = true;
    } catch (completionErr: any) {
      console.warn(
        "Could not fetch completion data (requires user auth):",
        completionErr.message,
      );
    }

    res.json({
      bookedCampusVisit,
      visitedCampus,
      personalDetails,
      completionAvailable,
    });
  } catch (err: any) {
    console.error("Get completion error:", err);
    res.status(400).json({ error: "Failed", message: err.message });
  }
});

router.post(
  "/mark-visited",
  requireAuth,
  requireRole("sales"),
  async (req: AuthRequest, res) => {
    try {
      const { userId, applicationId, phoneNumber } = req.body;
      if (!userId || !applicationId || !phoneNumber) {
        res.status(400).json({
          error: "Bad Request",
          message: "userId, applicationId, and phoneNumber are required",
        });
        return;
      }

      const { existingUserFieldValue } = getNiatConfig();

      let fieldUpdated = false;
      try {
        await updateTemplate(userId, applicationId, existingUserFieldValue);
        fieldUpdated = true;
        console.log(`[mark-visited] Field updated for userId: ${userId}`);
      } catch (templateErr: any) {
        console.warn(`[mark-visited] Field update failed (non-blocking):`, templateErr.message);
      }

      await db.insert(auditLogsTable).values({
        actionType: "CAMPUS_MARKED",
        performedBy: String(req.user!.userId),
        performerPhone: req.user!.phoneNumber,
        targetUserId: userId,
        applicationId,
        phoneNumber,
      });

      res.json({
        success: true,
        message: "Campus visit marked successfully",
        fieldUpdated,
      });
    } catch (err: any) {
      console.error("Mark visited error:", err);
      res.status(400).json({ error: "Failed", message: err.message });
    }
  },
);

router.post("/update-user-field", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, applicationId } = req.body;
    if (!userId || !applicationId) {
      res.status(400).json({ error: "Bad Request", message: "userId and applicationId are required" });
      return;
    }

    console.log(`[update-user-field] userId: ${userId} applicationId: ${applicationId}`);
    let templateUpdated = false;
    try {
      await updateTemplate(userId, applicationId);
      templateUpdated = true;
      console.log(`[update-user-field] Template updated for userId: ${userId}`);
    } catch (templateErr: any) {
      console.warn(`[update-user-field] Template update failed (non-blocking):`, templateErr.message);
    }

    res.json({ success: true, templateUpdated });
  } catch (err: any) {
    console.error("[update-user-field] error:", err);
    res.status(400).json({ error: "Failed to update user field", message: err.message });
  }
});

router.post("/generate-link", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, applicationId, phoneNumber } = req.body;
    if (!userId || !applicationId || !phoneNumber) {
      res.status(400).json({
        error: "Bad Request",
        message: "userId, applicationId, and phoneNumber are required",
      });
      return;
    }

    const { redirectUrl } = await generateDirectLink(userId, applicationId);

    await db.insert(auditLogsTable).values({
      actionType: "DIRECT_LINK_GENERATED",
      performedBy: String(req.user!.userId),
      performerPhone: req.user!.phoneNumber,
      targetUserId: userId,
      applicationId,
      phoneNumber,
    });

    res.json({ redirectUrl, success: true });
  } catch (err: any) {
    console.error("Generate link error:", err);
    res.status(400).json({ error: "Failed to generate link", message: err.message });
  }
});

export default router;
