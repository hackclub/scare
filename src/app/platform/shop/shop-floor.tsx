"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PumpkinPlain } from "~/app/_components/icons";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { type Shelf, type ShopItem } from "~/lib/shop-catalog";
import { api } from "~/trpc/react";

type Item = ShopItem & { pumpkins: number };

const hours = (p: number) =>
  `${(p / PUMPKINS_PER_HOUR).toLocaleString(undefined, { maximumFractionDigits: 1 })} h`;

const STATUS: Record<string, string> = {
  PENDING: "Pending",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export function ShopFloor({
  shelves,
  items,
  balance,
}: {
  shelves: { id: Shelf; name: string; blurb: string }[];
  items: Item[];
  balance: number;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="pf-shop-main">
      {shelves.map((shelf) => (
        <section key={shelf.id} className="frame" aria-labelledby={`shelf-${shelf.id}`}>
          <div className="frame-head">
            <span id={`shelf-${shelf.id}`}>{shelf.name}</span>
            <span>{shelf.blurb}</span>
          </div>
          <ul className="pf-items">
            {items
              .filter((i) => i.shelf === shelf.id)
              .map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  balance={balance}
                  open={open === item.id}
                  onOpen={() => setOpen(item.id)}
                  onClose={() => setOpen(null)}
                />
              ))}
          </ul>
        </section>
      ))}
      <Orders />
    </div>
  );
}

function ItemRow({
  item,
  balance,
  open,
  onOpen,
  onClose,
}: {
  item: Item;
  balance: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [details, setDetails] = useState("");
  const buy = api.shop.buy.useMutation({
    onSuccess: async () => {
      await utils.shop.orders.invalidate();
      setDetails("");
      onClose();
      router.refresh();
    },
  });
  const short = item.pumpkins - balance;
  const fieldId = `ask-${item.id}`;

  return (
    <li className={`pf-item ${open ? "pf-item-open" : ""}`}>
      <div className="pf-item-main">
        <p className="pf-item-name">
          {item.name}
          {item.sample && <span className="pf-sample">sample</span>}
        </p>
        <p className="pf-item-desc">{item.description}</p>
      </div>
      <p className="pf-price">
        <PumpkinPlain className="pf-price-icon" />
        <span className="pf-price-value">{item.pumpkins}</span>
        <span className="pf-price-hours">{hours(item.pumpkins)}</span>
      </p>
      {!open &&
        (short > 0 ? (
          <button type="button" className="btn btn-ghost pf-item-btn" disabled>
            Need {short} more
          </button>
        ) : (
          <button type="button" className="btn btn-primary pf-item-btn" onClick={onOpen}>
            Get it
          </button>
        ))}

      {open && (
        <form
          className="pf-buy"
          onSubmit={(e) => {
            e.preventDefault();
            buy.mutate({ itemId: item.id, details: details || undefined });
          }}
          noValidate
        >
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
                autoFocus
              />
            </div>
          )}
          {buy.error && (
            <p className="form-error" role="alert">
              {buy.error.message}
            </p>
          )}
          <p className="pf-buy-note">
            This holds {item.pumpkins} Pumpkins until your order is fulfilled. You can cancel while it&rsquo;s
            pending.
          </p>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={buy.isPending}>
              <span>{buy.isPending ? "Ordering…" : `Spend ${item.pumpkins} Pumpkins`}</span>
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}

function Orders() {
  const router = useRouter();
  const utils = api.useUtils();
  const [orders] = api.shop.orders.useSuspenseQuery();
  const cancel = api.shop.cancel.useMutation({
    onSuccess: async () => {
      await utils.shop.orders.invalidate();
      router.refresh();
    },
  });

  return (
    <section className="frame" aria-labelledby="orders-title">
      <div className="frame-head">
        <span id="orders-title">Your orders</span>
        <span>{orders.length}</span>
      </div>
      {orders.length === 0 ? (
        <p className="pf-empty">No orders yet.</p>
      ) : (
        <ul className="pf-list">
          {orders.map((o) => (
            <li key={o.id} className="pf-list-row pf-order">
              <span className="pf-list-title">{o.itemName}</span>
              <span className="pf-list-meta">{o.pumpkins} Pumpkins</span>
              <span className={`pf-state ${o.status === "FULFILLED" ? "pf-state-on" : ""}`}>
                <span className="status-dot" aria-hidden="true" />
                {STATUS[o.status]}
              </span>
              {o.status === "PENDING" && (
                <button
                  type="button"
                  className="link link-quiet pf-order-cancel"
                  onClick={() => cancel.mutate({ id: o.id })}
                  disabled={cancel.isPending}
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
