"use client";

import { useEffect } from "react";

/** When the tab loses focus, the title calls after you. */
export function TabHaunt() {
  useEffect(() => {
    let original = document.title;
    const onVis = () => {
      if (document.hidden) {
        original = document.title;
        document.title = "come back…";
      } else {
        document.title = original;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return null;
}
