"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { FormError, type FormState, file, handle } from "@/lib/form";
import { storeUpload } from "@/lib/storage";

// A2 Upload credentials (license, diplomas) — PDF or image, private storage.
export async function uploadCredential(_: FormState, form: FormData): Promise<FormState> {
  return handle(async () => {
    const user = await requireUser();
    if (user.role !== "practitioner" || user.verified) throw new FormError("Your account is already verified.");
    const upload = file(form, "file");
    if (!upload) throw new FormError("Choose a file to upload.");

    const stored = await storeUpload(upload, `credentials/${user.id}`, ["pdf", "jpeg", "png"]);
    const cred = await db.practitionerCredential.create({
      data: {
        practitionerId: user.id,
        filePath: stored.filePath,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
      },
    });
    await audit(user.id, "upload", "credential", cred.id);
    revalidatePath("/onboarding");
    return { ok: `Uploaded ${stored.originalName}.` };
  });
}
