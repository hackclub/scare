import { redirect } from "next/navigation";
import "~/styles/shop.css";

import { CATALOG, SHELVES } from "~/lib/shop-catalog";
import { auth } from "~/server/auth";
import { getPlatformUser } from "~/server/user";
import { api, HydrateClient } from "~/trpc/server";
import { PageHead } from "../_components/page-head";
import { ShopFloor } from "./shop-floor";

export const metadata = { title: "Shop" };

export default async function Shop() {
  // Pages render alongside the layout, so its redirect can't be relied on here.
  const session = await auth();
  if (!session) redirect("/login");
  const user = await getPlatformUser(session.user.id);
  void api.shop.orders.prefetch();

  return (
    <HydrateClient>
      <PageHead title="Pumpkin Shop" lead="Trade your Pumpkins for games, grants and candy." />
      <ShopFloor shelves={SHELVES} items={CATALOG} balance={user?.pumpkins ?? 0} />
    </HydrateClient>
  );
}
