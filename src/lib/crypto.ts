import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

// Application-level encryption for client personal data and kit access codes
// (schema v0.2: *_enc columns). AES-256-GCM; the key lives in the environment,
// never in the database. Stored layout: [version 1 byte][iv 12][tag 16][ciphertext].

const VERSION = 1;

function key(name: "CLIENT_DATA_KEY" | "EMAIL_HASH_KEY"): Buffer {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  const buf = Buffer.from(value, "base64");
  if (buf.length !== 32) throw new Error(`${name} must be 32 bytes, base64-encoded`);
  return buf;
}

export function encrypt(plaintext: string): Uint8Array<ArrayBuffer> {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key("CLIENT_DATA_KEY"), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return new Uint8Array(Buffer.concat([Buffer.from([VERSION]), iv, cipher.getAuthTag(), ct]));
}

export function decrypt(data: Uint8Array): string {
  const buf = Buffer.from(data);
  if (buf[0] !== VERSION) throw new Error("Unknown encryption version");
  const decipher = createDecipheriv("aes-256-gcm", key("CLIENT_DATA_KEY"), buf.subarray(1, 13));
  decipher.setAuthTag(buf.subarray(13, 29));
  return Buffer.concat([decipher.update(buf.subarray(29)), decipher.final()]).toString("utf8");
}

export const encryptOptional = (v: string | null) => (v === null ? null : encrypt(v));
export const decryptOptional = (v: Uint8Array | null) => (v === null ? null : decrypt(v));

/** HMAC of the lowercased email, for duplicate detection without decrypting. */
export function emailHash(email: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(createHmac("sha256", key("EMAIL_HASH_KEY")).update(email.trim().toLowerCase()).digest());
}

export const randomToken = () => randomBytes(32).toString("base64url");
export const sha256Hex = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");
