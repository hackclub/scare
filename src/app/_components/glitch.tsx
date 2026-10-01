/**
 * A word that holds still, then tears for a split second every few beats: two offset
 * copies flash through thin slices in blood and ink. The real text never moves far,
 * so it stays readable. The copies are hidden from screen readers.
 */
export function Glitch({ children }: { children: string }) {
  return (
    <span className="glitch">
      <span className="glitch-word">{children}</span>
      <span className="glitch-slice glitch-a" aria-hidden="true">
        {children}
      </span>
      <span className="glitch-slice glitch-b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
