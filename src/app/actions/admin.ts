"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { FormError, type FormState, handle, text } from "@/lib/form";
import { uniqueSlug } from "@/lib/slug";

const DECISIONS = { approved: "approve", needs_info: "request_info", rejected: "reject" } as const;
type Decision = keyof typeof DECISIONS;

// A3 Admin review: set one credential file to approved / needs_info / rejected.
export async function reviewCredential(credentialId: string, _: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const admin = await requireAdmin();
    const decision = text(form, "decision") as Decision | null;
    if (!decision || !(decision in DECISIONS)) throw new FormError("Choose a decision.");
    const note = text(form, "note");
    if (decision !== "approved" && !note) throw new FormError("Add a note explaining what is missing or wrong.");

    const cred = await db.practitionerCredential.update({
      where: { id: credentialId },
      data: { reviewStatus: decision, reviewerNote: note, reviewedBy: admin.id, reviewedAt: new Date() },
      include: { practitioner: { select: { email: true, fullName: true } } },
    });
    await audit(admin.id, DECISIONS[decision], "credential", cred.id);

    // A3a Request more info: email the practitioner with the reviewer note.
    if (decision === "needs_info") {
      await sendMail(
        cred.practitioner.email,
        "More information needed for your account",
        `Hello ${cred.practitioner.fullName},\n\nWe reviewed "${cred.originalName}" and need more information:\n\n${note}\n\nPlease log in and upload the requested documents.`,
      );
    }
    revalidatePath(`/admin/practitioners/${cred.practitionerId}`);
    revalidatePath("/admin");
  });
}

// A4 Account verified: allowed once at least one file is approved and none await review.
// Files marked needs_info do not block: the practitioner's re-upload replaces them.
export async function verifyPractitioner(practitionerId: string) {
  const admin = await requireAdmin();
  const p = await db.practitioner.findUniqueOrThrow({
    where: { id: practitionerId },
    include: { credentials: { select: { reviewStatus: true } } },
  });
  const statuses = p.credentials.map((c) => c.reviewStatus);
  if (!statuses.includes("approved") || statuses.includes("pending"))
    throw new Error("All uploaded files must be reviewed, with at least one approved.");

  await db.$transaction(async (tx) => {
    await tx.practitioner.update({ where: { id: p.id }, data: { verified: true } });
    // A profile row is created so flow B can start.
    await tx.practitionerProfile.upsert({
      where: { practitionerId: p.id },
      create: { practitionerId: p.id, displayName: p.fullName, slug: await uniqueSlug(tx, p.fullName) },
      update: {},
    });
  });
  await audit(admin.id, "verify", "practitioner", p.id);
  await sendMail(p.email, "Your account is verified", `Hello ${p.fullName},\n\nYour account has been verified. You can now log in and add clients.`);
  revalidatePath("/admin", "layout");
}
