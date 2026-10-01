/** Screenshot rules, shared by the upload route and the client-side pre-check. */
export const SCREENSHOT_MAX_BYTES = 5 * 1024 * 1024;
export const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/webp";

export type SniffResult =
  | { ok: true; mime: "image/png" | "image/jpeg" | "image/webp" }
  | { ok: false; message: string };

const ascii = (b: Uint8Array, start: number, len: number) =>
  String.fromCharCode(...b.subarray(start, start + len));

/** An animated PNG carries an acTL chunk before its image data. */
function isAnimatedPng(b: Uint8Array) {
  let i = 8;
  while (i + 8 <= b.length) {
    const len = ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
    const type = ascii(b, i + 4, 4);
    if (type === "acTL") return true;
    if (type === "IDAT" || type === "IEND") return false;
    i += 12 + len;
  }
  return false;
}

/** Animated WebP sets the animation flag in its VP8X header (or carries an ANIM chunk). */
function isAnimatedWebp(b: Uint8Array) {
  if (ascii(b, 12, 4) === "VP8X" && (b[20]! & 0x02) !== 0) return true;
  return ascii(b, 12, b.length - 12 > 4096 ? 4096 : b.length - 12).includes("ANIM");
}

/** Decide by the file's bytes, never its name or claimed type. */
export function sniffScreenshot(b: Uint8Array): SniffResult {
  if (b.length < 16) return { ok: false, message: "That file is empty or broken." };
  if (ascii(b, 0, 4) === "GIF8") {
    return { ok: false, message: "GIFs aren't allowed. Use a PNG or JPG screenshot." };
  }
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") {
    return isAnimatedPng(b)
      ? { ok: false, message: "Animated images aren't allowed. Use a still screenshot." }
      : { ok: true, mime: "image/png" };
  }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ok: true, mime: "image/jpeg" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    return isAnimatedWebp(b)
      ? { ok: false, message: "Animated images aren't allowed. Use a still screenshot." }
      : { ok: true, mime: "image/webp" };
  }
  return { ok: false, message: "That isn't a PNG, JPG or WebP image." };
}
