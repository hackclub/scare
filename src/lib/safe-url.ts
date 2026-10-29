import { z } from "zod";

/** Only http(s) links are safe to put in an href; anything else (javascript:, data:) becomes "#". */
export function safeHref(href: string) {
  try {
    const { protocol } = new URL(href);
    return protocol === "https:" || protocol === "http:" ? href : "#";
  } catch {
    return "#";
  }
}

const SAME_SITE = "http://scare.invalid";

/**
 * A same-site path to send someone to after sign-in, or the fallback. Resolved the way a browser
 * would, so "//evil.com", "/\evil.com" and tab/newline tricks (all of which leave the site) fail.
 */
export function safePath(p: string | null | undefined, fallback = "/platform") {
  if (!p?.startsWith("/")) return fallback;
  try {
    const url = new URL(p, SAME_SITE);
    return url.origin === SAME_SITE ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

/**
 * A web link, typed loosely: "itch.io/game" is fine and gets https:// added. It still has to be a
 * real http(s) address with a proper domain. z.string().url() alone accepts javascript:, data: and
 * the like, which become XSS in an href.
 */
export const httpUrl = (empty: string) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => v.length > 0, empty)
    .transform((v, ctx) => {
      const link = normalizeLink(v);
      if (link) return link;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "That doesn't look like a link. Something like itch.io/your-game",
      });
      return z.NEVER;
    });

function normalizeLink(raw: string) {
  if (/\s/.test(raw)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    const web = url.protocol === "https:" || url.protocol === "http:";
    const domain = /^([a-z\d-]+\.)+[a-z\d-]{2,}$/i.test(url.hostname);
    if (!web || !domain || url.username || url.password) return null;
    // Bare domains come back as "https://meow.com/"; keep them as typed.
    return url.pathname === "/" && !url.search && !url.hash && !raw.endsWith("/")
      ? `${url.protocol}//${url.host}`
      : url.href;
  } catch {
    return null;
  }
}
