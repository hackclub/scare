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

export const Caret = (p: IconProps) => (
  <Pixels {...p} d="M1 3h2v2H1zM3 5h2v2H3zM5 7h2v2H5zM7 5h2v2H7zM9 3h2v2H9z" />
);

export const Plus = (p: IconProps) => <Pixels {...p} d="M5 2h2v8H5zM2 5h8v2H2z" />;


export const Skull = (p: IconProps) => (
  <Pixels
    {...p}
    d="M3 0h6v1H3zM1 1h10v1H1zM0 2h12v1H0zM0 3h2v3H0zM5 3h2v3H5zM10 3h2v3H10zM0 6h5v1H0zM7 6h5v1H7zM1 7h10v1H1zM2 8h8v1H2zM2 9h2v1H2zM5 9h2v1H5zM8 9h2v1H8zM3 10h6v1H3z"
  />
);

export const Check = (p: IconProps) => (
  <Pixels {...p} d="M1 6h2v2H1zM3 8h2v2H3zM5 6h2v2H5zM7 4h2v2H7zM9 2h2v2H9z" />
);

/** Scare's mark: a carved pumpkin on the same pixel grid, body in ink, stem a step dimmer. */
export function PumpkinMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 12"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M7 0h1v1H7zM6 1h2v1H6zM6 2h1v1H6z" fill="var(--ink-60)" />
      <path d="M3 3h8v1H3zM1 4h12v1H1zM0 5h14v1H0zM0 6h4v1H0zM5 6h4v1H5zM10 6h4v1H10zM0 7h3v1H0zM6 7h2v1H6zM11 7h3v1H11zM0 8h14v1H0zM0 9h3v1H0zM5 9h1v1H5zM8 9h1v1H8zM11 9h3v1H11zM1 10h3v1H1zM10 10h3v1H10zM3 11h8v1H3z" fill="currentColor" />
    </svg>
  );
}

/** The mark's silhouette, uncarved: solid body with two dim ribs. */
export function PumpkinPlain({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 12"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path d="M7 0h1v1H7zM6 1h2v1H6zM6 2h1v1H6z" fill="var(--ink-60)" />
      <path d="M3 3h8v1H3zM1 4h12v1H1zM0 5h14v5H0zM1 10h12v1H1zM3 11h8v1H3z" fill="currentColor" />
      <path d="M4 5h1v5H4zM9 5h1v5H9z" fill="var(--ink-60)" />
    </svg>
  );
}

/** Pixel speaker: sound waves when on, a small x when off. */
export function Speaker({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="1em"
      height="1em"
      className={className}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1 4h2v4H1zM3 3h1v6H3zM4 2h1v8H4z" />
      {on ? (
        <path d="M7 4h1v4H7zM9 2h1v8H9z" />
      ) : (
        <path d="M7 4h1v1H7zM10 4h1v1h-1zM8 5h2v2H8zM7 7h1v1H7zM10 7h1v1h-1z" />
      )}
    </svg>
  );
}

/** Pixel heart on a 7x6 grid. */
export function Heart({ className = "", title }: IconProps) {
  return (
    <svg
      viewBox="0 0 7 6"
      width="1em"
      height="1em"
      className={className}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d="M1 0h2v1H1zM4 0h2v1H4zM0 1h7v2H0zM1 3h5v1H1zM2 4h3v1H2zM3 5h1v1H3z" />
    </svg>
  );
}

export const Knife = (p: IconProps) => (
  <Pixels
    {...p}
    d="M1 9h2v2H1zM2 8h2v2H2zM4 6h2v2H4zM5 5h2v2H5zM6 4h2v2H6zM7 3h2v2H7zM8 2h2v2H8zM10 1h1v2h-1z"
  />
);

const EYE = "M4 3h4v1H4zM2 4h2v1H2zM8 4h2v1H8zM1 5h1v2H1zM10 5h1v2h-1zM5 5h2v2H5zM2 7h2v1H2zM8 7h2v1H8zM4 8h4v1H4z";

