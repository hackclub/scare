"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ArrowRight, ArrowUpRight, PumpkinMark } from "~/app/_components/icons";
import { Lantern, type PartState } from "~/app/_components/lantern";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { api } from "~/trpc/react";
import { KeeperPortrait, TypedLine } from "./keeper";

type Step = "arrive" | "eyes" | "mouth" | "nose" | "lit";
type Part = "eyes" | "mouth" | "nose";

const ORDER: Part[] = ["eyes", "mouth", "nose"];

const TOUR = [
  { label: "Home", line: "Home shows what to do next, how many Pumpkins you have, and how long until the deadline." },
  { label: "Projects", line: "Projects is where your games live, with the hours you've logged on each." },
  {
    label: "Shop",
    line: `The Shop is where you spend Pumpkins. You get ${PUMPKINS_PER_HOUR} for every hour you code.`,
  },
  { label: "Profile", line: "Profile has your Hack Club account and your Hackatime link." },
];

/** What the Keeper says when you come back from Hackatime. */
const HACKATIME_RETURN: Record<string, string> = {
  linked: "Nice, Hackatime is linked. It has eyes now.",
  denied: "No problem. You can link Hackatime later from your profile.",
  expired: "That didn't go through. Want to try again?",
  failed: "Hackatime didn't accept that. Try again, or skip it for now.",
  unavailable: "Hackatime isn't responding right now. Try again in a minute, or skip it for now.",
  taken: "That Hackatime account is already linked to someone else.",
  unconfigured: "Hackatime linking isn't set up yet, so we'll skip this one.",
};

const field = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" ? v : "";
};

