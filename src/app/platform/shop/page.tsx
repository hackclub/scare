import { Ascii } from "~/app/_components/ascii";
import { GlyphText } from "~/app/_components/glyph-text";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { CATALOG, SHELVES } from "~/lib/shop-catalog";
import { auth } from "~/server/auth";
import { getPlatformUser } from "~/server/user";
import { api, HydrateClient } from "~/trpc/server";
import { PageHead } from "../_components/page-head";
import { ShopFloor } from "./shop-floor";

export const metadata = { title: "Shop" };

export default async function Shop() {
  const session = (await auth())!;
  const user = await getPlatformUser(session.user.id);
  const balance = user?.pumpkins ?? 0;
  void api.shop.orders.prefetch();

  return (
    <HydrateClient>
      <PageHead
        title="Pumpkin Shop"
        lead={`Spend your Pumpkins on games, grants and candy. You earn ${PUMPKINS_PER_HOUR} Pumpkins for every hour you put into a game you ship.`}
      />

      <div className="pf-shop">
        <ShopFloor shelves={SHELVES} items={CATALOG} balance={balance} />

        <aside className="pf-shop-side">
          <section className="frame" aria-labelledby="wallet-title">
            <div className="frame-head">
              <span id="wallet-title">Your Pumpkins</span>
            </div>
            <div className="pf-balance">
              <GlyphText text={balance.toLocaleString()} bold scale={2} max={7} />
              <p className="pf-balance-label">Balance</p>
            </div>
            <dl className="ledger pf-ledger">
              <div>
                <dt>Earn rate</dt>
                <dd>{PUMPKINS_PER_HOUR} / hour</dd>
              </div>
              <div>
                <dt>Worth in hours</dt>
                <dd>{(balance / PUMPKINS_PER_HOUR).toLocaleString(undefined, { maximumFractionDigits: 1 })} h</dd>
              </div>
            </dl>
          </section>
          <figure className="pf-shop-art">
            <Ascii name="shop" />
          </figure>
        </aside>
      </div>
    </HydrateClient>
  );
}
