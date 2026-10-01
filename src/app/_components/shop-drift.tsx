"use client";

import { useEffect, useRef } from "react";

/** Pixels per second the strip drifts when nobody is touching it. */
const SPEED = 26;
/** After a touch swipe or key press, how long to wait before drifting again (lets momentum settle). */
const SETTLE_MS = 1200;

/**
 * A horizontal strip that drifts on its own and can be scrolled, swiped or dragged.
 * Its child must be a list holding the items twice over, so the scroll position can loop
 * seamlessly by jumping one copy's width.
 */
export function Drift({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const track = el.firstElementChild as HTMLElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let pos = 1; // scrollLeft rounds, so keep the drift's own position as a float
    let last = performance.now();
    let idleUntil = 0;
    let hovering = false;
    let visible = true;
    let drag: { id: number; x: number; left: number } | null = null;
    let raf = 0;

    // The distance from a tile to its twin in the second copy: one full loop.
    const period = () => {
      const twin = track.children[track.children.length / 2] as HTMLElement | undefined;
      const first = track.children[0] as HTMLElement | undefined;
      return twin && first ? twin.offsetLeft - first.offsetLeft : 0;
    };
    // Keep the position inside the first copy; the second copy makes the jump invisible.
    const wrap = (v: number) => {
      const h = period();
      if (h <= 0) return v;
      if (v >= h) return v - h;
      if (v <= 0) return v + h;
      return v;
    };
    const settle = () => (idleUntil = performance.now() + SETTLE_MS);

    el.scrollLeft = pos;

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (!reduce && visible && !hovering && !drag && t > idleUntil) {
        pos = wrap(pos + SPEED * dt);
        el.scrollLeft = pos;
      } else if (!drag) {
        // Someone else is moving it (trackpad, touch, keys): follow, and loop.
        const w = wrap(el.scrollLeft);
        if (w !== el.scrollLeft) el.scrollLeft = w;
        pos = el.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Mouse drag. Touch and pens scroll natively.
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, left: el.scrollLeft };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
    };
    const move = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      const next = drag.left - (e.clientX - drag.x);
      const w = wrap(next);
      drag.left += w - next; // carry the loop jump into the drag's origin
      el.scrollLeft = w;
      pos = w;
    };
    const up = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      drag = null;
      delete el.dataset.dragging;
    };
    // Only a real mouse hovers. Touch fakes an "enter" on tap and never sends the "leave".
    const enter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = true;
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") hovering = false;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("touchstart", settle, { passive: true });
    el.addEventListener("touchend", settle, { passive: true });
    el.addEventListener("keydown", settle);

    // No drifting while it's off screen.
    const io = new IntersectionObserver(([entry]) => (visible = entry?.isIntersecting ?? true));
    io.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("touchstart", settle);
      el.removeEventListener("touchend", settle);
      el.removeEventListener("keydown", settle);
    };
  }, []);

  return (
    <div ref={ref} className="sp-window" tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}
