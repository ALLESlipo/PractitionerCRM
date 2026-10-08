import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { reviewCredential, verifyPractitioner } from "@/app/actions/admin";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Button, Card, Empty, Notice, PageHeader, Select, Textarea, reviewLabel, reviewTone } from "@/components/ui";

export default async function AdminPractitionerPage({ params }: PageProps<"/admin/practitioners/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const p = /^[0-9a-f-]{36}$/i.test(id)
    ? await db.practitioner.findFirst({
        where: { id, role: "practitioner" },
        include: { credentials: { orderBy: { createdAt: "desc" }, include: { reviewer: { select: { fullName: true } } } } },
      })
    : null;
  if (!p) notFound();

  const statuses = p.credentials.map((c) => c.reviewStatus);
  const canVerify = !p.verified && statuses.includes("approved") && !statuses.includes("pending");

  return (
    <>
      <PageHeader
        title={p.fullName}
        subtitle={`${p.email} · signed up ${formatDateTime(p.createdAt)}`}
        back={{ href: "/admin", label: "Practitioner review" }}
        actions={p.verified ? <Badge tone="green">Verified</Badge> : <Badge>Not verified</Badge>}
      />
      <div className="max-w-3xl space-y-6">
        {!p.verified && (
          <Card title="Verify account">
            {canVerify ? (
              <form action={verifyPractitioner.bind(null, p.id)} className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-600">All documents are reviewed. Verifying unlocks the dashboard for this practitioner.</p>
                <Button type="submit">Verify account</Button>
              </form>
            ) : (
              <Empty>Review every document, approving at least one, before verifying.</Empty>
            )}
          </Card>
        )}

        <Card title="Credentials">
          {p.credentials.length === 0 ? (
            <Empty>The practitioner has not uploaded any documents yet.</Empty>
          ) : (
            <ul className="space-y-5">
              {p.credentials.map((c) => (
                <li key={c.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={`/files/credentials/${c.id}`}
                      target="_blank"
                      rel="noopener"
                      className="text-sm font-medium text-teal-700 hover:underline"
                    >
                      {c.originalName}
                    </a>
                    <Badge tone={reviewTone[c.reviewStatus]}>{reviewLabel[c.reviewStatus]}</Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    Uploaded {formatDateTime(c.createdAt)}
                    {c.reviewedAt && ` · reviewed ${formatDateTime(c.reviewedAt)}${c.reviewer ? ` by ${c.reviewer.fullName}` : ""}`}
                  </div>
                  {c.reviewerNote && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">Note: {c.reviewerNote}</p>}
                  {!p.verified && (
                    <ActionForm action={reviewCredential.bind(null, c.id)} className="mt-3 grid gap-2 sm:grid-cols-[12rem_1fr_auto] sm:items-start">
                      <Select name="decision" defaultValue={c.reviewStatus === "pending" ? "" : c.reviewStatus} required>
                        <option value="" disabled>Decision…</option>
                        <option value="approved">Approve</option>
                        <option value="needs_info">Request more info</option>
                        <option value="rejected">Reject</option>
                      </Select>
                      <Textarea name="note" rows={1} placeholder="Note to the practitioner (required unless approving)" />
                      <SubmitButton>Save</SubmitButton>
                    </ActionForm>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {p.verified && <Notice tone="green">This account is verified.</Notice>}
      </div>
    </>
  );
}
