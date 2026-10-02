import "~/styles/platform.css";

import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInButton } from "~/app/_components/auth-buttons";
import { GlyphText } from "~/app/_components/glyph-text";
import { HackClubFlag } from "~/app/_components/hack-club-flag";
import { PumpkinMark } from "~/app/_components/icons";
import { Lantern } from "~/app/_components/lantern";
import { SilenceAmbience } from "~/app/_components/silence-ambience";
import { SiteFooter } from "~/app/_components/site-footer";
import { safePath } from "~/lib/safe-url";
import { auth } from "~/server/auth";

export const metadata: Metadata = { title: "Sign in | Scare" };

/** Auth.js error codes, plus our own "Unconfigured", in plain words. */
const ERRORS: Record<string, string> = {
  Unconfigured:
    "Sign-in isn't connected on this server yet. Add the Hack Club Auth keys to .env and restart.",
  Configuration:
    "Sign-in is misconfigured on our side. Check the Hack Club Auth client ID, secret and redirect URI.",
  AccessDenied: "You didn't approve the sign-in on Hack Club Auth. Try again when you're ready.",
  Verification: "That sign-in link expired. Start again.",
  OAuthAccountNotLinked:
    "That email is already tied to another Scare account. Sign in the way you did before.",
};
const FALLBACK = "Something went wrong signing you in. Try again, and ask in Slack if it keeps happening.";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const { error, callbackUrl } = await searchParams;
  const target = safePath(callbackUrl);
  if (await auth()) redirect(target);

  const message = error ? (ERRORS[error] ?? FALLBACK) : null;

  return (
    <div className="login">
      <SilenceAmbience />
      <main id="main" className="login-panel">
        <Link href="/" className="pf-brand" aria-label="Scare home">
          <PumpkinMark className="pf-brand-pumpkin" />
          <span className="pf-brand-word">SCARE</span>
          <span className="pf-brand-tag">platform</span>
        </Link>

        <section className="frame login-frame" aria-labelledby="login-title">
          <div className="frame-head">
            <span id="login-title">Sign in</span>
            <span>auth.hackclub.com</span>
          </div>
          <div className="login-body">
            <HackClubFlag id="hc-flag-login" className="login-flag" />
            <GlyphText text="ENTER" bold scale={2} max={5.5} className="login-word" />
            <p className="login-text">
              Sign in with your Hack Club account to register games, ship them,
              and keep track of your Pumpkins.
            </p>

            {message && (
              <p className="login-error" role="alert">
                {message}
              </p>
            )}

            <SignInButton redirectTo={target} className="login-action" />
            <p className="login-fine">
              New to Hack Club? You can make an account on the way in.
            </p>
          </div>
        </section>

        <div className="login-foot">
          <Link href="/" className="link login-back">
            Back to the Scare homepage
          </Link>
          <SiteFooter compact />
        </div>
      </main>

      <Lantern className="login-lantern" controls={false} density={64} />
    </div>
  );
}
