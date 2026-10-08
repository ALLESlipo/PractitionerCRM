import { notFound } from "next/navigation";
import { requireVerified } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { getOwnedClient } from "@/lib/clients";
import { addKit } from "@/app/actions/clients";
import { ActionForm, SubmitButton } from "@/components/forms";
import { KitFields } from "@/components/client-fields";
import { ButtonLink, PageHeader } from "@/components/ui";

export default async function NewKitPage({ params }: PageProps<"/clients/[id]/kits/new">) {
  const user = await requireVerified();
  const { id } = await params;
  const row = await getOwnedClient(user, id);
  if (!row || row.archivedAt) notFound();
  const name = decrypt(row.fullNameEnc);

  return (
    <>
      <PageHeader title={`Add kit · ${name}`} back={{ href: `/clients/${id}`, label: name }} />
      <ActionForm action={addKit.bind(null, id)} className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <KitFields />
        <div className="flex gap-2 sm:col-span-2">
          <SubmitButton>Add kit</SubmitButton>
          <ButtonLink href={`/clients/${id}`} variant="secondary">Cancel</ButtonLink>
        </div>
      </ActionForm>
    </>
  );
}
