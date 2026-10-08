import "server-only";
import { FormError } from "@/lib/form";

// Kit IDs and access codes are printed in the Mimatest box (e.g. DBUQEK822449, RDA7286427725E).
export function normalizeKitCode(raw: string | null): string {
  const code = (raw ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{8,20}$/.test(code)) throw new FormError("Kit ID must be 8–20 letters or digits, as printed in the box.");
  return code;
}

export function normalizeAccessCode(raw: string | null): string {
  const code = (raw ?? "").replace(/\s/g, "");
  if (!/^[A-Za-z0-9-]{4,64}$/.test(code)) throw new FormError("Access code must be 4–64 letters, digits or dashes.");
  return code;
}

export const kitStatusLabel: Record<string, string> = {
  awaiting_results: "Awaiting results",
  results_uploaded: "Results uploaded",
  sent_to_client: "Sent to client",
};
