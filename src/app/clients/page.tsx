import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { listClients } from "@/lib/clients";
import { kitStatusLabel } from "@/lib/kits";
import { Badge, Button, ButtonLink, Card, Empty, Input, PageHeader, kitTone } from "@/components/ui";

// C1 Client list: only own clients; archived ones on a separate view.
export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const user = await requireVerified();
  const { q, archived } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const showArchived = archived === "1";
  const clients = await listClients(user, { query, archived: showArchived });

  return (
    <>
      <PageHeader
        title={showArchived ? "Archived clients" : "Clients"}
        actions={<ButtonLink href="/clients/new">New client</ButtonLink>}
      />
      <form className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full max-w-sm">
          <Input name="q" placeholder="Search name, email, phone, kit ID…" defaultValue={query} />
        </div>
        {showArchived && <input type="hidden" name="archived" value="1" />}
        <Button type="submit" variant="secondary">Search</Button>
        <Link href={showArchived ? "/clients" : "/clients?archived=1"} className="ml-auto text-sm text-slate-500 hover:text-slate-800">
          {showArchived ? "Show active clients" : "Show archived clients"}
        </Link>
      </form>
      <Card>
        {clients.length === 0 ? (
          <Empty>{query ? "No clients match your search." : showArchived ? "No archived clients." : "No clients yet."}</Empty>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2 font-medium">Name</th>
                <th className="hidden pb-2 font-medium md:table-cell">Email</th>
                <th className="pb-2 font-medium">Latest kit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => {
                const kit = c.kits[0];
                return (
                  <tr key={c.id}>
                    <td className="py-2.5">
                      <Link href={`/clients/${c.id}`} className="font-medium text-teal-700 hover:underline">
                        {c.fullName}
                      </Link>
                    </td>
                    <td className="hidden py-2.5 text-slate-600 md:table-cell">{c.email}</td>
                    <td className="py-2.5">
                      {kit && (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-600">{kit.kitCode}</span>
                          <Badge tone={kitTone[kit.status]}>{kitStatusLabel[kit.status]}</Badge>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
