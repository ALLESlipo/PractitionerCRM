import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { login } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input } from "@/components/ui";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Log in</h1>
      <Card>
        <ActionForm action={login} className="space-y-4">
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
        </ActionForm>
      </Card>
      <p className="mt-4 text-sm text-slate-600">
        New practitioner?{" "}
        <Link href="/signup" className="text-teal-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
