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
  /** The #scare channel, for help and questions. */
  slackChannel: "https://hackclub.enterprise.slack.com/archives/C0C5ZFU9292",
  auth: "https://auth.hackclub.com",
  // TBA: point these at the real pages
  fulfillmentBounty: "#",
  privacy: "#",
  terms: "#",
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

/**
 * The economy. Participants earn PUMPKINS_PER_HOUR; the program spends USD_PER_HOUR in
 * rewards for each of those hours, so one Pumpkin is worth USD_PER_HOUR / PUMPKINS_PER_HOUR.
 * Shop prices are derived from an item's dollar cost, never typed in by hand.
 */
export const PUMPKINS_PER_HOUR = 10;
export const USD_PER_HOUR = 4;
export const USD_PER_PUMPKIN = USD_PER_HOUR / PUMPKINS_PER_HOUR;

/** Pumpkin price for an item that costs the program `usd`, rounded up to a whole Pumpkin. */
export const pumpkinsFor = (usd: number) => Math.ceil(usd / USD_PER_PUMPKIN - 1e-9);

/** Pumpkins earned for a number of seconds, at the hourly rate (whole Pumpkins, rounded down). */
export const pumpkinsForSeconds = (seconds: number) =>
  Math.floor((seconds / 3600) * PUMPKINS_PER_HOUR);
