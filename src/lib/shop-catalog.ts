import { pumpkinsFor } from "~/lib/program";

/**
 * The Pumpkin Shop catalog. Prices are computed from `usd` (what the item costs the program)
 * at the program rate, so changing a dollar amount reprices the item.
 *
 * Every item marked `sample: true` is a placeholder: replace it with the real catalog.
 */

export type Shelf = "steam" | "costume" | "candy" | "hardware";

export const SHELVES: { id: Shelf; name: string; blurb: string }[] = [
  { id: "steam", name: "Steam games", blurb: "Pick a game on Steam; we buy it for you." },
  { id: "costume", name: "Costume grants", blurb: "Money toward a Halloween costume." },
  { id: "candy", name: "Candy", blurb: "Candy, shipped to you." },
  { id: "hardware", name: "Hardware grants", blurb: "Money toward hardware for your projects." },
];

export interface ShopItem {
  id: string;
  shelf: Shelf;
  name: string;
  description: string;
  /** What the item costs the program, in US dollars. */
  usd: number;
  /** What the buyer has to tell us to fulfil it. Null when nothing is needed. */
  ask: { label: string; placeholder: string; missing: string; url?: boolean } | null;
  sample?: boolean;
}

const ITEMS: Omit<ShopItem, "sample">[] = [
  {
    id: "steam-10",
    shelf: "steam",
    name: "Steam game, up to $10",
    description: "Any game on Steam priced at $10 or less.",
    usd: 10,
    ask: {
      label: "Steam store link",
      placeholder: "https://store.steampowered.com/app/…",
      missing: "Paste the Steam store link for the game you want.",
      url: true,
    },
  },
  {
    id: "steam-20",
    shelf: "steam",
    name: "Steam game, up to $20",
    description: "Any game on Steam priced at $20 or less.",
    usd: 20,
    ask: {
      label: "Steam store link",
      placeholder: "https://store.steampowered.com/app/…",
      missing: "Paste the Steam store link for the game you want.",
      url: true,
    },
  },
  {
    id: "steam-40",
    shelf: "steam",
    name: "Steam game, up to $40",
    description: "Any game on Steam priced at $40 or less.",
    usd: 40,
    ask: {
      label: "Steam store link",
      placeholder: "https://store.steampowered.com/app/…",
      missing: "Paste the Steam store link for the game you want.",
      url: true,
    },
  },
  {
    id: "costume-30",
    shelf: "costume",
    name: "$30 costume grant",
    description: "Toward a costume, makeup or props.",
    usd: 30,
    ask: {
      label: "What you're dressing up as",
      placeholder: "A very tired vampire",
      missing: "Tell us what you're dressing up as.",
    },
  },
  {
    id: "costume-60",
    shelf: "costume",
    name: "$60 costume grant",
    description: "For the costume that needs a little more.",
    usd: 60,
    ask: {
      label: "What you're dressing up as",
      placeholder: "The thing in the vents",
      missing: "Tell us what you're dressing up as.",
    },
  },
  {
    id: "candy-box",
    shelf: "candy",
    name: "Candy box",
    description: "A box of assorted Halloween candy.",
    usd: 16,
    ask: null,
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
  pumpkins: pumpkinsFor(i.usd),
}));

export const findItem = (id: string) => CATALOG.find((i) => i.id === id);
