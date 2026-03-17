import { Router } from "express";
import { loginUser, generateToken } from "../services/authService.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
      res.status(400).json({ error: "Bad Request", message: "phoneNumber and password are required" });
      return;
    }
    const user = await loginUser(phoneNumber, password);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = generateToken(user.id, user.role, user.phoneNumber);
    res.json({
      token,
      user: { id: user.id, role: user.role, phoneNumber: user.phoneNumber },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

export default router;
