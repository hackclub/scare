import Link from "next/link";

import { ArrowRight } from "~/app/_components/icons";
import { Drift } from "~/app/_components/shop-drift";
import { iconFor } from "~/app/_components/shop-icons";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { CATALOG, SHELVES } from "~/lib/shop-catalog";
import { PHOTOS, photoFor } from "~/lib/shop-images";

/** One item from each shelf in turn, so neighbouring tiles never share a colour. */
function interleaved() {
  const queues = SHELVES.map((s) => CATALOG.filter((i) => i.shelf === s.id));
  const out: typeof CATALOG = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

const hours = (p: number) => (p / PUMPKINS_PER_HOUR).toLocaleString("en-US", { maximumFractionDigits: 1 });

/**
 * The landing page's window into the Pumpkin Shop: every item, drifting past on a loop.
 * Scroll, swipe or drag it; it pauses on hover and while you're moving it, and never drifts
 * for reduced motion.
 */
export function ShopPreview() {
  const items = interleaved();
  const tiles = (copy: boolean) =>
    items.map((item) => {
      const Icon = iconFor(item);
      const shelf = SHELVES.find((s) => s.id === item.shelf)?.name;
      const photo = photoFor(item.id);
      return (
        <li key={`${copy ? "b" : "a"}-${item.id}`} className="sp-tile" data-shelf={item.shelf} aria-hidden={copy || undefined}>
          {photo && (
            // Plain img: these are small, already sized, and served from /public.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.src}
              alt=""
              className="sp-photo"
              data-fit={photo.contain ? "contain" : undefined}
              width={480}
              height={300}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          )}
          <span className="sp-top">
            <Icon className="sp-icon" />
            <span className="sp-shelf">{shelf}</span>
          </span>
          <span className="sp-name">{item.name}</span>
          <span className="sp-price">
            <span className="sp-cost">{item.pumpkins}</span>
            <span className="sp-unit">Pumpkins · {hours(item.pumpkins)} h</span>
          </span>
        </li>
      );
    });

  return (
    <div className="frame sp">
      <div className="frame-head">
        <span>Pumpkin Shop</span>
        <span>{CATALOG.length} items</span>
      </div>
      <Drift label="Items in the Pumpkin Shop. Scroll or drag to look around.">
        <ul className="sp-track">
          {tiles(false)}
          {tiles(true)}
        </ul>
      </Drift>
      <div className="sp-foot">
        <div className="sp-foot-copy">
          <p className="sp-note">Don&rsquo;t see it? Suggest it from inside the shop.</p>
          <details className="sp-credits">
            <summary>Photo credits</summary>
            <ul>
              {Object.entries(PHOTOS).map(([key, p]) => (
                <li key={key}>
                  <a href={p.source} className="link link-quiet" target="_blank" rel="noreferrer">
                    {p.by}
                  </a>{" "}
                  · {p.license}
                </li>
              ))}
            </ul>
            <p>Photos from Wikimedia Commons, resized and cropped. Products shown as examples.</p>
          </details>
        </div>
        <Link href="/platform/shop" className="btn btn-ghost">
          <span>Open the shop</span>
          <ArrowRight className="btn-icon" />
        </Link>
      </div>
    </div>
  );
}
