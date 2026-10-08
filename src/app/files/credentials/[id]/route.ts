import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { readStored } from "@/lib/storage";

// Credential files are private: visible to admins and to the practitioner who uploaded them.
export async function GET(_req: Request, ctx: RouteContext<"/files/credentials/[id]">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { id } = await ctx.params;
  const cred = /^[0-9a-f-]{36}$/i.test(id) ? await db.practitionerCredential.findUnique({ where: { id } }) : null;
  if (!cred || (user.role !== "admin" && cred.practitionerId !== user.id)) {
    await audit(user.id, "access_denied", "credential", id.slice(0, 64));
    return new Response("Not found", { status: 404 });
  }
  await audit(user.id, "view", "credential", cred.id);
  const body = await readStored(cred.filePath);
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": cred.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(cred.originalName)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
