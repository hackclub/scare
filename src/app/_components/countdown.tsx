"use client";

import { useEffect, useState } from "react";

import { pad, timeLeft } from "~/lib/program";
import { GlyphText } from "./glyph-text";

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function Countdown({
  variant = "inline",
}: {
  variant?: "inline" | "glyph" | "panel";
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
