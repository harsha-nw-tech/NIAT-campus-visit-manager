import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import {
  getSectionsCompletion,
  generateDirectLink,
} from "../services/niatClient.js";
import { updateTemplate } from "../services/templateService.js";
import { getNiatConfig } from "../config/envConfig.js";
import { db, auditLogsTable } from "@workspace/db";
import { getMockUser } from "../fixtures/mockData.js";

const router = Router();

// GET completion percentages for a user's sections
router.post("/get-completion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { applicationId, userId } = req.body;
    if (!applicationId || !userId) {
      res.status(400).json({ error: "Bad Request", message: "applicationId and userId are required" });
      return;
    }

    const mockEntry = Object.values(
      (await import("../fixtures/mockData.js")).MOCK_USERS
    ).find((m) => m.userId === userId);

    if (mockEntry) {
      console.log(`[GET-COMPLETION] Mock data returned for userId: ${userId}`);
      res.json({
        bookedCampusVisit: mockEntry.bookedCampusVisit,
        officeVisit: mockEntry.officeVisit,
        completionAvailable: true,
      });
      return;
    }

    const { bookedCampusVisitSectionId, officeVisitSectionId } = getNiatConfig();

    let bookedCampusVisit: number | null = null;
    let officeVisit: number | null = null;
    let completionAvailable = false;

    try {
      const data = await getSectionsCompletion(userId, applicationId);
      console.log("Get completion raw response:", JSON.stringify(data));

      const sections = Array.isArray(data?.section_details)
        ? data.section_details
        : (data?.data ?? data?.sections ?? []);

      const findCompletion = (id: string): number => {
        if (!id) return 0;
        const entry = Array.isArray(sections)
          ? sections.find((s: any) => s.section_entity_config_id === id || s.id === id)
          : null;
        return entry?.completion_percentage ?? entry?.completion ?? entry?.completion_value ?? 0;
      };

      bookedCampusVisit = findCompletion(bookedCampusVisitSectionId);
      officeVisit       = findCompletion(officeVisitSectionId);
      completionAvailable = true;
    } catch (completionErr: any) {
      console.warn("Could not fetch completion data:", completionErr.message);
    }

    res.json({ bookedCampusVisit, officeVisit, completionAvailable });
  } catch (err: any) {
    console.error("Get completion error:", err);
    res.status(400).json({ error: "Failed", message: err.message });
  }
});

// EXISTING USER: Mark campus as visited (updates field with existing user config)
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

      const mockEntry = Object.values(
        (await import("../fixtures/mockData.js")).MOCK_USERS
      ).find((m) => m.userId === userId);

      if (mockEntry) {
        console.log(`[MARK-VISITED] Mock visit recorded for userId: ${userId} — skipping real API call`);
        mockEntry.officeVisit = 100;
        res.json({ success: true, message: "Campus visit marked successfully", fieldUpdated: true });
        return;
      }

      let fieldUpdated = false;
      try {
        await updateTemplate(userId, applicationId, false);
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

      res.json({ success: true, message: "Campus visit marked successfully", fieldUpdated });
    } catch (err: any) {
      console.error("Mark visited error:", err);
      res.status(400).json({ error: "Failed", message: err.message });
    }
  },
);

// NEW USER: Update field before generating direct link
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
      await updateTemplate(userId, applicationId, true);
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

// Generate direct visit link
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
