import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { searchUserByPhone } from "../services/niatClient.js";

const router = Router();

router.post("/search-user", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ error: "Bad Request", message: "phoneNumber is required" });
      return;
    }

    const data = await searchUserByPhone(phoneNumber);

    const isNewUser = data?.is_new_user ?? data?.isNewUser ?? false;
    const userId = data?.user_id ?? data?.userId ?? data?.data?.user_id ?? null;
    const applicationId = data?.application_id ?? data?.applicationId ?? data?.data?.application_id ?? null;
    const studentInfo = {
      name: data?.name ?? data?.student_name ?? data?.data?.name ?? null,
      email: data?.email ?? data?.data?.email ?? null,
      phone: phoneNumber,
    };

    res.json({ isNewUser, userId, applicationId, studentInfo });
  } catch (err: any) {
    console.error("Search user error:", err);
    res.status(400).json({ error: "Search Failed", message: err.message });
  }
});

export default router;
