/**
 * Photos for the shop's items, served from /public/shop. All are from Wikimedia Commons under the
 * licence listed, and the landing page's shop preview credits them.
 */

export interface Photo {
  by: string;
  license: string;
  source: string;
  /** Show the whole image instead of cropping it to the tile (logos). */
  contain?: boolean;
}

export const PHOTOS: Record<string, Photo> = {
  "blahaj": { by: "Rose Abrams", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:N%C3%A4rCon_2026_-_CakeJumper.jpg" },
  "candy": { by: "Silar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:020231024_180820_Halloween_candy.jpg" },
  "chromebook": { by: "EnbyPie08", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Lenovo_Chromebook_500e,_September_2023.jpg" },
  "costume-mask": { by: "Sharpshotefx", license: "CC BY 4.0", source: "https://commons.wikimedia.org/wiki/File:Zombie_Halloween_Mask.jpg" },
  "costume-rack": { by: "Silar", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:020171030_183011_Halloween_costumes_in_Poland.jpg" },
  "duck-gigantic": { by: "City of Toronto", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Giant_Rubber_Duck_Visits_Toronto_Harbour_(35721527285).jpg" },
  "duck-keychain": { by: "Weetjesman", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Rubber_duck_collection.jpg" },
  "duck-medium": { by: "Chenspec", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Yellow_rubber_duck_in_Rishon_Lezion,_August_2024_04.jpg" },
  "duck-small": { by: "Nanda93", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Rubber_duck_in_glass_bowl_crop.jpg" },
  "flipper": { by: "Turbospok", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Flipper_Zero.jpg" },
  "hardware": { by: "JrawX", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Arduino_Uno_board.jpg" },
  "keyboard": { by: "Jorge Franganillo", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Mars_Gaming-_MK6_gaming_keyboard.jpg" },
  "macropad": { by: "Sergiy Galyonkin", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Keyboard%27s_macro.jpg" },
  "mouse": { by: "Spiileer", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:G502_Hero.jpg" },
  "one-key": { by: "SparkFun Electronics", license: "CC BY 2.0", source: "https://commons.wikimedia.org/wiki/File:Cherry_MX_Keycap_-_R2_(Opaque_Black)_(47765572131).jpg" },
  "steam": { by: "Gianmaria Generoso", license: "CC BY 3.0", source: "https://commons.wikimedia.org/wiki/File:Steam_icon.png", contain: true },
  "switch": { by: "GerdeeX", license: "CC BY-SA 4.0", source: "https://commons.wikimedia.org/wiki/File:Nintendo_switch_lite_blue.jpg" },
};

/** Which photo each item uses. Tiers of the same grant share one. */
const ITEM_PHOTO: Record<string, keyof typeof PHOTOS> = {
  "steam-10": "steam",
  "steam-20": "steam",
  "steam-40": "steam",
  "gear-switch-lite": "switch",
  "gear-mouse": "mouse",
  "gear-keyboard": "keyboard",
  "gear-flipper": "flipper",
  "gear-macropad": "macropad",
  "gear-one-key": "one-key",
  "gear-chromebook": "chromebook",
  "candy-box": "candy",
  "blahaj-gigantic": "blahaj",
  "duck-small": "duck-small",
  "duck-medium": "duck-medium",
  "duck-gigantic": "duck-gigantic",
  "duck-keychain": "duck-keychain",
  "costume-30": "costume-mask",
  "costume-60": "costume-rack",
  "hardware-50": "hardware",
  "hardware-100": "hardware",
};

export function photoFor(itemId: string) {
  const key = ITEM_PHOTO[itemId];
  return key ? { src: `/shop/${key}.jpg`, ...PHOTOS[key]! } : null;
}
