import { pumpkinsFor } from "~/lib/program";

/**
 * The Pumpkin Shop catalog. Prices are computed from `usd` (what the item costs the program)
 * at the program rate, so changing a dollar amount reprices the item.
 *
 * Shelves and items are listed most popular first, which is the order the shop shows them in.
 * Featured is the exception: it sorts its picks by price, as a ladder.
 *
 * Every item marked `sample: true` is a placeholder: replace it with the real catalog.
 */

export type Shelf = "steam" | "gear" | "friends" | "candy" | "costume" | "hardware";

export const SHELVES: { id: Shelf; name: string; blurb: string }[] = [
  { id: "steam", name: "Steam games", blurb: "A grant toward games on Steam." },
  { id: "gear", name: "Gear", blurb: "Desk gear and gadgets, shipped to you." },
  { id: "candy", name: "Candy", blurb: "Candy, shipped to you." },
  { id: "friends", name: "Desk friends", blurb: "Ducks and sharks to talk your bugs through with." },
  { id: "costume", name: "Costume grants", blurb: "Money toward a Halloween costume." },
  { id: "hardware", name: "Hardware grants", blurb: "Money toward hardware for your projects." },
];

/** Pixel icons an item can use instead of its shelf's. */
export type ItemIcon =
  | "mouse"
  | "keyboard"
  | "macropad"
  | "keychain"
  | "handheld"
  | "gadget"
  | "laptop"
  | "duck"
  | "shark";

export interface ShopItem {
  id: string;
  shelf: Shelf;
  name: string;
  description?: string;
  /** What the item costs the program, in US dollars. */
  usd: number;
  /** What the buyer has to tell us to fulfil it. Null when nothing is needed. */
  ask: { label: string; placeholder: string; missing: string; url?: boolean } | null;
  /** Variants to choose between. The choice is stored as the order's details. */
  pick?: { label: string; options: string[] };
  /** Physical: shipped to the address on the buyer's Hack Club account. */
  ships?: boolean;
  icon?: ItemIcon;
  /** Shown on the Featured tab, the shop's front page. */
  featured?: boolean;
  sample?: boolean;
  /** Expensive enough that we send money toward it instead of buying it. Set from `usd`. */
  grant?: boolean;
}

/** Items at or above this price arrive as a grant rather than the item itself. */
export const GRANT_FROM_USD = 200;

const COSTUME_PICK = { label: "Where you'll shop", options: ["Spirit Halloween", "Amazon", "General costume grant"] };

