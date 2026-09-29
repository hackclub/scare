import { Ascii, type ArtName } from "./_components/ascii";
import { SignInButton } from "./_components/auth-buttons";
import { Countdown } from "./_components/countdown";
import { GlyphText } from "./_components/glyph-text";
import { Hud } from "./_components/hud";
import { ArrowDown, ArrowUpRight, Check } from "./_components/icons";
import { Lantern } from "./_components/lantern";
import { DEADLINE_LABEL, LINKS } from "~/lib/program";

const STEPS: { art: ArtName; title: string; body: React.ReactNode }[] = [
  {
    art: "make",
    title: "Make",
    body: (
      <>
        Build a horror game. Any engine, any size: Godot, Unity, PICO-8, a
        browser tab. If it&rsquo;s trying to scare someone, it counts.
      </>
    ),
  },
  {
    art: "ship",
    title: "Ship",
    body: (
      <>
        Put it where other people can play it: itch.io, a web build, a
        download. Ideas don&rsquo;t ship. Playable games do.
      </>
    ),
  },
  {
    art: "earn",
    title: "Earn",
    body: (
      <>
        Shipping earns you <strong>Pumpkins</strong>, Scare&rsquo;s currency.{" "}
        <span className="tba">Earn rate announced soon</span>
      </>
    ),
  },
  {
    art: "spend",
    title: "Spend",
    body: (
      <>
        Trade your Pumpkins for Steam games in the Pumpkin Shop. The shop opens
        later.
      </>
    ),
  },
];

