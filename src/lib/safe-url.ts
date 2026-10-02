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
