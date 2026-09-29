/** Pixel-grid icons drawn on a 12x12 grid, one square stroke weight, to match the glyph type. */
type IconProps = { className?: string; title?: string };

function Pixels({ d, className, title }: IconProps & { d: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="1em"
      height="1em"
      className={className}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Pixels {...p} d="M1 5h7v2H1zM6 2h2v2H6zM8 4h2v4H8zM6 8h2v2H6z" />
);

export const ArrowDown = (p: IconProps) => (
  <Pixels {...p} d="M5 1h2v7H5zM2 6h2v2H2zM4 8h4v2H4zM8 6h2v2H8z" />
);

export const ArrowUpRight = (p: IconProps) => (
  <Pixels {...p} d="M4 2h6v2H4zM8 4h2v4H8zM6 4h2v2H6zM4 6h2v2H4zM2 8h2v2H2z" />
);

export const Plus = (p: IconProps) => <Pixels {...p} d="M5 2h2v8H5zM2 5h8v2H2z" />;


export const Check = (p: IconProps) => (
  <Pixels {...p} d="M1 6h2v2H1zM3 8h2v2H3zM5 6h2v2H5zM7 4h2v2H7zM9 2h2v2H9z" />
);
