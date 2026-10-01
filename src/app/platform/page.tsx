import Link from "next/link";

import { Countdown } from "~/app/_components/countdown";
import { GlyphText } from "~/app/_components/glyph-text";
import { ArrowRight, ArrowUpRight } from "~/app/_components/icons";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { HACKCLUB_AUTH } from "~/server/hackclub";
import { PageHead } from "./_components/page-head";
import { verificationLabel } from "./_components/verification";

export const metadata = { title: "Home" };

type Step = { title: string; body: string; href: string; cta: string; external?: boolean };

export default async function PlatformHome() {
  const session = (await auth())!;
  const [user, games] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, pumpkins: true, verificationStatus: true },
    }),
    db.game.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, engine: true },
    }),
  ]);

  const first = user?.name?.split(" ")[0];
  const brewing = games.filter((g) => g.status === "BREWING");
  const shipped = games.length - brewing.length;
  const status = user?.verificationStatus ?? null;

  const step: Step =
    status === "needs_submission" || status === "ineligible" || status === null
      ? {
          title: "Verify your Hack Club account",
          body: "Hack Club Auth hasn't verified you yet. Verify so you can earn Pumpkins, then sign in again.",
          href: HACKCLUB_AUTH.verify,
          cta: "Verify at auth.hackclub.com",
          external: true,
        }
      : games.length === 0
        ? {
            title: "Register your first game",
            body: "Tell us what you're making. It can be rough; you'll ship it later.",
            href: "/platform/projects?new=1",
            cta: "Register a game",
          }
        : brewing.length > 0
          ? {
              title: `Ship ${brewing[0]!.title}`,
              body: "When other people can play it, add the link and mark it shipped.",
              href: "/platform/projects",
              cta: "Go to projects",
            }
          : {
              title: "Everything's shipped",
              body: "Start another game, or spend your Pumpkins in the shop.",
              href: "/platform/projects?new=1",
              cta: "Register another game",
            };

  return (
    <>
      <PageHead
        title="Home"
        lead={first ? `Welcome back, ${first}.` : "Welcome back."}
      />

      <div className="pf-home">
        <section className="frame pf-next" aria-labelledby="next-title">
          <div className="frame-head">
            <span>Next step</span>
            {status === "pending" && <span>Verification pending</span>}
          </div>
          <div className="pf-next-body">
            <h2 id="next-title" className="pf-next-title">
              {step.title}
            </h2>
            <p className="pf-next-text">{step.body}</p>
            {step.external ? (
              <a href={step.href} className="btn btn-primary">
                <span>{step.cta}</span>
                <ArrowUpRight className="btn-icon" />
              </a>
            ) : (
              <Link href={step.href} className="btn btn-primary">
                <span>{step.cta}</span>
                <ArrowRight className="btn-icon" />
              </Link>
            )}
          </div>
        </section>

        <section className="frame pf-status" aria-labelledby="status-title">
          <div className="frame-head">
            <span id="status-title">Status</span>
          </div>
          <div className="pf-balance">
            <GlyphText text={String(user?.pumpkins ?? 0)} bold scale={2} max={7} />
            <p className="pf-balance-label">Pumpkins</p>
          </div>
          <dl className="ledger pf-ledger">
            <div>
              <dt>Games brewing</dt>
              <dd>{brewing.length}</dd>
            </div>
            <div>
              <dt>Games shipped</dt>
              <dd>{shipped}</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>{verificationLabel(status).short}</dd>
            </div>
            <div>
              <dt>Earn rate</dt>
              <dd>{PUMPKINS_PER_HOUR} / hour</dd>
            </div>
            <div>
              <dt>Time left</dt>
              <dd>
                <Countdown variant="panel" />
              </dd>
            </div>
          </dl>
        </section>

        <section className="frame pf-recent" aria-labelledby="recent-title">
          <div className="frame-head">
            <span id="recent-title">Your games</span>
            <Link href="/platform/projects" className="pf-head-link">
              All projects
            </Link>
          </div>
          {games.length === 0 ? (
            <p className="pf-empty">Nothing yet. Every haunt starts empty.</p>
          ) : (
            <ul className="pf-list">
              {games.slice(0, 4).map((g) => (
                <li key={g.id} className="pf-list-row">
                  <span className="pf-list-title">{g.title}</span>
                  {g.engine && <span className="pf-list-meta">{g.engine}</span>}
                  <span
                    className={`pf-state ${g.status === "SHIPPED" ? "pf-state-on" : ""}`}
                  >
                    <span className="status-dot" aria-hidden="true" />
                    {g.status === "SHIPPED" ? "Shipped" : "Brewing"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
