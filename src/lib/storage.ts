import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sha256Hex } from "@/lib/crypto";
import { FormError } from "@/lib/form";

// Private file storage on local disk, outside /public. Files are only ever
// served through route handlers that check ownership first.
const ROOT = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "storage");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type Kind = "pdf" | "jpeg" | "png" | "webp";
const MIME: Record<Kind, string> = { pdf: "application/pdf", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Detect the real file type from its first bytes, not the extension. */
export function sniff(bytes: Uint8Array): Kind | null {
  const b = Buffer.from(bytes.subarray(0, 12));
  if (b.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

export type StoredFile = { filePath: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string };

export class UploadError extends FormError {}

/** Validate and store an uploaded file under storage/<folder>/. */
export async function storeUpload(file: File, folder: string, allowed: Kind[]): Promise<StoredFile> {
  if (file.size === 0) throw new UploadError("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("The file is larger than 10 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind || !allowed.includes(kind))
    throw new UploadError(`Unsupported file type. Allowed: ${allowed.map((k) => k.toUpperCase()).join(", ")}.`);

  const rel = path.join(/*turbopackIgnore: true*/ folder, `${randomUUID()}.${kind === "jpeg" ? "jpg" : kind}`);
  const abs = resolveSafe(rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes, { flag: "wx" });
  return {
    filePath: rel,
    originalName: path.basename(file.name).slice(0, 255) || "upload",
    mimeType: MIME[kind],
    sizeBytes: bytes.length,
    sha256: sha256Hex(bytes),
  };
}

export async function readStored(rel: string): Promise<Buffer> {
  return readFile(resolveSafe(rel));
}

function resolveSafe(rel: string): string {
  const abs = path.resolve(/*turbopackIgnore: true*/ ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) throw new Error("Invalid storage path");
  return abs;
}
