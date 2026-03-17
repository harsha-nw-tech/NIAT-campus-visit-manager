import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function generateToken(userId: number, role: string, phoneNumber: string): string {
  const payload = JSON.stringify({ userId, role, phoneNumber, ts: Date.now() });
  const encoded = Buffer.from(payload).toString("base64");
  const secret = process.env.SESSION_SECRET || "niat-secret-key";
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string; phoneNumber: string } | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const secret = process.env.SESSION_SECRET || "niat-secret-key";
    const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("hex");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    return { userId: payload.userId, role: payload.role, phoneNumber: payload.phoneNumber };
  } catch {
    return null;
  }
}

export async function loginUser(phoneNumber: string, password: string) {
  const hashedPw = hashPassword(password);
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.phoneNumber, phoneNumber))
    .limit(1);

  if (!users.length) return null;
  const user = users[0];
  if (user.password !== hashedPw) return null;
  return user;
}

export async function createUser(phoneNumber: string, password: string, role: "admin" | "sales") {
  const hashedPw = hashPassword(password);
  const result = await db
    .insert(usersTable)
    .values({ phoneNumber, password: hashedPw, plainPassword: password, role })
    .returning();
  return result[0];
}

export async function updateUserCredentials(
  id: number,
  phoneNumber: string,
  password: string,
) {
  const hashedPw = hashPassword(password);
  const result = await db
    .update(usersTable)
    .set({ phoneNumber, password: hashedPw, plainPassword: password })
    .where(eq(usersTable.id, id))
    .returning();
  return result[0];
}

export async function seedAdminIfNeeded() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
  if (!existing.length) {
    await createUser("admin", "admin123", "admin");
    console.log("Seeded default admin: phoneNumber=admin, password=admin123");
  } else {
    // Backfill plain_password for existing admin if missing
    const admin = existing[0];
    if (!admin.plainPassword) {
      await db
        .update(usersTable)
        .set({ plainPassword: "admin123" })
        .where(eq(usersTable.id, admin.id));
    }
  }
}
