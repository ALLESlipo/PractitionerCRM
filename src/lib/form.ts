// Shared helpers for Server Actions that read FormData.

export type FormState = { error?: string; ok?: string } | undefined;

export function text(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}

export function file(form: FormData, key: string): File | null {
  const v = form.get(key);
  return v instanceof File && v.size > 0 ? v : null;
}

export class FormError extends Error {}

export function required(form: FormData, key: string, label: string): string {
  const v = text(form, key);
  if (!v) throw new FormError(`${label} is required.`);
  return v;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Run an action body, turning FormError into a form message. Other errors (and redirects) propagate. */
export async function handle(fn: () => Promise<FormState | void>): Promise<FormState> {
  try {
    return (await fn()) ?? undefined;
  } catch (e) {
    if (e instanceof FormError) return { error: e.message };
    throw e;
  }
}
