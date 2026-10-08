import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireVerified } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { decryptClient, getOwnedClient } from "@/lib/clients";
import { kitStatusLabel } from "@/lib/kits";
import { dateColumnToIso, formatDate, formatIsoDate, sexLabel } from "@/lib/format";
import { archiveClient, restoreClient } from "@/app/actions/clients";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/forms";
import { Badge, ButtonLink, Card, Empty, Notice, PageHeader, kitTone } from "@/components/ui";

// C3 View client: details, kits, documents, sent emails and chatbot history.
export default async function ClientPage({ params }: PageProps<"/clients/[id]">) {
  const user = await requireVerified();
  const { id } = await params;
  const row = await getOwnedClient(user, id);
  if (!row) notFound();
  await audit(user.id, "view", "client", row.id);

  const client = decryptClient(row);
  const [kits, documentCount, emailCount] = await Promise.all([
    db.testKit.findMany({ where: { clientId: row.id }, orderBy: { createdAt: "desc" } }),
    db.clientDocument.count({ where: { clientId: row.id, archivedAt: null } }),
    db.emailMessage.count({ where: { clientId: row.id } }),
  ]);
  const archived = client.archivedAt !== null;

  const details: [string, string | null][] = [
    ["Email", client.email],
    ["Phone", client.phone],
    ["Date of birth", client.dateOfBirth && formatIsoDate(client.dateOfBirth)],
    ["Sex", client.sex && sexLabel[client.sex]],
    ["Client since", formatDate(client.createdAt)],
  ];

  return (
    <>
      <PageHeader
        title={client.fullName}
        back={{ href: archived ? "/clients?archived=1" : "/clients", label: "Clients" }}
        actions={
          archived ? (
            <ActionForm action={restoreClient.bind(null, row.id)}>
              <SubmitButton variant="secondary">Restore client</SubmitButton>
            </ActionForm>
          ) : (
            <>
              <ButtonLink href={`/clients/${row.id}/edit`} variant="secondary">Edit</ButtonLink>
              <form action={archiveClient.bind(null, row.id)}>
                <ConfirmSubmit message={`Archive ${client.fullName}? They will be hidden from your lists. Their data is kept.`}>
                  Archive
                </ConfirmSubmit>
              </form>
            </>
          )
        }
      />
      {archived && (
        <div className="mb-6">
          <Notice tone="amber">This client was archived on {formatDate(client.archivedAt!)}.</Notice>
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Details">
          <dl className="space-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-words text-slate-800">{value || "—"}</dd>
              </div>
            ))}
          </dl>
          {client.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm text-slate-700">{client.notes}</p>
          )}
        </Card>
        <div className="space-y-6 md:col-span-2">
          <Card
            title="Test kits"
            actions={!archived && <ButtonLink href={`/clients/${row.id}/kits/new`} variant="secondary">Add kit</ButtonLink>}
          >
            {kits.length === 0 ? (
              <Empty>No kits.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {kits.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-slate-800">{k.kitCode}</span>
                        <Badge tone={kitTone[k.status]}>{kitStatusLabel[k.status]}</Badge>
                      </div>
                      <details className="text-sm text-slate-600">
                        <summary className="cursor-pointer select-none text-slate-500 hover:text-slate-800">Show access code</summary>
                        <span className="font-mono">{decrypt(k.accessCodeEnc)}</span>
                      </details>
                      <div className="text-xs text-slate-500">
                        Added {formatDate(k.createdAt)}
                        {k.sampleDate && ` · sample taken ${formatIsoDate(dateColumnToIso(k.sampleDate))}`}
                      </div>
                    </div>
                    {!archived && (
                      <ButtonLink href={`/clients/${row.id}/kits/${k.id}/edit`} variant="secondary">Edit</ButtonLink>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Documents">
            <Empty>
              {documentCount === 0 ? "No documents yet." : `${documentCount} documents.`} Uploading the Mimatest report and food
              guide comes in the next step (flow D).
            </Empty>
          </Card>
          <Card title="Emails">
            <Empty>{emailCount === 0 ? "No emails sent yet." : `${emailCount} emails sent.`}</Empty>
          </Card>
        </div>
      </div>
    </>
  );
}
