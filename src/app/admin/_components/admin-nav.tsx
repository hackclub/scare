"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PumpkinPlain } from "~/app/_components/icons";

const NAV = [
  { href: "/admin", label: "Overview", key: "overview" },
  { href: "/admin/ships", label: "Ships", key: "ships" },
  { href: "/admin/orders", label: "Orders", key: "orders" },
  { href: "/admin/suggestions", label: "Suggestions", key: "suggestions" },
  { href: "/admin/users", label: "Users", key: "users" },
  { href: "/admin/audit", label: "Audit log", key: "audit" },
] as const;

export function AdminNav({ counts }: { counts: Partial<Record<(typeof NAV)[number]["key"], number>> }) {
  const path = usePathname();
  const current = [...NAV].reverse().find((n) => (n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)));
  return (
    <nav aria-label="Admin" className="pf-nav">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="pf-nav-link"
          aria-current={current?.href === n.href ? "page" : undefined}
        >
          <PumpkinPlain className="pf-nav-pumpkin" />
          <span className="pf-nav-label">{n.label}</span>
          {counts[n.key] ? <span className="ad-count">{counts[n.key]}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
