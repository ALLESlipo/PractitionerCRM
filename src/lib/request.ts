import "server-only";
import { headers } from "next/headers";
import { isIP } from "node:net";

/** Client IP for the audit log, or null if unknown / not a valid address. */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip");
  if (!ip) return null;
  const cleaned = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  return isIP(cleaned) ? cleaned : null;
}
