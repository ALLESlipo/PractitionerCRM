"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession, destroySession, getCurrentUser, hashPassword, homeFor, verifyPassword } from "@/lib/auth";
import { clientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { EMAIL_RE, FormError, type FormState, handle, required } from "@/lib/form";
import { Prisma } from "@/generated/prisma/client";

const MIN_PASSWORD = 12;

// A1 Sign up
export async function signup(_: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60 * 1000))
      throw new FormError("Too many sign-up attempts. Please try again later.");

    const fullName = required(form, "fullName", "Full name");
    const email = required(form, "email", "Email").toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!EMAIL_RE.test(email)) throw new FormError("Enter a valid email address.");
    if (password.length < MIN_PASSWORD) throw new FormError(`Password must be at least ${MIN_PASSWORD} characters.`);
    if (password !== form.get("passwordConfirm")) throw new FormError("Passwords do not match.");

    let id: string;
    try {
      ({ id } = await db.practitioner.create({
        data: { fullName, email, passwordHash: await hashPassword(password) },
        select: { id: true },
      }));
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        throw new FormError("An account with this email already exists.");
      throw e;
    }
    await audit(id, "signup", "practitioner", id);
    await createSession(id);
    redirect("/onboarding");
  });
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const email = required(form, "email", "Email").toLowerCase();
    const password = String(form.get("password") ?? "");
    const ip = await clientIp();
    if (!rateLimit(`login:${ip}`, 20, 15 * 60 * 1000) || !rateLimit(`login:${email}`, 8, 15 * 60 * 1000))
      throw new FormError("Too many login attempts. Please wait 15 minutes and try again.");

    const user = await db.practitioner.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      await audit(user?.id ?? null, "login_failed", "practitioner", user?.id);
      throw new FormError("Email or password is incorrect.");
    }
    await audit(user.id, "login", "practitioner", user.id);
    await createSession(user.id);
    redirect(homeFor(user));
  });
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, "logout", "practitioner", user.id);
  redirect("/login");
}
