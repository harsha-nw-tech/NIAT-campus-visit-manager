import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import { getSectionsCompletion, updateSectionCompletion, generateDirectLink } from "../services/niatClient.js";
import { updateTemplate } from "../services/templateService.js";
import { db, auditLogsTable } from "@workspace/db";

const router = Router();

router.post("/get-completion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { applicationId, userId, accessToken } = req.body;
    if (!applicationId || !userId) {
      res.status(400).json({ error: "Bad Request", message: "applicationId and userId are required" });
      return;
    }

    let bookedCampusVisit: number | null = null;
    let visitedCampus: number | null = null;
    let completionAvailable = false;

    try {
      const data = await getSectionsCompletion(userId, applicationId, accessToken);
      console.log("Get completion raw response:", JSON.stringify(data));

      const bookedSectionId = process.env.BOOKED_CAMPUS_VISIT_SECTION_ID || "";
      const visitedSectionId = process.env.VISITED_CAMPUS_SECTION_ID || "";

      const sections = Array.isArray(data?.data) ? data.data :
        (data?.data ?? data?.sections ?? data ?? {});

      const findCompletion = (id: string) => {
        if (Array.isArray(sections)) {
          const entry = sections.find((s: any) =>
            s.section_entity_config_id === id || s.id === id
          );
          return entry?.completion ?? entry?.completion_value ?? 0;
        }
        return sections?.[id]?.completion ?? sections?.[id] ?? 0;
      };

      bookedCampusVisit = findCompletion(bookedSectionId);
      visitedCampus = findCompletion(visitedSectionId);
      completionAvailable = true;
    } catch (completionErr: any) {
      console.warn("Could not fetch completion data (requires user auth):", completionErr.message);
    }

    res.json({ bookedCampusVisit, visitedCampus, completionAvailable });
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
        res.status(400).json({ error: "Bad Request", message: "userId, applicationId, and phoneNumber are required" });
        return;
      }

      const bookedSectionId = process.env.BOOKED_CAMPUS_VISIT_SECTION_ID || "";
      const visitedSectionId = process.env.VISITED_CAMPUS_SECTION_ID || "";
      let niatUpdateSuccess = false;
      try {
        await updateSectionCompletion(userId, applicationId, bookedSectionId, 100);
        await updateSectionCompletion(userId, applicationId, visitedSectionId, 100);
        niatUpdateSuccess = true;
      } catch (niatErr: any) {
        console.warn("Could not update NIAT completion (requires user auth):", niatErr.message);
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
        niatUpdated: niatUpdateSuccess,
      });
    } catch (err: any) {
      console.error("Mark visited error:", err);
      res.status(400).json({ error: "Failed", message: err.message });
    }
  }
);

router.post("/generate-link", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { userId, applicationId, phoneNumber } = req.body;
    if (!userId || !applicationId || !phoneNumber) {
      res.status(400).json({ error: "Bad Request", message: "userId, applicationId, and phoneNumber are required" });
      return;
    }

    // Step 1: Update template fields before generating link
    let templateUpdated = false;
    try {
      await updateTemplate(applicationId);
      templateUpdated = true;
      console.log(`[generate-link] Template updated for application ${applicationId}`);
    } catch (templateErr: any) {
      // Template update requires user-level auth which is not available via API key.
      // Log the failure but continue — link is still generated so sales staff can proceed.
      console.warn(`[generate-link] Template update failed (will still generate link): ${templateErr.message}`);
    }

    // Step 2: Generate the direct link
    const { redirectUrl } = await generateDirectLink(userId, applicationId);

    // Step 3: Audit log
    await db.insert(auditLogsTable).values({
      actionType: "DIRECT_LINK_GENERATED",
      performedBy: String(req.user!.userId),
      performerPhone: req.user!.phoneNumber,
      targetUserId: userId,
      applicationId,
      phoneNumber,
    });

    res.json({ redirectUrl, success: true, templateUpdated });
  } catch (err: any) {
    console.error("Generate link error:", err);
    res.status(400).json({ error: "Failed to initialize user", message: err.message });
  }
});

export default router;
