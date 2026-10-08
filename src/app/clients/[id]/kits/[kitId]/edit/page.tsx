import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { dateColumnToIso } from "@/lib/format";
import { updateKit } from "@/app/actions/clients";
import { ActionForm, SubmitButton } from "@/components/forms";
import { KitFields } from "@/components/client-fields";
import { ButtonLink, Field, Input, PageHeader } from "@/components/ui";

// C4 Correct a kit ID or access code.
export default async function EditKitPage({ params }: PageProps<"/clients/[id]/kits/[kitId]/edit">) {
  const user = await requireVerified();
  const { id, kitId } = await params;
  const kit = /^[0-9a-f-]{36}$/i.test(kitId)
    ? await db.testKit.findFirst({
        where: { id: kitId, clientId: id, client: { practitionerId: user.id, archivedAt: null } },
        include: { client: true },
      })
    : null;
  if (!kit) notFound();
  const name = decrypt(kit.client.fullNameEnc);

  return (
    <>
      <PageHeader title={`Edit kit ${kit.kitCode}`} back={{ href: `/clients/${id}`, label: name }} />
      <ActionForm action={updateKit.bind(null, kit.id)} className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <KitFields kitCode={kit.kitCode} editing />
        <Field label="Sample date">
          <Input name="sampleDate" type="date" defaultValue={kit.sampleDate ? dateColumnToIso(kit.sampleDate) : ""} />
        </Field>
        <div className="flex gap-2 sm:col-span-2">
          <SubmitButton>Save changes</SubmitButton>
          <ButtonLink href={`/clients/${id}`} variant="secondary">Cancel</ButtonLink>
        </div>
      </ActionForm>
    </>
  );
}
