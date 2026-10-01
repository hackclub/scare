import { api, HydrateClient } from "~/trpc/server";
import { HackatimeNotice } from "../_components/hackatime-notice";
import { PageHead } from "../_components/page-head";
import { GameBoard } from "./game-board";

export const metadata = { title: "Projects" };

export default async function Projects({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; hackatime?: string }>;
}) {
  const { new: startNew, hackatime } = await searchParams;
  void api.game.mine.prefetch();
  // The board asks this before it asks Hackatime for projects; have it ready so they don't queue.
  void api.hackatime.status.prefetch();

  return (
    <HydrateClient>
      <PageHead
        title="Projects"
        lead="Make a horror game, create a project for it, and get Pumpkins for shipping."
      />
      <HackatimeNotice status={hackatime} />
      <GameBoard startAdding={startNew === "1" || hackatime === "linked"} />
    </HydrateClient>
  );
}
