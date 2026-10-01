"use client";

import { useEffect, useRef } from "react";

/**
 * Carries a candle over its children: the cursor becomes a small, flickering
 * light that trails a little behind the pointer. It only sets CSS variables
 * (--lx, --ly, --lr, --glow); the lit layer in the stylesheet does the rest.
 */
export function Candlelight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pointer = { x: -1e4, y: -1e4, moved: -1e9 };
    const light = { x: -1e4, y: -1e4, glow: 0 };
    let raf = 0;
    let last = 0;

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;

      const rect = el.getBoundingClientRect();
      const tx = pointer.x - rect.left;
      const ty = pointer.y - rect.top;
      const awake = now - pointer.moved < 2600 && !document.hidden;

      if (reduce || light.glow < 0.01) {
        // Don't sweep in from wherever the light was last; appear under the cursor.
        light.x = tx;
        light.y = ty;
      } else {
        const k = 1 - Math.exp(-14 * dt);
        light.x += (tx - light.x) * k;
        light.y += (ty - light.y) * k;
      }
      const target = awake ? 1 : 0;
      light.glow += (target - light.glow) * (1 - Math.exp(-(awake ? 8 : 1.6) * dt));
      if (reduce) light.glow = target;

      const t = now / 1000;
      const flicker = reduce ? 0 : Math.sin(t * 9.3) * 0.05 + Math.sin(t * 23.1 + 1.7) * 0.03 + (Math.random() - 0.5) * 0.04;
      const radius = Math.max(120, Math.min(220, rect.height * 1.1)) * (1 + flicker);

      el.style.setProperty("--lx", `${light.x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${light.y.toFixed(1)}px`);
      el.style.setProperty("--lr", `${radius.toFixed(1)}px`);
      el.style.setProperty("--glow", light.glow.toFixed(3));

      // Keep flickering while lit; stop once the light has gone out.
      if (awake || light.glow > 0.005) raf = requestAnimationFrame(frame);
      else el.style.setProperty("--glow", "0");
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = performance.now();
      kick();
    };
    const onLeave = () => {
      pointer.moved = -1e9;
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", kick, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", kick);
    };
  }, []);

  return (
    <span ref={ref} className={`candlelight ${className}`}>
      {children}
    </span>
  );
}
