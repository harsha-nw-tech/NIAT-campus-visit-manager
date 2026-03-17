import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actionType: varchar("action_type", { length: 50 }).notNull(),
  performedBy: text("performed_by").notNull(),
  performerPhone: varchar("performer_phone", { length: 20 }).notNull(),
  targetUserId: text("target_user_id"),
  applicationId: text("application_id"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogsTable).omit({ id: true, timestamp: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogsTable.$inferSelect;
