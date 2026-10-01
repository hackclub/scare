"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArrowRight, Skull } from "./icons";

/** "☠" stands in for the pixel skull; empty cells grow into the longer word. */
const SKULL = "☠";
const FROM = ["d", "e", "a", "t", "h", " ", SKULL, "", ""];
const TO = "dashboard";
/** Sparse to dense, the same ramp the lantern shades with. */
const RAMP = ".:-=+*#%@";

const STRIKE_AT = 550;
const MORPH_AT = 1150;
const STAGGER = 55;
const SCRAMBLE = 240;

type Phase = "idle" | "struck" | "cleared";

/**
 * The signed-in call to action. It reads "Open death ☠" for a beat, crosses
 * that out, then resolves the letters through the glyph ramp into "dashboard".
 * Plays once, the first time it comes into view.
 */
export function DashboardLink({ href = "/platform" }: { href?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [word, setWord] = useState(FROM.join(""));
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setWord(TO);
      setPhase("cleared");
      return;
    }

    const timers: number[] = [];
    let raf = 0;

    const morph = () => {
      setPhase("cleared");
      const start = performance.now();
      const tick = (now: number) => {
        const e = now - start;
        let out = "";
        for (let i = 0; i < TO.length; i++) {
          const local = e - i * STAGGER;
          if (local < 0) out += FROM[i];
          else if (local < SCRAMBLE) out += RAMP[(i * 3 + Math.floor(local / 45)) % RAMP.length];
          else out += TO[i];
        }
        setWord(out);
        if (e < (TO.length - 1) * STAGGER + SCRAMBLE) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const play = () => {
      timers.push(window.setTimeout(() => setPhase("struck"), STRIKE_AT));
      timers.push(window.setTimeout(morph, MORPH_AT));
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        play();
      },
      { threshold: 0.8 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Link
      ref={ref}
      href={href}
      className={`btn btn-primary btn-doom ${phase === "cleared" ? "" : "is-dead"}`}
      aria-label="Open dashboard"
    >
      <span aria-hidden="true">
        Open{" "}
        <span className="strike-slot">
          <span className="strike-sizer">{TO}</span>
          <span className={`strike strike-${phase}`}>
            {word.split(SKULL).flatMap((part, i) =>
              i ? [<Skull key={i} className="strike-skull" />, part] : [part],
            )}
          </span>
        </span>
      </span>
      <ArrowRight className="btn-icon" />
    </Link>
  );
}