export function CarvingTable({
  seed,
  hackatime,
  firstGame,
  returnStatus,
}: {
  seed: number;
  hackatime: { configured: boolean; linked: boolean };
  firstGame: string | null;
  returnStatus: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(returnStatus ? "eyes" : "arrive");
  const [done, setDone] = useState<Record<Part, boolean>>({
    eyes: hackatime.linked,
    mouth: Boolean(firstGame),
    nose: false, // the tour is always offered; walking it carves the nose
  });
  const [game, setGame] = useState(firstGame);
  const [tourAt, setTourAt] = useState(0);
  const [lineDone, setLineDone] = useState(false);
  const [finale, setFinale] = useState(false);

  const complete = api.onboarding.complete.useMutation();
  const markTour = api.onboarding.tourSeen.useMutation();
  const create = api.game.create.useMutation({
    onSuccess: (g) => {
      setGame(g.title);
      setDone((d) => ({ ...d, mouth: true }));
    },
  });

  // Features ahead of you are blank; the one you're on is sketched; behind you, cut or sketched.
  const parts = useMemo(() => {
    const at = step === "arrive" ? -1 : step === "lit" ? 3 : ORDER.indexOf(step);
    const state = (p: Part, i: number): PartState =>
      done[p] ? "carved" : i <= at ? "sketch" : "blank";
    return { eyes: state("eyes", 0), mouth: state("mouth", 1), nose: state("nose", 2) };
  }, [step, done]);

  const go = (next: Step) => {
    setLineDone(false);
    setStep(next);
  };

  const enter = async () => {
    await complete.mutateAsync().catch(() => undefined);
    router.push("/platform");
  };

  const light = () => {
    go("lit");
    // "Hold still." then the candle, then the welcome once it has caught.
    setTimeout(() => setFinale(true), 1900);
  };

  const connectHref = `/api/hackatime/connect?next=${encodeURIComponent("/welcome?step=eyes")}`;

  /* --------------------------------------------------------- the Keeper's line */
  let line: string;
  switch (step) {
    case "arrive":
      line =
        "Hey, you're new here. I'm the Keeper. Everyone making a game for Scare gets a pumpkin, and this one's yours. Let's carve it.";
      break;
    case "eyes":
      line = done.eyes
        ? returnStatus === "linked"
          ? HACKATIME_RETURN.linked!
          : "You've already linked Hackatime, so the eyes are done."
        : returnStatus && HACKATIME_RETURN[returnStatus]
          ? HACKATIME_RETURN[returnStatus]
          : !hackatime.configured
            ? HACKATIME_RETURN.unconfigured!
            : `First, the eyes. Link Hackatime so we can see how long you code. Every hour is worth ${PUMPKINS_PER_HOUR} Pumpkins.`;
      break;
    case "mouth":
      line = done.mouth && game
        ? `“${game}” sounds terrifying. Nice.`
        : "Now the mouth. Tell me about your game: a name, one sentence, and a link to the code.";
      break;
    case "nose":
      line = done.nose
        ? "That's the tour. Let's light it up."
        : `${tourAt === 0 ? "Last part, a quick tour. " : ""}${TOUR[tourAt]!.line}`;
      break;
    case "lit":
      line = finale ? "Welcome to Scare - we are looking forward to your creation." : "Lighting it...";
      break;
  }

  /* --------------------------------------------------------------- the action */
  let action: React.ReactNode;
  if (step === "arrive") {
    action = (
      <div className="wel-actions">
        <button type="button" className="btn btn-primary" onClick={() => go("eyes")}>
          <span>Start carving</span>
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    );
  } else if (step === "eyes") {
    action = done.eyes || !hackatime.configured ? (
      <div className="wel-actions">
        <button type="button" className="btn btn-primary" onClick={() => go("mouth")}>
          <span>Next</span>
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    ) : (
      <div className="wel-actions">
        <a href={connectHref} className="btn btn-primary">
          <span>Link Hackatime</span>
          <ArrowUpRight className="btn-icon" />
        </a>
        <button type="button" className="btn btn-ghost" onClick={() => go("mouth")}>
          Skip
        </button>
      </div>
    );
  } else if (step === "mouth") {
    action = done.mouth ? (
      <div className="wel-actions">
        <button type="button" className="btn btn-primary" onClick={() => go("nose")}>
          <span>Next</span>
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    ) : (
      <form
        className="wel-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          create.mutate({
            title: field(f, "title"),
            pitch: field(f, "pitch"),
            sourceUrl: field(f, "sourceUrl"),
          });
        }}
        noValidate
      >
        <div className="field">
          <label htmlFor="wel-title" className="field-label">
            Name
          </label>
          <input id="wel-title" name="title" className="input" placeholder="The Thing in the Vents" maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="wel-pitch" className="field-label">
            One-line pitch
          </label>
          <input
            id="wel-pitch"
            name="pitch"
            className="input"
            placeholder="You're alone on a night shift and the cameras keep moving."
            maxLength={280}
          />
        </div>
        <div className="field">
          <label htmlFor="wel-source" className="field-label">
            Source code
          </label>
          <input
            id="wel-source"
            name="sourceUrl"
            type="url"
            className="input"
            placeholder="https://github.com/…"
            maxLength={500}
          />
        </div>
        {create.error && (
          <p className="form-error" role="alert">
            {create.error.data?.zodError?.fieldErrors
              ? Object.values(create.error.data.zodError.fieldErrors).flat()[0]
              : "That didn't save. Try again in a moment."}
          </p>
        )}
        <div className="wel-actions">
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            <span>{create.isPending ? "Saving…" : "Add my game"}</span>
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => go("nose")}>
            Skip
          </button>
        </div>
        <p className="wel-hint">You can edit this later in Projects.</p>
      </form>
    );
  } else if (step === "nose") {
    action = done.nose ? (
      <div className="wel-actions">
        <button type="button" className="btn btn-primary" onClick={light}>
          <span>Light it</span>
        </button>
      </div>
    ) : (
      <div className="wel-tour">
        <ol className="wel-rail" aria-label="The platform's pages">
          {TOUR.map((t, i) => (
            <li key={t.label} className="wel-rail-item" aria-current={i === tourAt ? "step" : undefined}>
              <PumpkinMark className="wel-rail-pumpkin" />
              {t.label}
            </li>
          ))}
        </ol>
        <div className="wel-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (tourAt < TOUR.length - 1) {
                setLineDone(false);
                setTourAt(tourAt + 1);
              } else {
                markTour.mutate();
                setDone((d) => ({ ...d, nose: true }));
              }
            }}
          >
            <span>{tourAt < TOUR.length - 1 ? "Next" : "Got it"}</span>
            <ArrowRight className="btn-icon" />
          </button>
          <button type="button" className="btn btn-ghost" onClick={light}>
            Skip
          </button>
        </div>
      </div>
    );
  } else {
    action = finale ? (
      <div className="wel-actions">
        <button type="button" className="btn btn-primary" onClick={enter} disabled={complete.isPending}>
          <span>Go to Scare</span>
          <ArrowRight className="btn-icon" />
        </button>
      </div>
    ) : null;
  }

  const progress = ORDER.map((p) => ({
    p,
    label: p === "eyes" ? "Eyes" : p === "mouth" ? "Mouth" : "Nose",
    hint: p === "eyes" ? "Hackatime" : p === "mouth" ? "Your game" : "The tour",
    state: parts[p],
  }));

  return (
    <div className="wel" data-step={step}>
      <header className="wel-top">
        <span className="wel-brand">
          <PumpkinMark className="wel-brand-pumpkin" />
          <span className="wel-brand-word">SCARE</span>
          <span className="wel-brand-tag">setup</span>
        </span>
        {step !== "lit" && (
          <button type="button" className="link link-quiet wel-skip" onClick={enter}>
            Skip setup
          </button>
        )}
      </header>

      <main id="main" className="wel-stage">
        <section className="wel-keeper" aria-label="The Keeper">
          <KeeperPortrait />
          <p className="wel-keeper-name">The Keeper</p>
          <TypedLine key={`${step}-${tourAt}-${line}`} text={line} onDone={() => setLineDone(true)} />
        </section>

        <div className="wel-center">
          <Lantern
            className="wel-lantern"
            controls={false}
            density={70}
            carving={{ seed, parts, lit: step === "lit" }}
            label="Your pumpkin."
          />
          <ol className="wel-progress" aria-label="Your lantern">
            {progress.map((x) => (
              <li key={x.p} className={`wel-progress-item wel-progress-${x.state}`}>
                <span className="wel-progress-label">{x.label}</span>
                <span className="wel-progress-hint">
                  {x.state === "carved" ? "done" : x.state === "sketch" ? "not yet" : x.hint}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <section className={`wel-act ${lineDone ? "wel-act-ready" : ""}`} aria-label="What to do">
          {action}
          {step === "lit" && finale && <p className="wel-hint">Pumpkin #{seed}</p>}
        </section>
      </main>
    </div>
  );
}
