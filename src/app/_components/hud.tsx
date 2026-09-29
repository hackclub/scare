import Link from "next/link";

import { auth } from "~/server/auth";
import { SignInButton, SignOutButton } from "./auth-buttons";
import { Countdown } from "./countdown";

const NAV = [
  { href: "/#deal", label: "The deal" },
  { href: "/#pumpkins", label: "Pumpkins" },
  { href: "/#rules", label: "What counts" },
  { href: "/#faq", label: "FAQ" },
];

export async function Hud({ inHaunt = false }: { inHaunt?: boolean }) {
  const session = await auth();

  return (
    <header className="hud">
      <div className="hud-inner">
        <Link href="/" className="hud-mark" aria-label="Scare, home">
          <span className="hud-mark-word">SCARE</span>
          <span className="hud-mark-sub">A Hack Club YSWS</span>
        </Link>

        {!inHaunt && (
          <nav aria-label="Sections" className="hud-nav">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hud-link">
                <span aria-hidden="true">[</span>
                {n.label}
                <span aria-hidden="true">]</span>
              </a>
            ))}
          </nav>
        )}

        <div className="hud-end">
          <span className="hud-count">
            <Countdown />
          </span>
          {session ? (
            inHaunt ? (
              <SignOutButton />
            ) : (
              <Link href="/haunt" className="btn btn-hud">
                Your haunt
              </Link>
            )
          ) : (
            <SignInButton variant="hud">Sign in</SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
