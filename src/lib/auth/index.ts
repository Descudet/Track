import crypto from "crypto";
import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db, ensureDbInitialized } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

export const SESSION_COOKIE_NAME = "track_session";
export const SESSION_DURATION_DAYS = 30;
export const DEFAULT_USER_ID = "default_user";

/**
 * Hash password securely with scrypt + random salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Create a persistent session in DB and set HTTP-only cookie
 */
export async function createSession(userId: string): Promise<string> {
  await ensureDbInitialized();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

  await db.insert(sessions).values({
    id: sessionToken,
    userId,
    expiresAt,
    createdAt: now,
  });

  const isHttps = Boolean(
    process.env.VERCEL === "1" ||
      (process.env.NEXT_PUBLIC_APP_URL &&
        process.env.NEXT_PUBLIC_APP_URL.startsWith("https"))
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });

  // Client-readable backup cookie to survive cross-origin or local network HTTP mobile quirks
  cookieStore.set("track_user_id", userId, {
    httpOnly: false,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });

  return sessionToken;
}

/**
 * Invalidate current session
 */
export async function destroySession(): Promise<void> {
  await ensureDbInitialized();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionToken));
    } catch (err) {
      console.warn("Could not delete session from DB:", err);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete("track_user_id");
}

/**
 * Retrieve currently authenticated user or null
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string | null;
  displayName: string;
} | null> {
  await ensureDbInitialized();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const backupUserId = cookieStore.get("track_user_id")?.value;

  if (sessionToken) {
    const now = Date.now();

    // Find valid unexpired session
    const sessionRow = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionToken), gt(sessions.expiresAt, now)))
      .get();

    if (sessionRow) {
      const userRow = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, sessionRow.userId))
        .get();

      if (userRow) return userRow;
    }
  }

  // Fallback to client-readable backup cookie if httpOnly cookie was delayed on mobile
  if (backupUserId) {
    const userRow = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
      })
      .from(users)
      .where(eq(users.id, backupUserId))
      .get();

    if (userRow) return userRow;
  }

  return null;
}

/**
 * Helper to get the active user ID for server actions
 * Returns logged in user's ID, or fallback to DEFAULT_USER_ID if unauthenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  return user?.id || DEFAULT_USER_ID;
}
