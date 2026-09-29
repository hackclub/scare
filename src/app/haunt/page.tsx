import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { Countdown } from "~/app/_components/countdown";
import { GlyphText } from "~/app/_components/glyph-text";
import { Hud } from "~/app/_components/hud";
import { ArrowUpRight } from "~/app/_components/icons";
import { LINKS } from "~/lib/program";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { api, HydrateClient } from "~/trpc/server";
import { GameBoard } from "./game-board";

export const metadata: Metadata = { title: "Your haunt — Scare" };

export default async function Haunt() {
  const session = await auth();
  if (!session) redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { pumpkins: true, yswsEligible: true, slackId: true },
  });
  void api.game.mine.prefetch();

  const name = session.user.name?.split(" ")[0] ?? "you";

  return (
    <HydrateClient>
      <Hud inHaunt />
      <main id="main" className="haunt">
        <section className="haunt-head" aria-labelledby="haunt-title">
          <GlyphText as="h1" id="haunt-title" text={"YOUR\nHAUNT"} bold shadow scale={2} narrowScale={1} max={5.5} />
          <p className="band-lead">
            Welcome in, {name}. Register the game you&rsquo;re making, then
            mark it shipped once other people can play it.
          </p>
        </section>

        <div className="haunt-grid">
          <aside className="haunt-side" aria-label="Your status">
            <div className="panel">
              <h2 className="panel-title">Pumpkins</h2>
              <GlyphText text={String(user?.pumpkins ?? 0)} bold scale={2} max={5} />
              <p className="panel-note">
                Earn rates are announced soon. Your balance fills in once
                they&rsquo;re set, and you spend it when the Pumpkin Shop opens.
              </p>
            </div>

            <div className="panel">
              <h2 className="panel-title">Eligibility</h2>
              {user?.yswsEligible ? (
                <p className="status status-ok">
                  <span className="status-dot" aria-hidden="true" />
                  Verified for YSWS
                </p>
              ) : (
                <>
                  <p className="status status-warn">
                    <span className="status-dot" aria-hidden="true" />
                    Not verified yet
                  </p>
                  <p className="panel-note">
                    Hack Club Auth hasn&rsquo;t marked your account as YSWS
                    eligible. Verify it to earn Pumpkins, then sign in again.
                  </p>
                  <a href={LINKS.auth} className="link">
                    Verify at auth.hackclub.com <ArrowUpRight className="link-icon" />
                  </a>
                </>
              )}
            </div>

            <div className="panel">
              <h2 className="panel-title">Time left</h2>
              <Countdown variant="panel" />
            </div>
          </aside>

          <GameBoard />
        </div>
      </main>
    </HydrateClient>
  );
}
