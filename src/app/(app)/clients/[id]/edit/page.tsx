import { notFound } from "next/navigation";
import { requireVerified } from "@/lib/auth";
import { decryptClient, getOwnedClient } from "@/lib/clients";
import { updateClient } from "@/app/actions/clients";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ClientFields } from "@/components/client-fields";
import { ButtonLink, PageHeader } from "@/components/ui";

// C4 Edit client
export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  const user = await requireVerified();
  const { id } = await params;
  const row = await getOwnedClient(user, id);
  if (!row || row.archivedAt) notFound();
  const client = decryptClient(row);

  return (
    <>
      <PageHeader title={`Edit ${client.fullName}`} back={{ href: `/clients/${id}`, label: client.fullName }} />
      <ActionForm action={updateClient.bind(null, id)} className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <ClientFields client={client} />
        <div className="flex gap-2 sm:col-span-2">
          <SubmitButton>Save changes</SubmitButton>
          <ButtonLink href={`/clients/${id}`} variant="secondary">Cancel</ButtonLink>
        </div>
      </ActionForm>
    </>
  );
}
