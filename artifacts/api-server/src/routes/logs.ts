import { Router } from "express";
import { requireAuth, AuthRequest } from "../middlewares/auth.js";
import { db, auditLogsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/logs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber, performedBy, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (phoneNumber) {
      conditions.push(eq(auditLogsTable.phoneNumber, phoneNumber));
    }
    if (performedBy) {
      conditions.push(eq(auditLogsTable.performedBy, performedBy));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogsTable)
        .where(where)
        .orderBy(desc(auditLogsTable.timestamp))
        .limit(limitNum)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(auditLogsTable)
        .where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    res.json({
      logs: logs.map((l) => ({
        ...l,
        timestamp: l.timestamp?.toISOString(),
      })),
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err: any) {
    console.error("Get logs error:", err);
    res.status(500).json({ error: "Failed", message: err.message });
  }
});

export default router;
