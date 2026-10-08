import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Development mailer: writes each email to storage/outbox/ and logs it.
// Swap for a real provider (SMTP / API) when email delivery is decided (flow D).
export async function sendMail(to: string, subject: string, text: string) {
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), "storage", "outbox");
  await mkdir(dir, { recursive: true });
  const file = path.join(/*turbopackIgnore: true*/ dir, `${new Date().toISOString().replace(/[:.]/g, "-")}.txt`);
  await writeFile(file, `To: ${to}\nSubject: ${subject}\n\n${text}\n`);
  console.log(`[mail] to=${to} subject="${subject}" -> ${file}`);
}
