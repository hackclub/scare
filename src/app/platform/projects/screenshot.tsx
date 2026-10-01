"use client";

import { useId, useRef, useState } from "react";

import { SCREENSHOT_ACCEPT, SCREENSHOT_MAX_BYTES } from "~/lib/screenshot";
import { api } from "~/trpc/react";

const ALLOWED = SCREENSHOT_ACCEPT.split(",");

/** Quick checks before uploading; the server checks the actual bytes again. */
function precheck(file: File) {
  if (file.type === "image/gif") return "GIFs aren't allowed. Use a PNG or JPG screenshot.";
  if (file.type && !ALLOWED.includes(file.type)) return "That isn't a PNG, JPG or WebP image.";
  if (file.size > SCREENSHOT_MAX_BYTES) return "Screenshots can be up to 5 MB.";
  return null;
}

export function screenshotSrc(gameId: string, updatedAt: Date | string) {
  return `/api/games/${gameId}/screenshot?v=${new Date(updatedAt).getTime()}`;
}

/**
 * Pick and upload a screenshot for a game. Shows the current one when there is one.
 * `required` marks it as needed to ship.
 */
export function ScreenshotField({
  gameId,
  current,
  required = false,
  compact = false,
}: {
  gameId: string;
  current: { updatedAt: Date | string } | null;
  required?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    const bad = precheck(file);
    if (bad) return setErr(bad);
    setErr(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/api/games/${gameId}/screenshot`, { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setErr(json.error ?? "That upload didn't work. Try again.");
      else await utils.game.mine.invalidate();
    } catch {
      setErr("That upload didn't work. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className={`shot ${compact ? "shot-compact" : ""}`}>
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element -- served by our own route, private to the owner
        <img
          src={screenshotSrc(gameId, current.updatedAt)}
          alt="Screenshot of the game"
          className="shot-img"
          loading="lazy"
        />
      ) : (
        !compact && (
          <div className="shot-empty" aria-hidden="true">
            <span>No screenshot yet</span>
          </div>
        )
      )}
      <div className="shot-row">
        <label htmlFor={id} className={`btn ${current ? "btn-ghost" : required ? "btn-primary" : "btn-ghost"} shot-btn`}>
          <span>{busy ? "Uploading…" : current ? "Replace screenshot" : "Add a screenshot"}</span>
        </label>
        <input
          ref={input}
          id={id}
          type="file"
          accept={SCREENSHOT_ACCEPT}
          className="sr-only"
          disabled={busy}
          aria-invalid={!!err}
          aria-describedby={`${id}-help${err ? ` ${id}-err` : ""}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <span id={`${id}-help`} className="shot-help">
          A screenshot of your project in action - up to 5MB.
        </span>
      </div>
      {err && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
