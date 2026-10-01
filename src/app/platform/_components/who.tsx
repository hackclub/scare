"use client";

import { useState } from "react";

import { Eye, EyeOff } from "~/app/_components/icons";

/** "Logged in", with an eye to reveal the name. Hidden by default, for screen sharing and streams. */
export function Who({ name }: { name: string | null }) {
  const [shown, setShown] = useState(false);

  return (
    <div className="pf-who">
      <p className="pf-who-name" aria-live="polite">
        {shown && name ? name : "Logged in"}
      </p>
      {name && (
        <button
          type="button"
          className="pf-who-eye"
          aria-pressed={shown}
          aria-label={shown ? "Hide your name" : "Show your name"}
          title={shown ? "Hide name" : "Show name"}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? <EyeOff /> : <Eye />}
        </button>
      )}
    </div>
  );
}
