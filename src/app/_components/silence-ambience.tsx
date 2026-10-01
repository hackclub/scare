"use client";

import { useEffect } from "react";

import { silenceAmbience } from "~/lib/ambience";

/** Mount on pages that should be quiet; the landing page's ambience stops here. */
export function SilenceAmbience() {
  useEffect(() => {
    silenceAmbience();
  }, []);
  return null;
}
