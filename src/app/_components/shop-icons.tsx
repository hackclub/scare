import {
  Candy,
  Chip,
  Controller,
  Duck,
  Gadget,
  Handheld,
  Keyboard,
  Keychain,
  Laptop,
  Macropad,
  Mouse,
  Shark,
  WitchHat,
} from "~/app/_components/icons";
import { type ItemIcon, type Shelf, type ShopItem } from "~/lib/shop-catalog";

type Icon = (p: { className?: string }) => React.ReactElement;

const SHELF_ICON: Record<Shelf, Icon> = {
  steam: Controller,
  gear: Macropad,
  friends: Duck,
  candy: Candy,
  costume: WitchHat,
  hardware: Chip,
};

const ITEM_ICON: Record<ItemIcon, Icon> = {
  mouse: Mouse,
  keyboard: Keyboard,
  macropad: Macropad,
  keychain: Keychain,
  handheld: Handheld,
  gadget: Gadget,
  laptop: Laptop,
  duck: Duck,
  shark: Shark,
};

/** An item's own pixel icon, or its shelf's when it has none. */
export const iconFor = (item: Pick<ShopItem, "icon" | "shelf">) =>
  item.icon ? ITEM_ICON[item.icon] : SHELF_ICON[item.shelf];
