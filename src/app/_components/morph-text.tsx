"use client";

import { useEffect, useRef, useState } from "react";

/** Sparse to dense, the same ramp the lantern shades with. */
const RAMP = ".:-=+*#%@";
const HOLD_MS = 2400;
const MORPH_MS = 760;

interface Cell {
  ch: string;
  scrambling: boolean;
}

const toCells = (s: string, len: number): Cell[] =>
  s.padEnd(len, " ").split("").map((ch) => ({ ch, scrambling: false }));

/**
 * Cycles through words by resolving each character through the glyph ramp,
 * left to right, like the lantern's cells settling into letters.
 */
export function MorphText({
  words,
  offset = 0,
  className = "",
}: {
  words: string[];
  /** Delays the first morph, so neighbouring MorphTexts take turns instead of flipping together. */
  offset?: number;
  className?: string;
}) {
  const len = Math.max(...words.map((w) => w.length));
  const [cells, setCells] = useState<Cell[]>(() => toCells(words[0] ?? "", len));
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (words.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = true;

    const morph = (from: string, to: string, done: () => void) => {
      const a = from.padEnd(len, " ");
      const b = to.padEnd(len, " ");
      // Each character resolves at its own moment, sweeping left to right with a little jitter.
      const resolveAt = Array.from({ length: len }, (_, i) =>
        Math.min(1, 0.3 + (i / len) * 0.6 + Math.random() * 0.1),
      );
      const start = performance.now();
      let lastPaint = 0;

      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / MORPH_MS);
        if (now - lastPaint > 33 || t === 1) {
          lastPaint = now;
          setCells(
            Array.from({ length: len }, (_, i) => {
              const r = resolveAt[i]!;
              if (t >= r) return { ch: b[i]!, scrambling: false };
              if (a[i] === " " && b[i] === " ") return { ch: " ", scrambling: false };
              if (t < r - 0.3) return { ch: a[i]!, scrambling: false };
              // Ramp climbs toward '@' as the cell nears its resolve moment.
              const k = (t - (r - 0.3)) / 0.3;
              const base = Math.floor(k * (RAMP.length - 1));
              const jitter = Math.floor(Math.random() * 3) - 1;
              const idx = Math.max(0, Math.min(RAMP.length - 1, base + jitter));
              return { ch: RAMP[idx]!, scrambling: true };
            }),
          );
        }
        if (t < 1) raf = requestAnimationFrame(frame);
        else done();
      };
      raf = requestAnimationFrame(frame);
    };

    const next = () => {
      if (!visible || document.hidden) {
        timer = setTimeout(next, 500);
        return;
      }
      const from = words[index]!;
      index = (index + 1) % words.length;
      const to = words[index]!;
      if (reduce) {
        setCells(toCells(to, len));
        timer = setTimeout(next, HOLD_MS + MORPH_MS);
      } else {
        morph(from, to, () => {
          timer = setTimeout(next, HOLD_MS);
        });
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    if (rootRef.current) io.observe(rootRef.current);
    timer = setTimeout(next, HOLD_MS + offset);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      io.disconnect();
    };
  }, [words, len, offset]);

  return (
    <span ref={rootRef} className={`morph ${className}`} style={{ minWidth: `${len}ch` }}>
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="morph-art">
        {cells.map((c, i) => (
          <span key={i} className={c.scrambling ? "morph-scr" : undefined}>
            {c.ch}
          </span>
        ))}
      </span>
    </span>
  );
}
