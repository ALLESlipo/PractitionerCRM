"use client";

import { createContext, use, useActionState, useEffect, useRef, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonBase, buttonStyles, type Variant } from "@/components/ui";
import type { FormState } from "@/lib/form";

type Action = (state: FormState, form: FormData) => Promise<FormState>;

// Pending state of the enclosing ActionForm (its submissions bypass useFormStatus).
const PendingContext = createContext(false);

function usePending() {
  const { pending } = useFormStatus();
  return use(PendingContext) || pending;
}

/**
 * A form bound to a Server Action that shows its error / success message.
 * Works before hydration (native submit). After hydration, submission goes through
 * onSubmit so React doesn't reset the fields when the action returns an error.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(form));
      }}
    >
      {state?.error && (
        <p role="alert" className="col-span-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="col-span-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.ok}
        </p>
      )}
      <PendingContext value={pending}>{children}</PendingContext>
    </form>
  );
}

export function SubmitButton({ children, variant = "primary", pendingText }: { children: ReactNode; variant?: Variant; pendingText?: string }) {
  const pending = usePending();
  return (
    <button type="submit" disabled={pending} className={`${buttonBase} ${buttonStyles[variant]}`}>
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}

/** A submit button that asks for confirmation first (e.g. C5 Archive). */
export function ConfirmSubmit({ children, message, variant = "danger" }: { children: ReactNode; message: string; variant?: Variant }) {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonBase} ${buttonStyles[variant]}`}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
