import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import { createUser } from "../services/authService.js";
import { exchangeAuthCode, setTokens } from "../services/tokenService.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post(
  "/admin/create-sales",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, password } = req.body;
      if (!phoneNumber || !password) {
        res.status(400).json({ error: "Bad Request", message: "phoneNumber and password are required" });
        return;
      }
      await createUser(phoneNumber, password, "sales");
      res.json({ success: true, message: "Sales user created successfully" });
    } catch (err: any) {
      console.error("Create sales error:", err);
      const isDuplicate =
        err.cause?.code === "23505" ||
        err.message?.includes("unique") ||
        err.cause?.message?.includes("unique");
      if (isDuplicate) {
        res.status(400).json({ error: "Conflict", message: "A user with this phone number already exists" });
      } else {
        res.status(400).json({ error: "Failed", message: err.message });
      }
    }
  }
);

router.get(
  "/admin/sales-users",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res) => {
    try {
      const users = await db
        .select({ id: usersTable.id, phoneNumber: usersTable.phoneNumber, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.role, "sales"));

      res.json({ users });
    } catch (err: any) {
      console.error("Get sales users error:", err);
      res.status(500).json({ error: "Failed", message: err.message });
    }
  }
);

// Exchange an SSO auth_code for access+refresh tokens
router.post(
  "/admin/set-auth-code",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { authCode } = req.body;
      if (!authCode) {
        res.status(400).json({ error: "Bad Request", message: "authCode is required" });
        return;
      }
      await exchangeAuthCode(authCode);
      res.json({ success: true, message: "Auth code exchanged — service token is now active" });
    } catch (err: any) {
      console.error("Set auth code error:", err);
      res.status(400).json({ error: "Failed", message: err.message });
    }
  }
);

// Directly set access + refresh tokens (paste from browser/Postman session)
router.post(
  "/admin/set-tokens",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { accessToken, refreshToken, expiresIn } = req.body;
      if (!accessToken || !refreshToken) {
        res.status(400).json({ error: "Bad Request", message: "accessToken and refreshToken are required" });
        return;
      }
      setTokens(accessToken, refreshToken, expiresIn ?? 3600);
      res.json({ success: true, message: "Service tokens set — active until next restart or expiry" });
    } catch (err: any) {
      console.error("Set tokens error:", err);
      res.status(400).json({ error: "Failed", message: err.message });
    }
  }
);

export default router;
