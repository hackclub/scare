import Link from "next/link";

import { auth } from "~/server/auth";
import { SignInButton, SignOutButton } from "./auth-buttons";
import { HackClubFlag } from "./hack-club-flag";
import { HudFrame } from "./hud-frame";
import { HudNav } from "./hud-nav";
import { PumpkinMark } from "./icons";
import { SoundToggle } from "./sound-toggle";
import { Countdown } from "./countdown";

export async function Hud({ inHaunt = false }: { inHaunt?: boolean }) {
  const session = await auth();

  return (
    <HudFrame>
      <div className="hud-inner">
        <Link href="/" className="hud-mark" aria-label="Scare, a Hack Club YSWS. Home">
          <PumpkinMark className="hud-pumpkin" />
          <HackClubFlag className="hud-flag" />
          <span className="hud-mark-rule" aria-hidden="true" />
          <span className="hud-mark-word">SCARE</span>
        </Link>

        {!inHaunt && <HudNav />}

        <div className="hud-end">
          <SoundToggle />
          <span className="hud-count">
            <Countdown />
          </span>
          {session ? (
            inHaunt ? (
              <SignOutButton />
            ) : (
              <Link href="/platform" className="btn btn-hud">
                Open platform
              </Link>
            )
          ) : (
            <SignInButton variant="hud">Sign in</SignInButton>
          )}
        </div>
      </div>
    </HudFrame>
  );
}
