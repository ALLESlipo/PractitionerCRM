"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireVerified } from "@/lib/auth";
import { getOwnedClient } from "@/lib/clients";
import { emailHash, encrypt, encryptOptional } from "@/lib/crypto";
import { EMAIL_RE, FormError, type FormState, handle, required, text } from "@/lib/form";
import { normalizeAccessCode, normalizeKitCode } from "@/lib/kits";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@/generated/prisma/client";

function clientFields(form: FormData) {
  const fullName = required(form, "fullName", "Full name");
  const email = required(form, "email", "Email").toLowerCase();
  if (!EMAIL_RE.test(email)) throw new FormError("Enter a valid email address.");
  const dateOfBirth = text(form, "dateOfBirth");
  if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) throw new FormError("Enter a valid date of birth.");
  const sex = text(form, "sex");
  if (sex && !["F", "M", "other"].includes(sex)) throw new FormError("Invalid value for sex.");

  // practitioner_id is never read from the form; it comes from the session.
  return {
    fullNameEnc: encrypt(fullName),
    emailEnc: encrypt(email),
    emailHash: emailHash(email),
    phoneEnc: encryptOptional(text(form, "phone")),
    dateOfBirthEnc: encryptOptional(dateOfBirth),
    sex,
    notesEnc: encryptOptional(text(form, "notes")),
  };
}

/** Rate-limit kit ID entry so codes can't be probed by guessing (rule: rate limiting). */
function checkKitRate(practitionerId: string) {
  if (!rateLimit(`kit:${practitionerId}`, 30, 15 * 60 * 1000))
    throw new FormError("Too many kit ID attempts. Please wait a few minutes.");
}

function uniqueError(e: unknown): FormError | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;
  const target = JSON.stringify(e.meta ?? {});
  if (target.includes("kit_code")) return new FormError("This kit ID is already registered.");
  if (target.includes("email")) return new FormError("You already have an active client with this email.");
  return new FormError("This record already exists.");
}

// C2 Create client, with the kit ID + access code from the Mimatest box.
export async function createClient(_: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireVerified();
    const data = clientFields(form);
    checkKitRate(user.id);
    const kitCode = normalizeKitCode(text(form, "kitCode"));
    const accessCodeEnc = encrypt(normalizeAccessCode(text(form, "accessCode")));

    let clientId: string;
    try {
      ({ id: clientId } = await db.client.create({
        data: { ...data, practitionerId: user.id, testKits: { create: { kitCode, accessCodeEnc } } },
        select: { id: true },
      }));
    } catch (e) {
      throw uniqueError(e) ?? e;
    }
    await audit(user.id, "create", "client", clientId);
    revalidatePath("/clients");
    redirect(`/clients/${clientId}`);
  });
}

// C4 Edit client details.
export async function updateClient(clientId: string, _: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireVerified();
    const client = await getOwnedClient(user, clientId);
    if (!client) throw new FormError("Client not found.");
    try {
      await db.client.update({ where: { id: client.id }, data: clientFields(form) });
    } catch (e) {
      throw uniqueError(e) ?? e;
    }
    await audit(user.id, "update", "client", client.id);
    revalidatePath(`/clients/${client.id}`);
    redirect(`/clients/${client.id}`);
  });
}

// C5 Archive client (soft delete; data kept).
export async function archiveClient(clientId: string) {
  const user = await requireVerified();
  const client = await getOwnedClient(user, clientId);
  if (!client) redirect("/clients");
  await db.client.update({ where: { id: client.id }, data: { archivedAt: new Date() } });
  await audit(user.id, "archive", "client", client.id);
  revalidatePath("/clients");
  redirect("/clients");
}

export async function restoreClient(clientId: string): Promise<FormState> {
  return handle(async () => {
    const user = await requireVerified();
    const client = await getOwnedClient(user, clientId);
    if (!client) throw new FormError("Client not found.");
    try {
      await db.client.update({ where: { id: client.id }, data: { archivedAt: null } });
    } catch (e) {
      throw uniqueError(e) ?? e;
    }
    await audit(user.id, "update", "client", client.id);
    revalidatePath(`/clients/${client.id}`);
    revalidatePath("/clients");
  });
}

// Add another kit to an existing client.
export async function addKit(clientId: string, _: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireVerified();
    const client = await getOwnedClient(user, clientId);
    if (!client || client.archivedAt) throw new FormError("Client not found.");
    checkKitRate(user.id);
    const kitCode = normalizeKitCode(text(form, "kitCode"));
    const accessCodeEnc = encrypt(normalizeAccessCode(text(form, "accessCode")));
    let kitId: string;
    try {
      ({ id: kitId } = await db.testKit.create({ data: { clientId: client.id, kitCode, accessCodeEnc } }));
    } catch (e) {
      throw uniqueError(e) ?? e;
    }
    await audit(user.id, "create", "test_kit", kitId);
    revalidatePath(`/clients/${client.id}`);
    redirect(`/clients/${client.id}`);
  });
}

// C4 Correct a kit ID or access code.
export async function updateKit(kitId: string, _: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireVerified();
    const kit = await db.testKit.findFirst({ where: { id: kitId, client: { practitionerId: user.id } } });
    if (!kit) {
      await audit(user.id, "access_denied", "test_kit", kitId.slice(0, 64));
      throw new FormError("Kit not found.");
    }
    checkKitRate(user.id);
    const kitCode = normalizeKitCode(text(form, "kitCode"));
    const accessCode = text(form, "accessCode");
    const sampleDate = text(form, "sampleDate");
    if (sampleDate && !/^\d{4}-\d{2}-\d{2}$/.test(sampleDate)) throw new FormError("Enter a valid sample date.");
    try {
      await db.testKit.update({
        where: { id: kit.id },
        data: {
          kitCode,
          // Blank keeps the current access code.
          ...(accessCode && { accessCodeEnc: encrypt(normalizeAccessCode(accessCode)) }),
          sampleDate: sampleDate ? new Date(`${sampleDate}T00:00:00Z`) : null,
        },
      });
    } catch (e) {
      throw uniqueError(e) ?? e;
    }
    await audit(user.id, "update", "test_kit", kit.id);
    revalidatePath(`/clients/${kit.clientId}`);
    redirect(`/clients/${kit.clientId}`);
  });
}
