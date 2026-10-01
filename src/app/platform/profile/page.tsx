import { ArrowUpRight } from "~/app/_components/icons";
import { SignInButton, SignOutButton } from "~/app/_components/auth-buttons";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  HACKCLUB_AUTH,
  displayName,
  getIdentity,
  storedFields,
} from "~/server/hackclub";
import { HACKATIME, hackatimeConfigured } from "~/server/hackatime";
import { HackatimeNotice } from "../_components/hackatime-notice";
import { PageHead } from "../_components/page-head";
import { HackatimePanel } from "./hackatime-panel";
import { Secret } from "./secret";
import { VerificationBadge } from "../_components/verification";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? "pf-mono" : undefined}>
        {value ?? <span className="pf-muted">Not shared</span>}
      </dd>
    </div>
  );
}

export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ hackatime?: string }>;
}) {
  const { hackatime } = await searchParams;
  const session = (await auth())!;
  const [result, link] = await Promise.all([
    getIdentity(session.user.id),
    db.hackatimeLink.findUnique({
      where: { userId: session.user.id },
      select: {
        slackId: true,
        githubUsername: true,
        createdAt: true,
      },
    }),
  ]);
  const slackId = result.ok
    ? result.me.identity.slack_id
    : session.user.slackId;
  const slackMatches =
    link?.slackId && slackId ? link.slackId === slackId : null;

  const hackatimeFrame = (
    <section className="frame" aria-labelledby="hackatime-title">
      <div className="frame-head">
        <span id="hackatime-title">Hackatime</span>
        <span>{link ? "linked" : "not linked"}</span>
      </div>
      <HackatimePanel
        link={link}
        configured={hackatimeConfigured}
        slackMatches={slackMatches}
        settingsUrl={HACKATIME.settings}
      />
    </section>
  );

  // Keep Scare's copy of verification in step with Hack Club Auth.
  const s = session.user;
  const fresh = result.ok ? storedFields(result.me) : null;
  if (
    fresh &&
    (fresh.verificationStatus !== s.verificationStatus ||
      fresh.yswsEligible !== s.yswsEligible ||
      fresh.slackId !== s.slackId)
  ) {
    await db.user.update({
      where: { id: session.user.id },
      data: fresh,
    });
  }

  return (
    <>
      <PageHead
        title="Profile"
        lead={
          <>
            Your profile information for Scare. This uses data from{" "}
            <a href="https://auth.hackclub.com" className="link" target="_blank" rel="noreferrer">
              Hack Club Auth
            </a>{" "}
            and{" "}
            <a href="https://hackatime.hackclub.com" className="link" target="_blank" rel="noreferrer">
              Hackatime
            </a>
            .
          </>
        }
        actions={
          <a href={HACKCLUB_AUTH.verify} className="btn btn-ghost">
            <span>Edit on Hack Club Auth</span>
            <ArrowUpRight className="btn-icon" />
          </a>
        }
      />

      <HackatimeNotice status={hackatime} />

      {!result.ok ? (
        <div className="pf-profile pf-profile-error">
          <section className="frame pf-error" role="alert">
            <div className="frame-head">
              <span>Couldn&rsquo;t load your identity</span>
            </div>
            <div className="pf-next-body">
              <p className="pf-next-text">
                {result.reason === "unavailable"
                  ? "Hack Club Auth didn't answer. Try again in a minute."
                  : "Your Hack Club session has expired. Sign in again to reconnect it."}
              </p>
              {result.reason !== "unavailable" && (
                <SignInButton redirectTo="/platform/profile">
                  Sign in again
                </SignInButton>
              )}
            </div>
          </section>
          {hackatimeFrame}
        </div>
      ) : (
        (() => {
          const i = result.me.identity;
          const name = displayName(i);
          return (
            <div className="pf-profile">
              <section className="frame" aria-labelledby="identity-title">
                <div className="frame-head">
                  <span id="identity-title">Hack Club identity</span>
                  <span>{result.me.scopes.length} scopes granted</span>
                </div>
                <dl className="ledger pf-ledger">
                  <Row
                    label="Name"
                    value={name ? <Secret value={name} label="name" /> : null}
                  />
                  <Row
                    label="Email"
                    value={
                      i.primary_email ? (
                        <Secret value={i.primary_email} label="email" />
                      ) : null
                    }
                  />
                  <Row
                    label="Slack ID"
                    value={
                      i.slack_id ? (
                        <Secret value={i.slack_id} label="Slack ID" mono />
                      ) : null
                    }
                  />
                  <Row
                    label="Verification"
                    value={
                      <VerificationBadge
                        status={i.verification_status ?? null}
                      />
                    }
                  />
                  <Row
                    label="YSWS eligible"
                    value={
                      i.ysws_eligible === undefined
                        ? null
                        : i.ysws_eligible
                          ? "Yes"
                          : "No"
                    }
                  />
                </dl>
              </section>

              {hackatimeFrame}

              <section className="frame" aria-labelledby="session-title">
                <div className="frame-head">
                  <span id="session-title">Session</span>
                </div>
                <div className="pf-next-body pf-session">
                  <p className="pf-next-text">Signed in with Hack Club.</p>
                  <SignOutButton variant="ghost" />
                </div>
              </section>
            </div>
          );
        })()
      )}
    </>
  );
}
