"use client";

import { useEffect, useState } from "react";

/**
 * The Keeper of the patch: a hooded figure whose face you never quite see,
 * and the lantern they carry. Decorative; the lines beside it carry the meaning.
 */
export function KeeperPortrait() {
  return (
    <pre className="keeper-art" aria-hidden="true">
      {"       .-~~~-.\n"}
      {"     .'       '.\n"}
      {"    /   "}
      <span className="keeper-eye">.</span>
      {"   "}
      <span className="keeper-eye">.</span>
      {"   \\\n"}
      {"   |    '   '    |\n"}
      {"   |             |       .\n"}
      {"    \\           /      .'|'.\n"}
      {"     )'-.___.-'(       | "}
      <span className="keeper-flame">@</span>
      {" |\n"}
      {"    /           \\______'---'\n"}
      {"   /             \\\n"}
      {"  /_______________\\"}
    </pre>
  );
}

/**
 * A line typed out a character at a time. Click it (or press a key) to finish at once;
 * assistive tech gets the whole line straight away.
 */
export function TypedLine({ text, onDone }: { text: string; onDone?: () => void }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(text.length);
      return;
    }
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) clearInterval(id);
    }, 26);
    const finish = () => {
      clearInterval(id);
      setN(text.length);
    };
    window.addEventListener("keydown", finish, { once: true });
    return () => {
      clearInterval(id);
      window.removeEventListener("keydown", finish);
    };
  }, [text]);

  const done = n >= text.length;
  useEffect(() => {
    if (done) onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, text]);

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {text}
      </p>
      <p className="keeper-line" aria-hidden="true" onClick={() => setN(text.length)}>
        {text.slice(0, n)}
        <span className={`keeper-caret ${done ? "keeper-caret-idle" : ""}`} />
      </p>
    </>
  );
}
