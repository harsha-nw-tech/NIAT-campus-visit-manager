import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { searchUserByPhone, getUserProfile } from "../services/niatClient.js";

const router = Router();

router.post("/search-user", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ error: "Bad Request", message: "phoneNumber is required" });
      return;
    }

    const data = await searchUserByPhone(phoneNumber);
    console.log("[SEARCH] NIAT create response:", JSON.stringify(data));

    const userId = data?.user_id ?? data?.userId ?? data?.data?.user_id ?? null;
    const applicationId = data?.application_id ?? data?.applicationId ?? data?.data?.application_id ?? null;

    // Fetch user profile via GraphQL to get name and determine if new user
    let name: string | null = null;
    let language: string | null = null;
    if (userId) {
      const profile = await getUserProfile(userId);
      name = profile.name;
      language = profile.language;
    }

    // A user is "new" if they have no name set (never completed profile)
    const isNewUser = !name;

    const studentInfo = { name, email: null as string | null, phone: phoneNumber, language };

    res.json({ isNewUser, userId, applicationId, studentInfo });
  } catch (err: any) {
    console.error("Search user error:", err);
    res.status(400).json({ error: "Search Failed", message: err.message });
  }
});

export default router;