export const Eye = (p: IconProps) => <Pixels {...p} d={EYE} />;

export const EyeOff = (p: IconProps) => <Pixels {...p} d={`${EYE}M1 1h1v1H1zM2 2h1v1H2zM3 3h1v1H3zM4 4h1v1H4zM5 5h1v1H5zM6 6h1v1H6zM7 7h1v1H7zM8 8h1v1H8zM9 9h1v1H9zM10 10h1v1H10z`} />;

/* Shop shelves, on the same pixel grid. */
export const Controller = (p: IconProps) => (
  <Pixels
    {...p}
    d="M2 3h8v1H2zM1 4h1v5H1zM10 4h1v5h-1zM2 9h2v1H2zM8 9h2v1H8zM4 8h4v1H4zM3 5h1v3H3zM2 6h3v1H2zM8 5h1v1H8zM9 7h1v1H9z"
  />
);

export const WitchHat = (p: IconProps) => (
  <Pixels {...p} d="M7 1h2v1H7zM6 2h2v1H6zM5 3h2v2H5zM4 5h3v2H4zM3 7h5v1H3zM1 8h10v1H1zM2 9h8v1H2z" />
);

export const Candy = (p: IconProps) => (
  <Pixels
    {...p}
    d="M1 3h2v1H1zM1 8h2v1H1zM2 4h2v1H2zM2 7h2v1H2zM4 4h4v4H4zM8 4h2v1H8zM8 7h2v1H8zM9 3h2v1H9zM9 8h2v1H9zM3 5h1v2H3zM8 5h1v2H8z"
  />
);

export const Chip = (p: IconProps) => (
  <Pixels
    {...p}
    d="M3 3h6v1H3zM3 8h6v1H3zM3 4h1v4H3zM8 4h1v4H8zM5 5h2v2H5zM4 1h1v2H4zM7 1h1v2H7zM4 9h1v2H4zM7 9h1v2H7zM1 4h2v1H1zM1 7h2v1H1zM9 4h2v1H9zM9 7h2v1H9z"
  />
);

export const Mouse = (p: IconProps) => (
  <Pixels {...p} d="M5 0h1v1H5zM5 1h1v1H5zM3 2h5v1H3zM2 3h3v1H2zM6 3h3v1H6zM2 4h3v1H2zM6 4h3v1H6zM2 5h7v1H2zM2 6h7v1H2zM2 7h7v1H2zM2 8h7v1H2zM3 9h5v1H3z" />
);

export const Keyboard = (p: IconProps) => (
  <Pixels {...p} d="M0 3h12v1H0zM0 4h1v1H0zM11 4h1v1H11zM0 5h1v1H0zM2 5h1v1H2zM4 5h1v1H4zM7 5h1v1H7zM9 5h1v1H9zM11 5h1v1H11zM0 6h1v1H0zM11 6h1v1H11zM0 7h1v1H0zM2 7h1v1H2zM4 7h4v1H4zM9 7h1v1H9zM11 7h1v1H11zM0 8h1v1H0zM11 8h1v1H11zM0 9h12v1H0z" />
);

export const Macropad = (p: IconProps) => (
  <Pixels {...p} d="M1 1h10v1H1zM1 2h1v1H1zM10 2h1v1H10zM1 3h1v1H1zM3 3h2v1H3zM7 3h2v1H7zM10 3h1v1H10zM1 4h1v1H1zM3 4h2v1H3zM7 4h2v1H7zM10 4h1v1H10zM1 5h1v1H1zM10 5h1v1H10zM1 6h1v1H1zM3 6h2v1H3zM7 6h2v1H7zM10 6h1v1H10zM1 7h1v1H1zM3 7h2v1H3zM7 7h2v1H7zM10 7h1v1H10zM1 8h1v1H1zM10 8h1v1H10zM1 9h10v1H1z" />
);

