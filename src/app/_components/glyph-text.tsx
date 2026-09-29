import { renderGlyphs, toRuns, type GlyphOptions } from "~/lib/glyphs";

const INK = ["g-shadow", "g-dim", "g-ink", "g-hot"] as const;

type Props = GlyphOptions & {
  text: string;
  /** Rendered as the accessible element. The glyphs themselves are hidden from assistive tech. */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Largest cell size in px; the art shrinks to fit its container below that. */
  max?: number;
  /** A coarser pixel scale for narrow screens, so letters stay letters when cells get tiny. */
  narrowScale?: number;
  className?: string;
  id?: string;
};

function Art({
  lines,
  opts,
  max,
  className,
}: {
  lines: string[];
  opts: GlyphOptions;
  max: number;
  className: string;
}) {
  const grids = lines.map((line) => renderGlyphs(line, opts));
  const cols = Math.max(...grids.map((g) => g[0]?.length ?? 0));
  return (
    <span
      aria-hidden="true"
      className={`glyph-art ${className}`}
      style={{ "--cols": cols, "--max": `${max}px` } as React.CSSProperties}
    >
      {grids.map((grid, li) => (
        <span key={li} className="glyph-block">
          {grid.map((row, ri) => (
            <span key={ri} className="glyph-row">
              {toRuns(row).map((run, i) => (
                <span key={i} className={INK[run.ink]}>
                  {run.text}
                </span>
              ))}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

export function GlyphText({
  text,
  as: Tag = "span",
  max = 14,
  narrowScale,
  className = "",
  id,
  ...opts
}: Props) {
  const lines = text.split("\n");
  const scale = opts.scale ?? 1;
  const hasNarrow = narrowScale !== undefined && narrowScale !== scale;

  return (
    <Tag id={id} className={`glyph-text ${className}`}>
      <span className="sr-only">{lines.join(" ")}</span>
      <Art
        lines={lines}
        opts={opts}
        max={max}
        className={hasNarrow ? "glyph-wide" : ""}
      />
      {hasNarrow && (
        <Art
          lines={lines}
          opts={{ ...opts, scale: narrowScale }}
          max={max * (scale / narrowScale)}
          className="glyph-narrow"
        />
      )}
    </Tag>
  );
}
