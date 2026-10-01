"use client";

import { useEffect, useState } from "react";

import { PumpkinPlain } from "./icons";

const NAV = [
  { id: "deal", label: "How it works" },
  { id: "pumpkins", label: "Rewards" },
  { id: "rules", label: "Rules" },
  { id: "faq", label: "FAQ" },
];

/** Section links; a pumpkin sits beside whichever section is under the reading line. */
export function HudNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (!sections.length) return;

    // A thin band 40% down the viewport: the section crossing it is the one being read.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
          else if (e.target === sections[0] && e.boundingClientRect.top > 0) setActive(null);
        }
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Sections" className="hud-nav">
      {NAV.map((n) => (
        <a
          key={n.id}
          href={`/#${n.id}`}
          className="hud-link"
          aria-current={active === n.id ? "location" : undefined}
        >
          <PumpkinPlain className="hud-link-pumpkin" />
          {n.label}
        </a>
      ))}
    </nav>
  );
}
