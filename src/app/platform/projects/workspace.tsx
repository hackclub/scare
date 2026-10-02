"use client";

import { useState } from "react";

import { GameBoard } from "./game-board";
import { IdeaGenerator, IdeaShelf, type Draft } from "./ideas";

/** Projects: your games on the left, ideas on the right. Using an idea opens the form with it filled in. */
export function ProjectsWorkspace({ startAdding }: { startAdding: boolean }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const use = (d: Omit<Draft, "n">) => setDraft((prev) => ({ ...d, n: (prev?.n ?? 0) + 1 }));

  return (
    <div className="pj">
      <div className="pj-main">
        <GameBoard startAdding={startAdding} draft={draft} />
      </div>
      <aside className="pj-side" aria-label="Project ideas">
        <IdeaGenerator onUse={use} />
        <IdeaShelf onUse={use} />
      </aside>
    </div>
  );
}
