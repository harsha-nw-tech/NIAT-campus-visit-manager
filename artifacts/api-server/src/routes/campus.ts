import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import { getSectionsCompletion, updateSectionCompletion, generateDirectLink } from "../services/niatClient.js";
import { updateTemplate } from "../services/templateService.js";
import { db, auditLogsTable } from "@workspace/db";

const router = Router();

router.post("/get-completion", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { applicationId, userId } = req.body;
    if (!applicationId || !userId) {
      res.status(400).json({ error: "Bad Request", message: "applicationId and userId are required" });
      return;
    }

    const data = await getSectionsCompletion(userId, applicationId);

    const sections = data?.data ?? data?.sections ?? data ?? {};
    const bookedCampusVisit =
      sections?.booked_campus_visit?.completion ??
      sections?.bookedCampusVisit ??
      sections?.booked_campus_visit ??
      0;
    const visitedCampus =
      sections?.visited_campus?.completion ??
      sections?.visitedCampus ??
      sections?.visited_campus ??
      0;

    res.json({ bookedCampusVisit, visitedCampus });
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

      await updateSectionCompletion(userId, applicationId, "booked_campus_visit", 100);
      await updateSectionCompletion(userId, applicationId, "visited_campus", 100);

      await db.insert(auditLogsTable).values({
        actionType: "CAMPUS_MARKED",
        performedBy: String(req.user!.userId),
        performerPhone: req.user!.phoneNumber,
        targetUserId: userId,
        applicationId,
        phoneNumber,
      });

      res.json({ success: true, message: "Campus visit marked successfully" });
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

    await updateTemplate(applicationId);

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
    res.status(400).json({ error: "Failed", message: err.message });
  }
});

export default router;