const RULES: React.ReactNode[] = [
  <>It&rsquo;s a horror game. Creepy, tense, gross, unsettling: your call.</>,
  <>Someone else can play it, from a link that works.</>,
  <>You ship it before the lights go out on {DEADLINE_LABEL}.</>,
  <>Your Hack Club account is verified for YSWS. You&rsquo;ll see this after you sign in.</>,
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "I've never made a game. Can I still do this?",
    a: (
      <>
        Yes, and it&rsquo;s a good first game. Keep it small: one room, one
        monster, one scare. Godot is free and friendly. PICO-8 and Bitsy are
        tiny. A single HTML file with a canvas works too.
      </>
    ),
  },
  {
    q: "Does it have to be 3D, or long?",
    a: (
      <>
        No. A two-minute game that makes someone jump beats a two-hour one
        nobody finishes. Text adventures, pixel art and flat 2D all count.
      </>
    ),
  },
  {
    q: "What are Pumpkins?",
    a: (
      <>
        Scare&rsquo;s currency. Shipping horror games earns them, and you spend
        them on Steam games in the Pumpkin Shop, which opens later.
      </>
    ),
  },
  {
    q: "When does it end?",
    a: (
      <>
        Halloween, {DEADLINE_LABEL}. The countdown at the top of the page is
        live.
      </>
    ),
  },
  {
    q: "What's Hack Club? What's a YSWS?",
    a: (
      <>
        <a href={LINKS.hackClub} className="link">
          Hack Club
        </a>{" "}
        is a nonprofit community of teenagers who make things with code. YSWS
        means You Ship, We Ship: you ship a project, and Hack Club ships you
        something back. For Scare, that&rsquo;s Steam games.
      </>
    ),
  },
  {
    q: "Do I need an account?",
    a: (
      <>
        You sign in with your Hack Club account. If you don&rsquo;t have one
        yet, you can make one on the way in.
      </>
    ),
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  const { signin } = await searchParams;

  return (
    <>
      <Hud />
      <main id="main">
        {/* ---------------------------------------------------------- hero */}
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <GlyphText
              id="hero-title"
              as="h1"
              text="SCARE"
              bold
              shadow
              scale={2}
              narrowScale={1}
              max={9}
              className="hero-word"
            />
            <p className="hero-lead">
              Make a horror game. Ship it before the lights go out on
              Halloween. Shipping earns you Pumpkins, and Pumpkins buy Steam
              games.
            </p>

            {signin === "unavailable" && (
              <p className="notice" role="status">
                Sign-in isn&rsquo;t connected on this server yet. Add the Hack
                Club Auth keys to <code>.env</code> and try again.
              </p>
            )}

            <div className="hero-actions">
              <SignInButton />
              <a href="#deal" className="btn btn-ghost">
                <span>How it works</span>
                <ArrowDown className="btn-icon" />
              </a>
            </div>

            <dl className="hero-facts">
              <div>
                <dt>Ends</dt>
                <dd>{DEADLINE_LABEL}</dd>
              </div>
              <div>
                <dt>You get</dt>
                <dd>Steam games</dd>
              </div>
              <div>
                <dt>Who</dt>
                <dd>Teenagers in Hack Club</dd>
              </div>
            </dl>
          </div>

          <Lantern className="hero-lantern" />
        </section>

        {/* ---------------------------------------------------------- deal */}
        <section id="deal" className="band" aria-labelledby="deal-title">
          <div className="band-head">
            <GlyphText
              as="h2"
              id="deal-title"
              text="THE DEAL"
              max={5.5}
              scale={2}
              narrowScale={1}
              bold
              className="band-title"
            />
          </div>

          <div className="frame">
            <div className="frame-head">
              <span>How Scare works</span>
              <span>4 steps · 1 deadline</span>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s.title} className="step">
                  <span className="step-n" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-body">{s.body}</p>
                  <Ascii name={s.art} className="step-art" />
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------ pumpkins */}
        <section
          id="pumpkins"
          className="band band-split"
          aria-labelledby="pumpkins-title"
        >
          <div className="split-copy">
            <GlyphText
              as="h2"
              id="pumpkins-title"
              text="PUMPKINS"
              max={5.5}
              scale={2}
              narrowScale={1}
              bold
              className="band-title"
            />
            <p className="band-lead">
              Pumpkins are what you earn at Scare, and you earn them by
              shipping horror games.
            </p>

            <div className="frame frame-ledger">
              <div className="frame-head">
                <span>Ledger</span>
                <span>Pumpkins</span>
              </div>
              <dl className="ledger">
                <div>
                  <dt>Currency</dt>
                  <dd>Pumpkins</dd>
                </div>
                <div>
                  <dt>How you earn them</dt>
                  <dd>Ship a horror game</dd>
                </div>
                <div>
                  <dt>Earn rate</dt>
                  <dd>
                    <span className="tba">Announced soon</span>
                  </dd>
                </div>
                <div>
                  <dt>What they buy</dt>
                  <dd>Steam games</dd>
                </div>
                <div>
                  <dt>The Pumpkin Shop</dt>
                  <dd>Opens later</dd>
                </div>
                <div>
                  <dt>Last day to ship</dt>
                  <dd>{DEADLINE_LABEL}</dd>
                </div>
              </dl>
            </div>
          </div>

          <figure className="shop">
            <Ascii name="shop" className="shop-art" />
            <figcaption className="shop-caption">
              The shop is still being carved. Ship now, spend later.
            </figcaption>
          </figure>
        </section>

        {/* --------------------------------------------------------- rules */}
        <section
          id="rules"
          className="band band-aside"
          aria-labelledby="rules-title"
        >
          <div className="aside-head">
            <GlyphText
              as="h2"
              id="rules-title"
              text={"WHAT\nCOUNTS"}
              max={5.5}
              scale={2}
              narrowScale={1}
              bold
              className="band-title"
            />
            <p className="band-sub">
              Your game has to pass all of these. More rules are coming.
            </p>
          </div>

          <div className="frame">
            <div className="frame-head">
              <span>Checklist</span>
              <span>4 rules · 1 pending</span>
            </div>
            <ul className="rules">
              {RULES.map((r, i) => (
                <li key={i} className="rule">
                  <span className="rule-box" aria-hidden="true">
                    [<Check className="rule-check" />]
                  </span>
                  <span>{r}</span>
                </li>
              ))}
              <li className="rule rule-pending">
                <span className="rule-box" aria-hidden="true">
                  [&nbsp;]
                </span>
                <span>
                  The full requirements, like team size and how games get
                  reviewed, are still being written.{" "}
                  <span className="tba">Posted soon</span>
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* ----------------------------------------------------------- faq */}
        <section
          id="faq"
          className="band band-aside"
          aria-labelledby="faq-title"
        >
          <div className="aside-head">
            <GlyphText
              as="h2"
              id="faq-title"
              text="FAQ"
              max={5.5}
              scale={2}
              narrowScale={1}
              bold
              className="band-title"
            />
            <p className="band-sub">
              Still stuck? Ask in the{" "}
              <a href={LINKS.slack} className="link">
                Hack Club Slack
              </a>
              .
            </p>
          </div>

          <div className="frame">
            <div className="frame-head">
              <span>Questions</span>
              <span>{FAQ.length} answered</span>
            </div>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q} className="faq-item">
                  <summary>
                    <span className="faq-prompt" aria-hidden="true">
                      &gt;
                    </span>
                    <span className="faq-q">{f.q}</span>
                    <span className="faq-toggle" aria-hidden="true" />
                  </summary>
                  <p className="faq-a">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- close */}
        <section className="close" aria-labelledby="close-title">
          <GlyphText
            as="h2"
            id="close-title"
            text="LIGHTS OUT"
            bold
            shadow
            scale={2}
            narrowScale={1}
            max={6.5}
            className="close-title"
          />
          <Countdown variant="glyph" />
          <p className="close-lead">
            When the clock hits zero, the candle goes out. Ship before it does.
          </p>
          <SignInButton />
        </section>
      </main>

      <footer className="foot">
        <p>
          Scare is a{" "}
          <a href={LINKS.hackClub} className="link">
            Hack Club
          </a>{" "}
          YSWS. Hack Club is a 501(c)(3) nonprofit.
        </p>
        <nav aria-label="Elsewhere" className="foot-links">
          <a href={LINKS.slack} className="link">
            Hack Club Slack <ArrowUpRight className="link-icon" />
          </a>
          <a href={LINKS.hackClub} className="link">
            hackclub.com <ArrowUpRight className="link-icon" />
          </a>
        </nav>
      </footer>
    </>
  );
}
