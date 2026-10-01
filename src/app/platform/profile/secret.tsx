"use client";

import { useState } from "react";

import { Eye, EyeOff } from "~/app/_components/icons";

/** A fixed run of dots, so the mask doesn't give away the value's length. */
const MASK = "••••••••";

/** Hidden until asked for, so the page is safe to have open on a stream or a shared screen. */
export function Secret({
  value,
  label,
  mono,
}: {
  value: string;
  label: string;
  mono?: boolean;
}) {
  const [shown, setShown] = useState(false);

  return (
    <span className="pf-secret">
      <span className={mono ? "pf-mono" : undefined}>
        {shown ? value : <span aria-label="hidden">{MASK}</span>}
      </span>
      <button
        type="button"
        className="pf-secret-toggle"
        aria-pressed={shown}
        aria-label={`${shown ? "Hide" : "Show"} your ${label}`}
        title={`${shown ? "Hide" : "Show"} ${label}`}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? <EyeOff /> : <Eye />}
      </button>
    </span>
  );
}
