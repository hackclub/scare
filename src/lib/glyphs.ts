/**
 * Glyph display type: letters drawn from a 5x7 bitmap, where every lit pixel is
 * a typewriter character chosen by how much "ink" that pixel carries.
 * Deterministic, so it renders identically on the server and the client.
 */

// prettier-ignore
const FONT: Record<string, string[]> = {
  A: ["01110","10001","10001","11111","10001","10001","10001"],
  B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01110","10001","10000","10000","10000","10001","01110"],
  D: ["11110","10001","10001","10001","10001","10001","11110"],
  E: ["11111","10000","10000","11110","10000","10000","11111"],
  F: ["11111","10000","10000","11110","10000","10000","10000"],
  G: ["01110","10001","10000","10111","10001","10001","01111"],
  H: ["10001","10001","10001","11111","10001","10001","10001"],
  I: ["11111","00100","00100","00100","00100","00100","11111"],
  J: ["00111","00010","00010","00010","00010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"],
  L: ["10000","10000","10000","10000","10000","10000","11111"],
  M: ["10001","11011","10101","10101","10001","10001","10001"],
  N: ["10001","10001","11001","10101","10011","10001","10001"],
  O: ["01110","10001","10001","10001","10001","10001","01110"],
  P: ["11110","10001","10001","11110","10000","10000","10000"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"],
  R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"],
  T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"],
  V: ["10001","10001","10001","10001","10001","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"],
  X: ["10001","10001","01010","00100","01010","10001","10001"],
  Y: ["10001","10001","01010","00100","00100","00100","00100"],
  Z: ["11111","00001","00010","00100","01000","10000","11111"],
  "0": ["01110","10001","10011","10101","11001","10001","01110"],
  "1": ["00100","01100","00100","00100","00100","00100","01110"],
  "2": ["01110","10001","00001","00010","00100","01000","11111"],
  "3": ["11111","00010","00100","00010","00001","10001","01110"],
  "4": ["00010","00110","01010","10010","11111","00010","00010"],
  "5": ["11111","10000","11110","00001","00001","10001","01110"],
  "6": ["00110","01000","10000","11110","10001","10001","01110"],
  "7": ["11111","00001","00010","00100","01000","01000","01000"],
  "8": ["01110","10001","10001","01110","10001","10001","01110"],
  "9": ["01110","10001","10001","01111","00001","00010","01100"],
  ":": ["000","010","010","000","010","010","000"],
  ".": ["000","000","000","000","000","010","010"],
  "!": ["010","010","010","010","010","000","010"],
  "?": ["01110","10001","00001","00010","00100","00000","00100"],
  "'": ["010","010","100","000","000","000","000"],
  "-": ["0000","0000","0000","1111","0000","0000","0000"],
  " ": ["000","000","000","000","000","000","000"],
};

/** Density ramp, sparse to dense. The densest glyph is the highlight. */
export const RAMP = " .'`:-=+*%#@";

/** Letter bodies stay in the dense end so the word always reads. */
const DENSE = "*%#&$@";

export type Ink = 0 | 1 | 2 | 3; // 0 = shadow, 1 = dim, 2 = ink, 3 = hot

export interface GlyphCell {
  ch: string;
  ink: Ink;
}

export interface GlyphOptions {
  /** Thicken vertical strokes by one pixel, like a bold bitmap face. */
  bold?: boolean;
  /** Pixels become (2 * scale) columns by (scale) rows. */
  scale?: number;
  /** Density shadow cast one row down and two columns right. */
  shadow?: boolean;
  seed?: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Build the lit-pixel bitmap for a line of text. */
function bitmap(text: string, bold: boolean) {
  const rows: number[][] = Array.from({ length: 7 }, () => []);
  const chars = [...text.toUpperCase()];
  chars.forEach((c, i) => {
    const glyph = FONT[c] ?? FONT[" "]!;
    const w = glyph[0]!.length;
    for (let y = 0; y < 7; y++) {
      const row = glyph[y]!;
      for (let x = 0; x < w; x++) {
        let on = row[x] === "1";
        if (bold && !on && x > 0 && row[x - 1] === "1") on = true;
        rows[y]!.push(on ? 1 : 0);
      }
      if (bold) rows[y]!.push(row[w - 1] === "1" ? 1 : 0);
      if (i < chars.length - 1) rows[y]!.push(0);
    }
  });
  return rows;
}

/**
 * Render text into a grid of glyph cells. Rows are returned top to bottom.
 * Ink rises toward the bottom of each letter, as if lit from a candle below.
 */
export function renderGlyphs(text: string, opts: GlyphOptions = {}) {
  const { bold = false, scale = 1, shadow = false } = opts;
  const rand = mulberry32(opts.seed ?? hash(text));
  const px = bitmap(text, bold);
  const pw = px[0]!.length;
  const ph = 7;
  const sx = scale * 2;
  const sy = scale;
  const W = pw * sx + (shadow ? 2 : 0);
  const H = ph * sy + (shadow ? 1 : 0);

  const grid: GlyphCell[][] = Array.from({ length: H }, () =>
    Array.from({ length: W }, (): GlyphCell => ({ ch: " ", ink: 0 })),
  );

  const lit = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < pw && y < ph && px[y]![x] === 1;

  // Shadow first, so letters overwrite it.
  if (shadow) {
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        if (!lit(x, y)) continue;
        for (let dy = 0; dy < sy; dy++)
          for (let dx = 0; dx < sx; dx++) {
            const gy = y * sy + dy + 1;
            const gx = x * sx + dx + 2;
            grid[gy]![gx] = { ch: ".", ink: 0 };
          }
      }
  }

  for (let y = 0; y < ph; y++)
    for (let x = 0; x < pw; x++) {
      if (!lit(x, y)) continue;
      const edge =
        !lit(x - 1, y) || !lit(x + 1, y) || !lit(x, y - 1) || !lit(x, y + 1);
      for (let dy = 0; dy < sy; dy++)
        for (let dx = 0; dx < sx; dx++) {
          // Brighter toward the foot of the letter, noisier at its edges.
          const t = (y * sy + dy) / (ph * sy - 1);
          let v = 0.62 + t * 0.36 - (edge ? 0.08 : 0) + (rand() - 0.5) * 0.16;
          v = Math.max(0, Math.min(1, v));
          const ch = DENSE[Math.min(DENSE.length - 1, Math.floor(v * DENSE.length))]!;
          const ink: Ink = v > 0.84 ? 3 : v > 0.42 ? 2 : 1;
          grid[y * sy + dy]![x * sx + dx] = { ch, ink };
        }
    }

  return grid;
}

/** Collapse a row into runs of equal ink so the DOM stays small. */
export function toRuns(row: GlyphCell[]) {
  const runs: { ink: Ink; text: string }[] = [];
  for (const cell of row) {
    const ink = cell.ch === " " ? 0 : cell.ink;
    const last = runs[runs.length - 1];
    if (last?.ink === ink) last.text += cell.ch;
    else runs.push({ ink, text: cell.ch });
  }
  return runs;
}
