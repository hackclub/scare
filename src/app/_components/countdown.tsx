"use client";

import { useSyncExternalStore } from "react";

import { pad, timeLeft } from "~/lib/program";
import { GlyphText } from "./glyph-text";

// One clock for every countdown on the page, ticking on the second boundary, so they all
// change together and a page with three of them runs one timer, not three.
let now: number | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

const tick = () => {
  now = Date.now();
  listeners.forEach((l) => l());
  timer = setTimeout(tick, 1000 - (now % 1000));
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    // React rechecks the snapshot after subscribing, so no need to notify here.
    now = Date.now();
    timer = setTimeout(tick, 1000 - (now % 1000));
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size) return;
    clearTimeout(timer);
    // Forget the time, so the next mount shows placeholders rather than a stale reading.
    now = null;
  };
};

// The server renders placeholders; the real time arrives once mounted, as before.
const useNow = () =>
  useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );

export function Countdown({
  variant = "inline",
}: {
  variant?: "inline" | "glyph" | "panel" | "mini" | "readout";
}) {
  const now = useNow();
  const left = now === null ? null : timeLeft(now);

  if (variant === "glyph") {
    const text = left
      ? `${pad(left.d)}:${pad(left.h)}:${pad(left.m)}:${pad(left.s)}`
      : "--:--:--:--";
    return (
      <div className="countdown-glyph">
        <GlyphText text={text} scale={2} max={6} seed={7} />
        <div className="countdown-units" aria-hidden="true">
          <span>Days</span>
          <span>Hours</span>
          <span>Minutes</span>
          <span>Seconds</span>
        </div>
        <p className="sr-only" aria-live="off">
          {left ? `${left.d} days, ${left.h} hours, ${left.m} minutes left` : ""}
        </p>
      </div>
    );
  }

  // Decorative: the HUD and the closing countdown carry the accessible version.
  if (variant === "mini") {
    return (
      <span className="countdown-mini" aria-hidden="true" suppressHydrationWarning>
        {left?.done
          ? "Out"
          : left
            ? `${left.d}d ${pad(left.h)}:${pad(left.m)}:${pad(left.s)}`
            : "--d --:--:--"}
      </span>
    );
  }

  // Label and value as siblings, for a boxed readout that styles each.
  if (variant === "readout") {
    return (
      <>
        <span className="pf-readout-label">Lights out</span>
        <span className="pf-readout-value" suppressHydrationWarning>
          {left?.done
            ? "Now"
            : left
              ? `${left.d}d ${pad(left.h)}h ${pad(left.m)}m ${pad(left.s)}s`
              : "--d --h --m --s"}
        </span>
      </>
    );
  }

  if (variant === "panel") {
    return (
      <p className="countdown-panel">
        {left?.done ? (
          "Lights out"
        ) : (
          <>
            <span className="tabular">{left ? left.d : "--"}</span>d{" "}
            <span className="tabular">{left ? pad(left.h) : "--"}</span>h{" "}
            <span className="tabular">{left ? pad(left.m) : "--"}</span>m{" "}
            <span className="tabular">{left ? pad(left.s) : "--"}</span>s
          </>
        )}
      </p>
    );
  }

  return (
    <span className="countdown-inline">
      {left?.done ? (
        "Lights out"
      ) : (
        <>
          <span className="countdown-label">Lights out in </span>
          <span className="tabular" suppressHydrationWarning>
            {left ? `${left.d}d ${pad(left.h)}h ${pad(left.m)}m ${pad(left.s)}s` : "--d --h --m --s"}
          </span>
        </>
      )}
    </span>
  );
}
