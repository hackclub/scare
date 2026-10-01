import { Ascii, type ArtName } from "./_components/ascii";
import { SignInButton } from "./_components/auth-buttons";
import { Countdown } from "./_components/countdown";
import { DashboardLink } from "./_components/dashboard-link";
import { Glitch } from "./_components/glitch";
import { GlyphText } from "./_components/glyph-text";
import { Hud } from "./_components/hud";
import { HackClubFlag } from "./_components/hack-club-flag";
import { ArrowDown, Check, Heart } from "./_components/icons";
import { Lantern } from "./_components/lantern";
import { ShopPreview } from "./_components/shop-preview";
import { SiteFooter } from "./_components/site-footer";
import { MorphText } from "./_components/morph-text";
import { DEADLINE_LABEL, LINKS, PUMPKINS_PER_HOUR } from "~/lib/program";
import { auth } from "~/server/auth";

const STEPS: { art: ArtName; title: string; body: React.ReactNode }[] = [
  {
    art: "make",
    title: "Make",
    body: (
      <>
        Build something scary in any engine. Godot, Unity, PICO-8, one HTML
        file. Track it with Hackatime so your hours show up.
      </>
    ),
  },
  {
    art: "ship",
    title: "Submit",
    body: (
      <>
        Create a project and submit what you built where it&rsquo;s playable
        (ie. Itch!). Someone at Hack Club plays it, gets scared, and reviews
        it.
      </>
    ),
  },
  {
    art: "earn",
    title: "Earn",
    body: (
      <>
        Once it&rsquo;s approved, every hour you put in pays{" "}
        <strong>{PUMPKINS_PER_HOUR} Pumpkins</strong> - which you can use for
        games, costumes, candy, laptops, and more! All for free.
      </>
    ),
  },
  {
    art: "spend",
    title: "Spend",
    body: (
      <>
        You can spend it on anything in our 20+ item shop or suggest something
        you want - all for building a cool game!
      </>
    ),
  },
];

const REWARDS = ["Steam games", "Candy", "A Switch Lite", "Rubber ducks", "Costume grants", "A huge Blåhaj"];
const WORKS = ["Horror games", "LED costumes", "Horror websites"];

