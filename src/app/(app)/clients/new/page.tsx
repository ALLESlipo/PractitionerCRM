import { requireVerified } from "@/lib/auth";
import { createClient } from "@/app/actions/clients";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ClientFields, KitFields } from "@/components/client-fields";
import { ButtonLink, PageHeader } from "@/components/ui";

// C2 Create client
export default async function NewClientPage() {
  await requireVerified();
  return (
    <>
      <PageHeader title="New client" back={{ href: "/clients", label: "Clients" }} />
      <ActionForm action={createClient} className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <ClientFields />
        <h2 className="mt-2 font-semibold text-slate-800 sm:col-span-2">Mimatest kit</h2>
        <KitFields />
        <div className="flex gap-2 sm:col-span-2">
          <SubmitButton>Add client</SubmitButton>
          <ButtonLink href="/clients" variant="secondary">Cancel</ButtonLink>
        </div>
      </ActionForm>
    </>
  );
}