const ITEMS: Omit<ShopItem, "sample" | "grant">[] = [
  {
    id: "steam-10",
    shelf: "steam",
    name: "$10 Steam grant",
    description: "$10 toward any game on Steam.",
    usd: 10,
    ask: null,
  },
  {
    id: "steam-20",
    featured: true,
    shelf: "steam",
    name: "$20 Steam grant",
    description: "$20 toward any game on Steam.",
    usd: 20,
    ask: null,
  },
  {
    id: "steam-40",
    shelf: "steam",
    name: "$40 Steam grant",
    description: "$40 toward any game on Steam.",
    usd: 40,
    ask: null,
  },
  {
    id: "steam-developer",
    featured: true,
    shelf: "steam",
    name: "Steam developer grant",
    description: "Covers the $100 Steam Direct fee to put your own game on Steam.",
    usd: 100,
    ask: {
      label: "Your game",
      placeholder: "https://github.com/you/your-game",
      missing: "Link the game you'll put on Steam.",
      url: true,
    },
  },
  {
    id: "gear-switch-lite",
    featured: true,
    shelf: "gear",
    name: "Nintendo Switch Lite",
    description: "A turquoise handheld for playing other people's games after you ship yours.",
    usd: 200,
    ask: null,
    ships: true,
    icon: "handheld",
  },
  {
    id: "gear-rog-xbox-ally-x",
    featured: true,
    shelf: "gear",
    name: "ROG Xbox Ally X",
    description: "A handheld gaming PC that plays your Steam and Xbox library anywhere.",
    usd: 1000,
    ask: null,
    ships: true,
    icon: "handheld",
  },
  {
    id: "gear-mouse",
    shelf: "gear",
    name: "Gaming mouse",
    description: "An RGB gaming mouse, or $30 toward one you like better.",
    usd: 30,
    ask: null,
    pick: { label: "Which one", options: ["Logitech G502", "Redragon M612 Predator", "$30 mouse grant"] },
    ships: true,
    icon: "mouse",
  },
  {
    id: "gear-keyboard",
    shelf: "gear",
    name: "RGB keyboard",
    description: "A quiet RGB keyboard that works over Bluetooth, 2.4 GHz or a cable.",
    usd: 30,
    ask: null,
    pick: { label: "Which one", options: ["ONIKUMA tri-mode keyboard", "$30 keyboard grant"] },
    ships: true,
    icon: "keyboard",
  },
  {
    id: "gear-flipper",
    shelf: "gear",
    name: "Flipper Zero",
    description: "A pocket hacking multitool for hardware experiments.",
    usd: 200,
    ask: null,
    ships: true,
    icon: "gadget",
  },
  {
    id: "gear-macropad",
    shelf: "gear",
    name: "Four-key macropad",
    description: "Four clicky keys for shortcuts, builds and playtest restarts.",
    usd: 20,
    ask: null,
    ships: true,
    icon: "macropad",
  },
  {
    id: "gear-one-key",
    shelf: "gear",
    name: "One-key keychain",
    description: "A one-key macropad on a keychain. Bind it to anything.",
    usd: 10,
    ask: null,
    ships: true,
    icon: "keychain",
  },
  {
    id: "gear-chromebook",
    shelf: "gear",
    name: "Lenovo 300e Laptop",
    description: "An 11.6\" touchscreen 2-in-1 for building anywhere.",
    usd: 120,
    ask: null,
    ships: true,
    icon: "laptop",
  },
  {
    id: "candy-box",
    featured: true,
    shelf: "candy",
    name: "Candy box",
    description: "A box of assorted Halloween candy.",
    usd: 16,
    ask: null,
    ships: true,
  },
  {
    id: "blahaj-gigantic",
    featured: true,
    shelf: "friends",
    name: "Gigantic Blåhaj",
    description: "The 100 cm IKEA shark. Takes up most of a bed.",
    usd: 50,
    ask: null,
    ships: true,
    icon: "shark",
  },
  {
    id: "duck-small",
    featured: true,
    shelf: "friends",
    name: "Small rubber duck",
    description: "A rubber duck. Explain your bug to it.",
    usd: 4,
    ask: null,
    ships: true,
    icon: "duck",
  },
  {
    id: "duck-medium",
    shelf: "friends",
    name: "Medium rubber duck",
    description: "A medium rubber duck for medium bugs.",
    usd: 10,
    ask: null,
    ships: true,
    icon: "duck",
  },
  {
    id: "duck-gigantic",
    shelf: "friends",
    name: "Gigantic rubber duck",
    description: "A. Gigantic. Rubber. Duck.",
    usd: 40,
    ask: null,
    ships: true,
    icon: "duck",
  },
  {
    id: "duck-keychain",
    shelf: "friends",
    name: "Duckey keychain",
    description: "A duck keychain with a tiny keyboard. It quacks.",
    usd: 8,
    ask: null,
    ships: true,
    icon: "duck",
  },
  {
    id: "costume-30",
    shelf: "costume",
    name: "$30 costume grant",
    usd: 30,
    ask: null,
    pick: COSTUME_PICK,
  },
  {
    id: "costume-60",
    shelf: "costume",
    name: "$60 costume grant",
    usd: 60,
    ask: null,
    pick: COSTUME_PICK,
  },
  {
    id: "hardware-50",
    shelf: "hardware",
    name: "$50 hardware grant",
    description: "Toward a controller, keyboard, mic, or parts.",
    usd: 50,
    ask: {
      label: "What you'll get",
      placeholder: "A controller to playtest with",
      missing: "Tell us what you'll get with it.",
    },
  },
  {
    id: "hardware-100",
    shelf: "hardware",
    name: "$100 hardware grant",
    description: "For a bigger piece of kit.",
    usd: 100,
    ask: {
      label: "What you'll get",
      placeholder: "A used Steam Deck for testing",
      missing: "Tell us what you'll get with it.",
    },
  },
];

export const CATALOG: (ShopItem & { pumpkins: number })[] = ITEMS.map((i) => ({
  ...i,
  sample: true,
  grant: i.usd >= GRANT_FROM_USD,
  pumpkins: pumpkinsFor(i.usd),
}));

export const findItem = (id: string) => CATALOG.find((i) => i.id === id);
