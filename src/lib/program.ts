/**
 * Program facts shown across the site. Anything marked TBA is undecided;
 * replace it here rather than in page copy.
 */

/** Midnight at the end of Halloween, US Eastern (EDT, UTC-4). */
export const DEADLINE = new Date("2026-11-01T04:00:00Z");

export const DEADLINE_LABEL = "October 31, 2026";

export const LINKS = {
  hackClub: "https://hackclub.com",
  slack: "https://hackclub.com/slack",
  auth: "https://auth.hackclub.com",
} as const;

export function timeLeft(now: number) {
  const ms = Math.max(0, DEADLINE.getTime() - now);
  const s = Math.floor(ms / 1000);
  return {
    done: ms === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export const pad = (n: number) => String(n).padStart(2, "0");
