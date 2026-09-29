/** Hand-set ASCII pictures. Decorative: the words next to them carry the meaning. */
const ART = {
  make: String.raw`
 .-------------.
 |   .-"""-.   |
 |  /  o o  \  |
 |  |   O   |  |
 |  |/\/\/\/|  |
 '-------------'
     __|___|__   `,
  ship: String.raw`
      _______
     /   +   \
    /    |    \
   |   --+--   |
   |     |     |
    \    |    /
     \_______/   `,
  earn: String.raw`
        ,}
   .-'''|'''-.
  /  /\   /\  \
 |      ^      |
  \  \/\/\/\/ /
   '-._____.-'   `,
  spend: String.raw`
    ___________
   /  _     o  \
  | _| |_  o  o |
  ||_   _|  o   |
  |  |_|        |
   \___/'''\___/  `,
  shop: String.raw`
   _______________________
  |  ___________________  |
  | |  THE PUMPKIN SHOP | |
  | |___________________| |
  |   /\/\/\/\/\/\/\/\/   |
  |  |  .-----------.  |  |
  |  |  |  CLOSED   |  |  |
  |  |  |    ---    |  |  |
  |  |  |  OPENS    |  |  |
  |  |  |  LATER    |  |  |
  |  |  '-----------'  |  |
  |  |    ||     ||    |  |
  |__|____||_____||____|__|`,
  tomb: String.raw`
      _.---._
    .'       '.
    |  R.I.P  |
    |         |
    |  (none  |
    |   yet)  |
  __|_________|__`,
} as const;

export type ArtName = keyof typeof ART;

export function Ascii({ name, className = "" }: { name: ArtName; className?: string }) {
  return (
    <pre aria-hidden="true" className={`ascii ${className}`}>
      {ART[name].replace(/^\n/, "")}
    </pre>
  );
}
