"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  Plus,
  PumpkinPlain,
  Shark,
  WitchHat,
} from "~/app/_components/icons";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { type ItemIcon, type Shelf, type ShopItem } from "~/lib/shop-catalog";
import { api } from "~/trpc/react";

type Item = ShopItem & { pumpkins: number };

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

const iconFor = (item: Item) => (item.icon ? ITEM_ICON[item.icon] : SHELF_ICON[item.shelf]);

const hours = (p: number) =>
  (p / PUMPKINS_PER_HOUR).toLocaleString(undefined, { maximumFractionDigits: 1 });

const STATUS: Record<string, string> = {
  PENDING: "Pending",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

/** How close a balance is to a price, drawn in the glyph ramp: # for what you have, . for the rest. */
function Meter({ have, need, cells = 12 }: { have: number; need: number; cells?: number }) {
  const filled = need <= 0 ? cells : Math.min(cells, Math.round((have / need) * cells));
  return (
    <span className="sh-meter" aria-hidden="true">
      <span className="sh-meter-on">{"#".repeat(filled)}</span>
      <span className="sh-meter-off">{".".repeat(cells - filled)}</span>
    </span>
  );
}

export function ShopFloor({
  shelves,
  items,
  balance,
}: {
  shelves: { id: Shelf; name: string; blurb: string }[];
  items: Item[];
  balance: number;
}) {
  const [shelf, setShelf] = useState<Shelf | "all" | "featured">("featured");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justOrdered, setJustOrdered] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const panel = useRef<HTMLElement>(null);

  // Featured is a price ladder; everywhere else keeps the catalog's order, most popular first.
  const featured = useMemo(
    () => items.filter((i) => i.featured).sort((a, b) => a.pumpkins - b.pumpkins),
    [items],
  );
  const groups =
    shelf === "featured"
      ? [{ shelf: null, items: featured }]
      : shelves
          .filter((s) => shelf === "all" || s.id === shelf)
          .map((s) => ({ shelf: s, items: items.filter((i) => i.shelf === s.id) }))
          .filter((g) => g.items.length > 0);
  const selected = items.find((i) => i.id === selectedId) ?? null;
  const shelfName = (id: Shelf) => shelves.find((s) => s.id === id)?.name ?? "";

  // The cheapest thing still out of reach: the next thing to save for.
  const goal = useMemo(
    () => [...items].filter((i) => i.pumpkins > balance).sort((a, b) => a.pumpkins - b.pumpkins)[0] ?? null,
    [items, balance],
  );

  // On narrow screens the panel sits below the grid; bring it into view.
  const showPanel = () => {
    if (window.matchMedia("(max-width: 1000px)").matches) {
      requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const pick = (id: string) => {
    setJustOrdered(null);
    setSuggesting(false);
    setSelectedId(id);
    showPanel();
  };
  const suggest = () => {
    setJustOrdered(null);
    setSelectedId(null);
    setSuggesting(true);
    showPanel();
  };

  return (
    <div className="sh">
      <section className="sh-wallet" aria-label="Your Pumpkins">
        <div className="sh-wallet-balance">
          <PumpkinPlain className="sh-wallet-icon" />
          <p className="sh-wallet-num">{balance.toLocaleString()}</p>
          <p className="sh-wallet-label">
            Pumpkins
            <span>about {hours(balance)} hours of building</span>
          </p>
        </div>
        <div className="sh-wallet-goal">
          {goal ? (
            <>
              <p className="sh-wallet-goal-text">
                <strong>{goal.pumpkins - balance}</strong> more for {goal.name}
              </p>
              <Meter have={balance} need={goal.pumpkins} cells={20} />
            </>
          ) : (
            <p className="sh-wallet-goal-text">You can get anything in the shop.</p>
          )}
        </div>
        <p className="sh-wallet-rate">
          <span>Earn rate</span>
          {PUMPKINS_PER_HOUR} / hour
        </p>
      </section>

      <div className="sh-tabs" role="tablist" aria-label="Shelves">
        {[{ id: "featured" as const, name: "Featured" }, { id: "all" as const, name: "Everything" }, ...shelves].map((s) => {
          const count =
            s.id === "all"
              ? items.length
              : items.filter((i) => (s.id === "featured" ? i.featured : i.shelf === s.id)).length;
          const mixed = s.id === "all" || s.id === "featured";
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={shelf === s.id}
              className="sh-tab"
              data-shelf={s.id}
              onClick={() => setShelf(s.id)}
            >
              {!mixed && <span className="sh-tab-swatch" aria-hidden="true" />}
              {s.name}
              <span className="sh-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sh-body">
        <div className="sh-groups">
          {groups.map((g, gi) => (
            <section key={g.shelf?.id ?? "featured"} className="sh-group" aria-label={g.shelf?.name ?? "Featured"}>
              {/* Group headings only on Everything; a single shelf's tab already names it. */}
              {g.shelf && shelf === "all" && (
                <h2 className="sh-group-head" data-shelf={g.shelf.id}>
                  <span className="sh-tab-swatch" aria-hidden="true" />
                  {g.shelf.name}
                  <span className="sh-group-blurb">{g.shelf.blurb}</span>
                </h2>
              )}
              <ul className="sh-grid" data-view={shelf === "featured" ? "featured" : undefined}>
                {g.items.map((item) => (
                  <li key={item.id}>
                    <Tile
                      item={item}
                      balance={balance}
                      shelfLabel={shelf === "featured" ? shelfName(item.shelf) : null}
                      showDescription={shelf === "featured"}
                      selected={selectedId === item.id}
                      onPick={() => pick(item.id)}
                    />
                  </li>
                ))}
                {/* Last thing in the grid: whatever the shop doesn't have yet. */}
                {gi === groups.length - 1 && (
                  <li>
                    <button type="button" className="sh-tile sh-suggest-tile" aria-pressed={suggesting} onClick={suggest}>
                      <Plus className="sh-tile-icon" />
                      <span className="sh-tile-name">Suggest an item</span>
                      <span className="sh-suggest-hint">Something you&rsquo;d spend Pumpkins on that isn&rsquo;t here?</span>
                    </button>
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>

        <aside className="sh-side" ref={panel}>
          {suggesting ? (
            <Suggest onClose={() => setSuggesting(false)} />
          ) : (
          <Checkout
            item={selected}
            balance={balance}
            shelfName={selected ? shelfName(selected.shelf) : ""}
            justOrdered={justOrdered}
            onClose={() => setSelectedId(null)}
            onOrdered={(name) => {
              setSelectedId(null);
              setJustOrdered(name);
            }}
          />
          )}
          <Orders />
        </aside>
      </div>
    </div>
  );
}

function Tile({
  item,
  balance,
  shelfLabel,
  showDescription,
  selected,
  onPick,
}: {
  item: Item;
  balance: number;
  shelfLabel: string | null;
  showDescription: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const Icon = iconFor(item);
  const short = item.pumpkins - balance;
  return (
    <button type="button" className="sh-tile" data-shelf={item.shelf} aria-pressed={selected} onClick={onPick}>
      <span className="sh-tile-top">
        <Icon className="sh-tile-icon" />
        {shelfLabel && <span className="sh-tile-shelf">{shelfLabel}</span>}
      </span>
      <span className="sh-tile-name">{item.name}</span>
      {showDescription && item.description && <span className="sh-tile-desc">{item.description}</span>}
      <span className="sh-tile-price">
        <span className="sh-tile-cost">{item.pumpkins}</span>
        <span className="sh-tile-unit">
          Pumpkins <span className="sh-tile-hours">· {hours(item.pumpkins)} h</span>
        </span>
      </span>
      <span className="sh-tile-foot">
        <Meter have={balance} need={item.pumpkins} cells={10} />
        <span className={short > 0 ? "sh-tile-short" : "sh-tile-ok"}>
          {short > 0 ? `${short} to go` : "You can get this"}
        </span>
      </span>
    </button>
  );
}

function Checkout({
  item,
  balance,
  shelfName,
  justOrdered,
  onClose,
  onOrdered,
}: {
  item: Item | null;
  balance: number;
  shelfName: string;
  justOrdered: string | null;
  onClose: () => void;
  onOrdered: (name: string) => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [details, setDetails] = useState("");
  const buy = api.shop.buy.useMutation({
    onSuccess: async () => {
      await utils.shop.orders.invalidate();
      onOrdered(item?.name ?? "");
      router.refresh();
    },
  });

  // A new pick starts clean, on its first variant if it has any.
  useEffect(() => {
    setDetails(item?.pick?.options[0] ?? "");
    buy.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return (
      <section className="frame sh-checkout" aria-live="polite">
        <div className="frame-head">
          <span>{justOrdered ? "Ordered" : "Pick something"}</span>
        </div>
        <p className="sh-checkout-empty">
          {justOrdered
            ? `${justOrdered} is on its way to the queue. You'll see it under Your orders, and you can cancel it while it's pending.`
            : "Choose an item to see what it costs and what we need to send it."}
        </p>
      </section>
    );
  }

  const short = item.pumpkins - balance;
  const fieldId = `ask-${item.id}`;

  return (
    <section className="frame sh-checkout" data-shelf={item.shelf} aria-labelledby="checkout-title">
      <div className="frame-head">
        <span className="sh-checkout-shelf">{shelfName}</span>
        <button type="button" className="link link-quiet sh-close" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="sh-checkout-body">
        <h2 id="checkout-title" className="sh-checkout-name">
          {item.name}
        </h2>
        {item.description && <p className="sh-checkout-desc">{item.description}</p>}
        <p className="sh-checkout-price">
          <span className="sh-tile-cost">{item.pumpkins}</span>
          <span className="sh-tile-unit">Pumpkins · about {hours(item.pumpkins)} hours</span>
        </p>
        <div className="sh-checkout-meter">
          <Meter have={balance} need={item.pumpkins} cells={20} />
          <span className="sr-only">
            You have {balance} of {item.pumpkins} Pumpkins.
          </span>
        </div>

        {short > 0 ? (
          <div className="sh-checkout-short">
            <p>
              You need <strong>{short} more</strong> Pumpkins, about {hours(short)} more hours of building.
            </p>
            <Link href="/platform/projects" className="btn btn-ghost">
              Go to projects
            </Link>
          </div>
        ) : (
          <form
            className="sh-checkout-form"
            onSubmit={(e) => {
              e.preventDefault();
              buy.mutate({ itemId: item.id, details: details || undefined });
            }}
            noValidate
          >
            {item.pick && (
              <fieldset className="sh-pick">
                <legend className="field-label">{item.pick.label}</legend>
                {item.pick.options.map((o) => (
                  <label key={o} className="sh-pick-option">
                    <input
                      type="radio"
                      name={`pick-${item.id}`}
                      value={o}
                      checked={details === o}
                      onChange={() => setDetails(o)}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              </fieldset>
            )}
            {item.ask && (
              <div className="field">
                <label htmlFor={fieldId} className="field-label">
                  {item.ask.label}
                </label>
                <input
                  id={fieldId}
                  className="input"
                  type={item.ask.url ? "url" : "text"}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={item.ask.placeholder}
                  maxLength={500}
                />
              </div>
            )}
            {buy.error && (
              <p className="form-error" role="alert">
                {buy.error.message}
              </p>
            )}
            <button type="submit" className="btn btn-primary sh-spend" disabled={buy.isPending}>
              <span>{buy.isPending ? "Ordering…" : `Spend ${item.pumpkins} Pumpkins`}</span>
            </button>
            <p className="sh-checkout-fine">
              {item.ships && "Ships to the address on your Hack Club account. "}
              That leaves you {balance - item.pumpkins}. You can cancel while it&rsquo;s pending.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

const SUGGESTION_STATUS: Record<string, string> = {
  NEW: "Waiting",
  ADDED: "Added",
  DECLINED: "Not this time",
};

function Suggest({ onClose }: { onClose: () => void }) {
  const utils = api.useUtils();
  const mine = api.shop.suggestions.useQuery();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [why, setWhy] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const send = api.shop.suggest.useMutation({
    onSuccess: async (s) => {
      setSent(s.name);
      setName("");
      setLink("");
      setWhy("");
      await utils.shop.suggestions.invalidate();
    },
  });

  return (
    <section className="frame sh-checkout" aria-labelledby="suggest-title">
      <div className="frame-head">
        <span>Suggestions</span>
        <button type="button" className="link link-quiet sh-close" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="sh-checkout-body">
        <h2 id="suggest-title" className="sh-checkout-name">
          Suggest an item
        </h2>
        <p className="sh-checkout-desc">Tell us what the shop is missing. We read all of them.</p>
        <form
          className="sh-checkout-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(null);
            send.mutate({ name, link: link || undefined, why: why || undefined });
          }}
          noValidate
        >
          <div className="field">
            <label htmlFor="suggest-name" className="field-label">
              What is it
            </label>
            <input
              id="suggest-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="A Steam Deck"
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="suggest-link" className="field-label">
              Link<span className="field-hint">optional</span>
            </label>
            <input
              id="suggest-link"
              className="input"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              maxLength={500}
            />
          </div>
          <div className="field">
            <label htmlFor="suggest-why" className="field-label">
              Why<span className="field-hint">optional</span>
            </label>
            <textarea
              id="suggest-why"
              className="input"
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="For playtesting on the couch"
              maxLength={300}
            />
          </div>
          {send.error && (
            <p className="form-error" role="alert">
              {Object.values(send.error.data?.zodError?.fieldErrors ?? {}).flat()[0] ?? send.error.message}
            </p>
          )}
          <button type="submit" className="btn btn-primary sh-spend" disabled={send.isPending || name.trim().length < 2}>
            <span>{send.isPending ? "Sending…" : "Send suggestion"}</span>
          </button>
          <p className="sh-checkout-fine" aria-live="polite">
            {sent ? `Sent "${sent}". Thanks!` : "You'll see here whether it made it in."}
          </p>
        </form>
      </div>
      {mine.data && mine.data.length > 0 && (
        <ul className="sh-orders-list sh-suggestions">
          {mine.data.map((s) => (
            <li key={s.id} className="sh-order">
              <span className="sh-order-name">{s.name}</span>
              <span className="sh-order-meta">
                <span className={s.status === "ADDED" ? "sh-order-done" : undefined}>{SUGGESTION_STATUS[s.status]}</span>
              </span>
              {s.adminNote && <span className="sh-suggestion-note">{s.adminNote}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Orders() {
  const router = useRouter();
  const utils = api.useUtils();
  const [orders] = api.shop.orders.useSuspenseQuery();
  // The order being asked about. Cancelling refunds Pumpkins, so it takes a second click.
  const [confirming, setConfirming] = useState<string | null>(null);
  const cancel = api.shop.cancel.useMutation({
    onSuccess: async () => {
      setConfirming(null);
      await utils.shop.orders.invalidate();
      router.refresh();
    },
  });
  const ask = (id: string | null) => {
    cancel.reset();
    setConfirming(id);
  };

  if (orders.length === 0) return null;

  return (
    <section className="frame sh-orders" aria-labelledby="orders-title">
      <div className="frame-head">
        <span id="orders-title">Your orders</span>
        <span>{orders.length}</span>
      </div>
      <ul className="sh-orders-list">
        {orders.map((o) => (
          <li key={o.id} className="sh-order">
            <span className="sh-order-name">{o.itemName}</span>
            <span className="sh-order-meta">
              {o.pumpkins} P ·{" "}
              <span className={o.status === "FULFILLED" ? "sh-order-done" : undefined}>{STATUS[o.status]}</span>
            </span>
            {o.status === "PENDING" &&
              (confirming === o.id ? (
                <div className="pf-confirm sh-order-confirm" role="group" aria-label={`Confirm cancelling ${o.itemName}`}>
                  <p className="pf-confirm-text">
                    Cancel this order? You&rsquo;ll get {o.pumpkins} Pumpkins back.
                  </p>
                  <div className="pf-confirm-actions">
                    <button
                      type="button"
                      className="btn btn-ghost pf-confirm-yes"
                      onClick={() => cancel.mutate({ id: o.id })}
                      disabled={cancel.isPending}
                    >
                      {cancel.isPending ? "Cancelling…" : "Yes, cancel it"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => ask(null)}
                      disabled={cancel.isPending}
                      autoFocus
                    >
                      Keep it
                    </button>
                  </div>
                  {cancel.error && (
                    <p className="form-error" role="alert">
                      {cancel.error.message}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="link link-quiet sh-order-cancel"
                  onClick={() => ask(o.id)}
                  disabled={cancel.isPending}
                >
                  Cancel
                </button>
              ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
