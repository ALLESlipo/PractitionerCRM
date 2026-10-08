import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { randomToken, sha256Hex } from "@/lib/crypto";

// Data access layer for authentication. Every page and action that touches
// practitioner or client data goes through requireVerified() / requireAdmin().

const COOKIE = "crm_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: "practitioner" | "admin";
  verified: boolean;
};

export const hashPassword = (password: string) => hash(password); // Argon2id defaults
export const verifyPassword = (passwordHash: string, password: string) => verify(passwordHash, password);

export async function createSession(practitionerId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { practitionerId, tokenHash: sha256Hex(token), expiresAt } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
  jar.delete(COOKIE);
}

/** The logged-in practitioner, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256Hex(token) },
    include: { practitioner: { select: { id: true, fullName: true, email: true, role: true, verified: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.practitioner;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** A verified practitioner (flow A4). Unverified accounts go to onboarding, admins to /admin. */
export async function requireVerified(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  if (!user.verified) redirect("/onboarding");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

/** Where a user should land after logging in. */
export const homeFor = (user: Pick<CurrentUser, "role" | "verified">) =>
  user.role === "admin" ? "/admin" : user.verified ? "/" : "/onboarding";
