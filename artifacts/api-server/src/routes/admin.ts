import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import { createUser } from "../services/authService.js";
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
      if (err.message?.includes("unique")) {
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

export default router;
