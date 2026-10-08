import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { decrypt, decryptOptional } from "@/lib/crypto";
import type { CurrentUser } from "@/lib/auth";
import type { Client } from "@/generated/prisma/client";

// Client data access. Every lookup is scoped to the logged-in practitioner on the
// server; a client ID from the browser is never trusted on its own.

export type ClientDetails = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  sex: "F" | "M" | "other" | null;
  notes: string | null;
  createdAt: Date;
  archivedAt: Date | null;
};

export function decryptClient(c: Client): ClientDetails {
  return {
    id: c.id,
    fullName: decrypt(c.fullNameEnc),
    email: decrypt(c.emailEnc),
    phone: decryptOptional(c.phoneEnc),
    dateOfBirth: decryptOptional(c.dateOfBirthEnc),
    sex: c.sex as ClientDetails["sex"],
    notes: decryptOptional(c.notesEnc),
    createdAt: c.createdAt,
    archivedAt: c.archivedAt,
  };
}

/** The client if it belongs to this practitioner; otherwise logs the attempt and returns null. */
export async function getOwnedClient(user: CurrentUser, clientId: string) {
  const isUuid = /^[0-9a-f-]{36}$/i.test(clientId);
  const client = isUuid
    ? await db.client.findFirst({ where: { id: clientId, practitionerId: user.id } })
    : null;
  if (!client) {
    await audit(user.id, "access_denied", "client", clientId.slice(0, 64));
    return null;
  }
  return client;
}

/** C1 Client list: names are encrypted, so search runs here after decrypting this practitioner's list. */
export async function listClients(user: CurrentUser, opts: { query?: string; archived?: boolean }) {
  const rows = await db.client.findMany({
    where: { practitionerId: user.id, archivedAt: opts.archived ? { not: null } : null },
    include: { testKits: { select: { kitCode: true, status: true }, orderBy: { createdAt: "desc" } } },
  });
  const q = opts.query?.trim().toLowerCase();
  return rows
    .map((r) => ({ ...decryptClient(r), kits: r.testKits }))
    .filter(
      (c) =>
        !q ||
        [c.fullName, c.email, c.phone ?? "", ...c.kits.map((k) => k.kitCode)].some((v) => v.toLowerCase().includes(q)),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}
