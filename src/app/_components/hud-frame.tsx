"use client";

import { useEffect, useState, type ReactNode } from "react";

/** The HUD's shell: full-width at the top of the page, a floating island once you scroll. */
export function HudFrame({ children }: { children: ReactNode }) {
  const [island, setIsland] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsland(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="hud" data-island={island || undefined}>
      {children}
    </header>
  );
}
