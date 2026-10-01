"use client";

import { useActionState } from "react";

import { type ActionState } from "../actions";

/** A form bound to an admin server action, reporting the result right under it. */
export function ActionForm({
  action,
  children,
  className = "",
  submit,
  tone = "primary",
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  className?: string;
  submit: string;
  tone?: "primary" | "ghost" | "danger";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={`ad-form ${className}`}>
      {children}
      <div className="ad-form-row">
        <button
          type="submit"
          className={`btn ${tone === "primary" ? "btn-primary" : "btn-ghost"} ${tone === "danger" ? "ad-danger" : ""}`}
          disabled={pending}
        >
          <span>{pending ? "Working…" : submit}</span>
        </button>
        {state?.ok && (
          <p className="ad-ok" role="status">
            {state.ok}
          </p>
        )}
        {state?.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
