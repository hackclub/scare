"use client";

import { useEffect, useState } from "react";

import {
  ambienceMuted,
  currentAmbience,
  pauseAmbience,
  playAmbience,
  playAmbienceWhenAllowed,
} from "~/lib/ambience";
import { Speaker } from "./icons";

/** On by default, starting with the first interaction; off holds until a full reload. */
export function SoundToggle() {
  const [on, setOn] = useState(false);

  const toggle = () => {
    const next = !on;
    setOn(next);
    if (next) playAmbience();
    else pauseAmbience();
  };

  useEffect(() => {
    // Already sounding from before this toggle mounted: just reflect it.
    if (currentAmbience()?.playing) {
      setOn(true);
      return;
    }
    if (ambienceMuted()) return;
    setOn(true);
    playAmbienceWhenAllowed();
  }, []);

  // Go quiet when the tab is hidden.
  useEffect(() => {
    if (!on) return;
    const onVisibility = () => {
      if (document.hidden) currentAmbience()?.pause();
      else currentAmbience()?.play();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [on]);

  return (
    <button
      type="button"
      className="hud-sound"
      aria-pressed={on}
      aria-label="Background sound"
      onClick={toggle}
    >
      <Speaker on={on} className="hud-sound-icon" />
      <span className="hud-sound-label">{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
