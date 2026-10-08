import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";

// A3 Admin review: practitioners waiting for verification.
export default async function AdminPage() {
  await requireAdmin();
  const practitioners = await db.practitioner.findMany({
    where: { role: "practitioner" },
    include: { credentials: { select: { reviewStatus: true } } },
    orderBy: { createdAt: "desc" },
  });
  const waiting = practitioners.filter((p) => !p.verified);
  const verified = practitioners.filter((p) => p.verified);

  return (
    <>
      <PageHeader title="Practitioner review" />
      <div className="space-y-6">
        <Card title={`Awaiting verification (${waiting.length})`}>
          {waiting.length === 0 ? <Empty>No practitioners are waiting.</Empty> : <PractitionerTable rows={waiting} />}
        </Card>
        <Card title={`Verified (${verified.length})`}>
          {verified.length === 0 ? <Empty>No verified practitioners yet.</Empty> : <PractitionerTable rows={verified} />}
        </Card>
      </div>
    </>
  );
}

function PractitionerTable({
  rows,
}: {
  rows: { id: string; fullName: string; email: string; createdAt: Date; credentials: { reviewStatus: string }[] }[];
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-slate-500">
        <tr>
          <th className="pb-2 font-medium">Name</th>
          <th className="hidden pb-2 font-medium sm:table-cell">Email</th>
          <th className="pb-2 font-medium">Documents</th>
          <th className="hidden pb-2 font-medium sm:table-cell">Signed up</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((p) => {
          const pending = p.credentials.filter((c) => c.reviewStatus === "pending").length;
          return (
            <tr key={p.id}>
              <td className="py-2.5">
                <Link href={`/admin/practitioners/${p.id}`} className="font-medium text-teal-700 hover:underline">
                  {p.fullName}
                </Link>
              </td>
              <td className="hidden py-2.5 text-slate-600 sm:table-cell">{p.email}</td>
              <td className="py-2.5">
                {p.credentials.length === 0 ? (
                  <span className="text-slate-400">None yet</span>
                ) : pending > 0 ? (
                  <Badge tone="amber">{pending} to review</Badge>
                ) : (
                  <span className="text-slate-600">{p.credentials.length} reviewed</span>
                )}
              </td>
              <td className="hidden py-2.5 text-slate-600 sm:table-cell">{formatDate(p.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