const RULES: { label: string; tip?: string }[] = [
  { label: "Horror games" },
  {
    label: "Custom Halloween Costumes",
    tip: "Costumes must include some technical aspects that involve custom hardware/code",
  },
  { label: "Horror websites" },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "I've never made a game. Can I still do this?",
    a: (
      <>
        Yes. Keep it small: one room, one monster, one bad feeling. Godot is
        free. PICO-8 and Bitsy are tiny. A canvas in an HTML file works too.
      </>
    ),
  },
  {
    q: "Does it have to be long?",
    a: (
      <>
        No. Two minutes that make someone jump beat two hours nobody
        finishes. Text adventures and flat 2D count.
      </>
    ),
  },
  {
    q: "How are my hours counted?",
    a: (
      <>
        Link Hackatime and pick your project, and its tracked time comes with
        it. You can edit the number if Hackatime missed some. A reviewer checks
        it before anything is paid.
      </>
    ),
  },
  {
    q: "What happens after I ship?",
    a: (
      <>
        Someone from Hack Club plays it. If it holds up, it&rsquo;s approved and
        your Pumpkins land. If something&rsquo;s off, it comes back with a note,
        and you fix it and ship again.
      </>
    ),
  },
  {
    q: "What can I get with Pumpkins?",
    a: (
      <>
        Steam grants, candy, a Flipper Zero, a Switch Lite, rubber ducks in
        three worrying sizes, and costume and hardware grants. Don&rsquo;t see
        what you want? Suggest it from the shop.
      </>
    ),
  },
  {
    q: "When does it end?",
    a: <>Halloween, {DEADLINE_LABEL}. The countdown up top is real.</>,
  },
  {
    q: "What's Hack Club? What's a YSWS?",
    a: (
      <>
        <a href={LINKS.hackClub} className="link">
          Hack Club
        </a>{" "}
        is a nonprofit for teenagers who make things. YSWS means You Ship, We
        Ship: you ship a project, and we ship you something back.
      </>
    ),
  },
  {
    q: "Do I need an account?",
    a: (
      <>
        You sign in with Hack Club. No account yet? You can make one on the way
        in.
      </>
    ),
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signin?: string }>;
}) {
  const [{ signin }, session] = await Promise.all([searchParams, auth()]);
  const cta = session ? <DashboardLink /> : <SignInButton />;

  return (
    <>
      <Hud />
      <main id="main">
        {/* ---------------------------------------------------------- hero */}
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <a href={LINKS.hackClub} className="hero-flag" aria-label="Hack Club">
              <HackClubFlag id="hc-flag-hero" />
            </a>
            <GlyphText
              id="hero-title"
              as="h1"
              text="SCARE"
              bold
              shadow
              scale={2}
              narrowScale={1}
              max={9}
              lit
              className="hero-word"
            />
            <p className="hero-byline">
              Ran with <Heart className="hero-heart" title="love" /> by Barnav
            </p>
            <p className="hero-lead">
              Make a <Glitch>Horror</Glitch> game. Get free video games, candy,
              hardware, and more!
            </p>

            {signin === "unavailable" && (
              <p className="notice" role="status">
                Sign-in isn&rsquo;t connected on this server yet. Add the Hack
                Club Auth keys to <code>.env</code> and try again.
              </p>
            )}

            <div className="hero-actions">
              {cta}
              <a href="#deal" className="btn btn-ghost">
                <span>How it works</span>
                <ArrowDown className="btn-icon" />
              </a>
            </div>

            <dl className="hero-facts">
              <div className="hero-fact-ends">
                <dt>Ends</dt>
                <dd>{DEADLINE_LABEL}</dd>
                <Countdown variant="mini" />
              </div>
              <div>
                <dt>You get</dt>
                <dd>
                  <MorphText words={REWARDS} />
                </dd>
              </div>
              <div>
                <dt>What works</dt>
                <dd>
                  <MorphText words={WORKS} offset={1200} />
                </dd>
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
        <section id="pumpkins" className="band" aria-labelledby="pumpkins-title">
          <div className="band-head">
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
              Pumpkins are Scare&rsquo;s currency. You earn {PUMPKINS_PER_HOUR} for every
              hour of code you ship!
            </p>
          </div>
          <ShopPreview />
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
              Build something scary! Jumpscares, shadows, the like!
            </p>
          </div>

          <div className="frame">
            <div className="frame-head">
              <span>Checklist</span>
              <span>{RULES.length} kinds</span>
            </div>
            <ul className="rules">
              {RULES.map((r, i) => (
                <li key={r.label} className="rule">
                  <span className="rule-box" aria-hidden="true">
                    [<Check className="rule-check" />]
                  </span>
                  {r.tip ? (
                    <span
                      className="rule-tip"
                      tabIndex={0}
                      aria-describedby={`rule-tip-${i}`}
                    >
                      {r.label}
                      <span
                        id={`rule-tip-${i}`}
                        role="tooltip"
                        className="rule-tip-body"
                      >
                        {r.tip}
                      </span>
                    </span>
                  ) : (
                    <span>{r.label}</span>
                  )}
                </li>
              ))}
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
              <a href={LINKS.slackChannel} className="link" target="_blank" rel="noreferrer">
                #scare channel
              </a>
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
            text="SCARE ENDS IN..."
            bold
            shadow
            scale={2}
            narrowScale={1}
            max={6.5}
            className="close-title"
          />
          <Countdown variant="glyph" />
          <p className="close-lead">
            Scare ends on Halloween... all games must be in by then!
          </p>
          {cta}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
