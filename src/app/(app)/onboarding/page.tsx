import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { uploadCredential } from "@/app/actions/onboarding";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Badge, Card, Empty, Field, Notice, PageHeader, reviewLabel, reviewTone } from "@/components/ui";

// A2 Upload credentials, and the status of the admin review (A3 / A3a).
export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  if (user.verified) redirect("/dashboard");

  const credentials = await db.practitionerCredential.findMany({
    where: { practitionerId: user.id },
    orderBy: { createdAt: "desc" },
  });
  const needsInfo = credentials.filter((c) => c.reviewStatus === "needs_info");
  const pending = credentials.some((c) => c.reviewStatus === "pending");

  return (
    <>
      <PageHeader title="Account verification" subtitle="Only verified professionals can access client data." />
      <div className="max-w-2xl space-y-6">
        {needsInfo.length > 0 ? (
          <Notice tone="amber">
            Our team needs more information. See the notes below and upload the requested documents.
          </Notice>
        ) : pending ? (
          <Notice>Your documents are waiting for review. We will email you when your account is verified.</Notice>
        ) : (
          <Notice>Upload your professional license and diplomas to get verified.</Notice>
        )}

        <Card title="Upload a document">
          <ActionForm action={uploadCredential} resetOnSuccess className="space-y-4">
            <Field label="License or diploma" hint="PDF, JPEG or PNG, up to 10 MB. Only platform admins can see these files.">
              <input
                name="file"
                type="file"
                required
                accept="application/pdf,image/jpeg,image/png"
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
            </Field>
            <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Your documents">
          {credentials.length === 0 ? (
            <Empty>No documents uploaded yet.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100">
              {credentials.map((c) => (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{c.originalName}</span>
                    <Badge tone={reviewTone[c.reviewStatus]}>{reviewLabel[c.reviewStatus]}</Badge>
                  </div>
                  <div className="text-xs text-slate-500">Uploaded {formatDateTime(c.createdAt)}</div>
                  {c.reviewerNote && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">Reviewer note: {c.reviewerNote}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
