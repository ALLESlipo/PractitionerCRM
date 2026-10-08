import Link from "next/link";
import { db } from "@/lib/db";
import { requireVerified } from "@/lib/auth";
import { listClients } from "@/lib/clients";
import { kitStatusLabel } from "@/lib/kits";
import { formatDate } from "@/lib/format";
import { ButtonLink, Card, Empty, PageHeader } from "@/components/ui";

export default async function Dashboard() {
  const user = await requireVerified();
  const [kitCounts, clients] = await Promise.all([
    db.testKit.groupBy({
      by: ["status"],
      where: { client: { practitionerId: user.id, archivedAt: null } },
      _count: true,
    }),
    listClients(user, {}),
  ]);
  const count = (s: string) => kitCounts.find((k) => k.status === s)?._count ?? 0;
  const recent = [...clients].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 6);

  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName}`} actions={<ButtonLink href="/clients/new">New client</ButtonLink>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Active clients" value={clients.length} href="/clients" />
        {(["awaiting_results", "results_uploaded", "sent_to_client"] as const).map((s) => (
          <Stat key={s} label={`Kits · ${kitStatusLabel[s].toLowerCase()}`} value={count(s)} />
        ))}
      </div>
      <Card title="Recently added clients">
        {recent.length === 0 ? (
          <Empty>No clients yet. Add your first client with the kit ID and access code from the Mimatest box.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <Link href={`/clients/${c.id}`} className="font-medium text-teal-700 hover:underline">
                  {c.fullName}
                </Link>
                <span className="text-slate-500">{formatDate(c.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </>
  );
  const cls = "block rounded-lg border border-slate-200 bg-white p-4 shadow-sm";
  return href ? <Link href={href} className={`${cls} hover:border-teal-300`}>{body}</Link> : <div className={cls}>{body}</div>;
}
