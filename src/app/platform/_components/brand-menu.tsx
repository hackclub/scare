"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ArrowUpRight, Caret, PumpkinMark, PumpkinPlain } from "~/app/_components/icons";

const PLACES = [
  { href: "/platform", label: "Home", meta: "Your dashboard" },
  { href: "/", label: "Homepage", meta: "Landing Page", out: true },
] as const;

/** The rail's brand doubles as a switcher: back to the dashboard, or out to the landing page. */
export function BrandMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const id = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="pf-brand-wrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="pf-brand"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <PumpkinMark className="pf-brand-pumpkin" />
        <span className="pf-brand-word">SCARE</span>
        <span className="pf-brand-tag">platform</span>
        <Caret className="pf-brand-caret" />
      </button>

      {open && (
        <nav id={id} className="pf-switch" aria-label="Go to">
          {PLACES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="pf-switch-link"
              aria-current={p.href === "/platform" && pathname === "/platform" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <PumpkinPlain className="pf-nav-pumpkin" />
              <span className="pf-switch-label">
                {p.label}
                <span className="pf-switch-meta">{p.meta}</span>
              </span>
              {"out" in p && <ArrowUpRight className="pf-switch-out" />}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
