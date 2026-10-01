"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PumpkinPlain } from "~/app/_components/icons";
import { NAV, activeItem } from "./nav-items";

/** Rail navigation. The current page gets the lit pumpkin, same as the landing HUD. */
export function PlatformNav({
  counts,
}: {
  counts: Partial<Record<(typeof NAV)[number]["segment"], React.ReactNode>>;
}) {
  const current = activeItem(usePathname());

  return (
    <nav aria-label="Platform" className="pf-nav">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="pf-nav-link"
          aria-current={current.href === n.href ? "page" : undefined}
        >
          <PumpkinPlain className="pf-nav-pumpkin" />
          <span className="pf-nav-label">{n.label}</span>
          {counts[n.segment] !== undefined && (
            <span className="pf-nav-meta">{counts[n.segment]}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
