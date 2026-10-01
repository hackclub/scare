/** Only http(s) links are safe to put in an href; anything else (javascript:, data:) becomes "#". */
export function safeHref(href: string) {
  try {
    const { protocol } = new URL(href);
    return protocol === "https:" || protocol === "http:" ? href : "#";
  } catch {
    return "#";
  }
}
