"use client";

import { useEffect, useState } from "react";

import { ArrowRight, Dice } from "~/app/_components/icons";
import { IDEAS, PARTS, describe, type Roll } from "~/lib/ideas";

export interface Draft {
  title: string;
  pitch: string;
  /** Bumps on every use, so using the same idea twice still reopens the form. */
  n: number;
}

const LABELS = ["Where", "What's there", "How you play", "The twist"] as const;
const COMBOS = PARTS.reduce((n, p) => n * p.length, 1);

const pick = (len: number, not?: number) => {
  if (len < 2) return 0;
  let i = Math.floor(Math.random() * len);
  if (i === not) i = (i + 1) % len;
  return i;
};
const lineFor = (part: number, i: number) => {
  const v = PARTS[part]![i]!;
  return typeof v === "string" ? v : v.text;
};

/** Deals a horror game premise from four lists. Click a line to redeal just that part. */
export function IdeaGenerator({ onUse }: { onUse: (d: Omit<Draft, "n">) => void }) {
  // A fixed first deal, so the server and the browser render the same thing; shuffled on mount.
  const [roll, setRoll] = useState<Roll>([0, 0, 0, 0]);
  const [dealt, setDealt] = useState([0, 0, 0, 0]);

  useEffect(() => {
    setRoll(PARTS.map((p) => pick(p.length)) as Roll);
  }, []);

  const reroll = (only?: number) => {
    setRoll((r) => r.map((v, i) => (only === undefined || only === i ? pick(PARTS[i]!.length, v) : v)) as Roll);
    setDealt((d) => d.map((v, i) => (only === undefined || only === i ? v + 1 : v)));
  };

  const idea = describe(roll);

  return (
    <section className="frame pj-gen" aria-labelledby="gen-title">
      <div className="frame-head">
        <span id="gen-title">Idea generator</span>
        <span>{COMBOS.toLocaleString("en-US")} combos</span>
      </div>
      <div className="pj-gen-body">
        <p className="pj-gen-name" aria-live="polite">
          {idea.title}
        </p>
        <ol className="pj-gen-parts">
          {LABELS.map((label, i) => {
            const line = lineFor(i, roll[i] ?? 0);
            return (
              <li key={label}>
                <button
                  type="button"
                  className="pj-gen-part"
                  onClick={() => reroll(i)}
                  aria-label={`${label}: ${line}. Reroll this part.`}
                >
                  <span className="pj-gen-label">{label}</span>
                  {/* Keyed on the deal count, so a new line fades in instead of swapping silently. */}
                  <span key={dealt[i]} className="pj-gen-line">
                    {line}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="pj-gen-actions">
          <button type="button" className="btn btn-ghost" onClick={() => reroll()}>
            <Dice className="btn-icon" />
            <span>Roll again</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onUse(idea)}>
            <span>Use this idea</span>
            <ArrowRight className="btn-icon" />
          </button>
        </div>
        <p className="pj-gen-hint">Click any line to reroll just that part.</p>
      </div>
    </section>
  );
}

/** Ready-made ideas, one of each kind of project that counts. */
export function IdeaShelf({ onUse }: { onUse: (d: Omit<Draft, "n">) => void }) {
  return (
    <section className="frame pj-shelf" aria-labelledby="shelf-title">
      <div className="frame-head">
        <span id="shelf-title">Ideas to steal</span>
        <span>{IDEAS.length}</span>
      </div>
      <ul className="pj-ideas">
        {IDEAS.map((idea) => (
          <li key={idea.title} className="pj-idea">
            <p className="pj-idea-meta">
              <span className="pj-idea-kind">{idea.kind}</span>
              <span>{idea.size}</span>
            </p>
            <p className="pj-idea-title">{idea.title}</p>
            <p className="pj-idea-pitch">{idea.pitch}</p>
            <button
              type="button"
              className="link link-quiet pj-idea-use"
              onClick={() => onUse({ title: idea.title, pitch: idea.pitch })}
            >
              Start this <ArrowRight className="link-icon" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