export const Keychain = (p: IconProps) => (
  <Pixels {...p} d="M5 0h2v1H5zM4 1h1v1H4zM7 1h1v1H7zM4 2h1v1H4zM7 2h1v1H7zM5 3h2v1H5zM5 4h2v1H5zM2 5h8v1H2zM2 6h1v1H2zM9 6h1v1H9zM2 7h1v1H2zM4 7h4v1H4zM9 7h1v1H9zM2 8h1v1H2zM4 8h4v1H4zM9 8h1v1H9zM2 9h1v1H2zM9 9h1v1H9zM2 10h8v1H2z" />
);

export const Handheld = (p: IconProps) => (
  <Pixels {...p} d="M1 2h10v1H1zM0 3h1v1H0zM11 3h1v1H11zM0 4h1v1H0zM2 4h1v1H2zM4 4h4v1H4zM9 4h1v1H9zM11 4h1v1H11zM0 5h3v1H0zM4 5h4v1H4zM11 5h1v1H11zM0 6h1v1H0zM2 6h1v1H2zM4 6h4v1H4zM9 6h1v1H9zM11 6h1v1H11zM0 7h1v1H0zM11 7h1v1H11zM1 8h10v1H1z" />
);

export const Gadget = (p: IconProps) => (
  <Pixels {...p} d="M1 2h10v1H1zM0 3h1v1H0zM11 3h1v1H11zM0 4h1v1H0zM2 4h4v1H2zM8 4h1v1H8zM11 4h1v1H11zM0 5h1v1H0zM2 5h4v1H2zM7 5h3v1H7zM11 5h1v1H11zM0 6h1v1H0zM2 6h4v1H2zM8 6h1v1H8zM11 6h1v1H11zM0 7h1v1H0zM11 7h1v1H11zM1 8h10v1H1z" />
);

export const Laptop = (p: IconProps) => (
  <Pixels {...p} d="M2 1h8v1H2zM2 2h1v1H2zM9 2h1v1H9zM2 3h1v1H2zM9 3h1v1H9zM2 4h1v1H2zM9 4h1v1H9zM2 5h1v1H2zM9 5h1v1H9zM2 6h8v1H2zM0 7h12v1H0zM1 8h10v1H1z" />
);

export const Duck = (p: IconProps) => (
  <Pixels {...p} d="M3 1h4v1H3zM2 2h2v1H2zM5 2h3v1H5zM0 3h8v1H0zM2 4h5v1H2zM1 5h7v1H1zM9 5h2v1H9zM1 6h10v1H1zM1 7h10v1H1zM2 8h8v1H2zM3 9h6v1H3z" />
);

export const Shark = (p: IconProps) => (
  <Pixels {...p} d="M6 1h1v1H6zM5 2h2v1H5zM2 3h7v1H2zM11 3h1v1H11zM1 4h9v1H1zM11 4h1v1H11zM0 5h1v1H0zM2 5h10v1H2zM0 6h12v1H0zM1 7h9v1H1zM11 7h1v1H11zM3 8h1v1H3zM6 8h2v1H6zM11 8h1v1H11z" />
);


export const Dice = (p: IconProps) => (
  <Pixels {...p} d="M1 1h10v1H1zM1 2h1v1H1zM10 2h1v1H10zM1 3h1v1H1zM3 3h2v1H3zM7 3h2v1H7zM10 3h1v1H10zM1 4h1v1H1zM3 4h2v1H3zM7 4h2v1H7zM10 4h1v1H10zM1 5h1v1H1zM5 5h2v1H5zM10 5h1v1H10zM1 6h1v1H1zM5 6h2v1H5zM10 6h1v1H10zM1 7h1v1H1zM3 7h2v1H3zM7 7h2v1H7zM10 7h1v1H10zM1 8h1v1H1zM3 8h2v1H3zM7 8h2v1H7zM10 8h1v1H10zM1 9h1v1H1zM10 9h1v1H10zM1 10h10v1H1z" />
);
