import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { searchUserByPhone, getUserProfile } from "../services/niatClient.js";
import { getMockUser } from "../fixtures/mockData.js";

const router = Router();

router.post("/search-user", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res
        .status(400)
        .json({ error: "Bad Request", message: "phoneNumber is required" });
      return;
    }

    const mock = getMockUser(phoneNumber);
    if (mock) {
      console.log(`[SEARCH] Mock data returned for test number: ${phoneNumber} — ${mock.scenario}`);
      res.json({
        isNewUser: false,
        userId: mock.userId,
        applicationId: mock.applicationId,
        studentInfo: {
          name: mock.name,
          phone: phoneNumber,
          language: mock.language,
        },
      });
      return;
    }

    // Step 1: create/find user — returns raw user_id + application_id
    const createResp = await searchUserByPhone(phoneNumber);
    console.log("[SEARCH] create response:", JSON.stringify(createResp));

    const rawUserId = createResp?.user_id ?? null;
    const applicationId = createResp?.application_id ?? null;

    // Step 2: fetch GraphQL profile — gives canonical user_id (matches gamma panel), name, mobile
    let userId = rawUserId;
    let name: string | null = null;
    let mobile: string | null = null;
    let language: string | null = null;

    if (rawUserId) {
      const profile = await getUserProfile(rawUserId);
      console.log("[SEARCH] profile:", JSON.stringify(profile));
      // Prefer the user_id from GraphQL — it is the canonical ID shown in the gamma panel
      if (profile.userId) userId = profile.userId;
      name = profile.name;
      mobile = profile.mobile;
      language = profile.language;
    }

    // A user is "new" if they have no name set in their profile (never completed it)
    const isNewUser = !name;

    const studentInfo = {
      name,
      phone: mobile || phoneNumber, // prefer profile phone (normalized by NIAT)
      language,
    };

    res.json({ isNewUser, userId, applicationId, studentInfo });
  } catch (err: any) {
    console.error("Search user error:", err);
    res.status(400).json({ error: "Search Failed", message: err.message });
  }
});

export default router;
