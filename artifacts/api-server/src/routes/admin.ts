import { Router } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middlewares/auth.js";
import { createUser, updateUserCredentials } from "../services/authService.js";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post(
  "/admin/create-sales",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { phoneNumber, password, role } = req.body;
      if (!phoneNumber || !password) {
        res.status(400).json({ error: "Bad Request", message: "phoneNumber and password are required" });
        return;
      }
      const userRole: "admin" | "sales" = role === "admin" ? "admin" : "sales";
      await createUser(phoneNumber, password, userRole);
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
        .select({
          id: usersTable.id,
          phoneNumber: usersTable.phoneNumber,
          role: usersTable.role,
          plainPassword: usersTable.plainPassword,
        })
        .from(usersTable)
        .where(eq(usersTable.role, "sales"));

      res.json({ users });
    } catch (err: any) {
      console.error("Get sales users error:", err);
      res.status(500).json({ error: "Failed", message: err.message });
    }
  }
);

// Get all users (admin + sales) for credential management
router.get(
  "/admin/all-users",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res) => {
    try {
      const users = await db
        .select({
          id: usersTable.id,
          phoneNumber: usersTable.phoneNumber,
          role: usersTable.role,
          plainPassword: usersTable.plainPassword,
        })
        .from(usersTable);

      res.json({ users });
    } catch (err: any) {
      console.error("Get all users error:", err);
      res.status(500).json({ error: "Failed", message: err.message });
    }
  }
);

// Change credentials for any user (admin or sales)
router.post(
  "/admin/change-credentials",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { id, phoneNumber, password } = req.body;
      if (!id || !phoneNumber || !password) {
        res.status(400).json({ error: "Bad Request", message: "id, phoneNumber, and password are required" });
        return;
      }
      const updated = await updateUserCredentials(Number(id), phoneNumber, password);
      if (!updated) {
        res.status(404).json({ error: "Not Found", message: "User not found" });
        return;
      }
      res.json({ success: true, message: "Credentials updated successfully" });
    } catch (err: any) {
      console.error("Change credentials error:", err);
      const isDuplicate =
        err.cause?.code === "23505" ||
        err.message?.includes("unique") ||
        err.cause?.message?.includes("unique");
      if (isDuplicate) {
        res.status(400).json({ error: "Conflict", message: "That phone number is already taken" });
      } else {
        res.status(400).json({ error: "Failed", message: err.message });
      }
    }
  }
);

export default router;
