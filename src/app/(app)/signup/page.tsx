import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { signup } from "@/app/actions/auth";
import { ActionForm, SubmitButton } from "@/components/forms";
import { Card, Field, Input } from "@/components/ui";

// A1 Sign up
export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user));
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="mb-6 text-sm text-slate-600">
        After signing up you will upload your license and diplomas. Our team verifies them before you can add clients.
      </p>
      <Card>
        <ActionForm action={signup} className="space-y-4">
          <Field label="Full name">
            <Input name="fullName" autoComplete="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password" hint="At least 12 characters.">
            <Input name="password" type="password" autoComplete="new-password" minLength={12} required />
          </Field>
          <Field label="Confirm password">
            <Input name="passwordConfirm" type="password" autoComplete="new-password" minLength={12} required />
          </Field>
          <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        </ActionForm>
      </Card>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="text-teal-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
