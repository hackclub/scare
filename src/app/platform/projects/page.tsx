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

  return (
    <HydrateClient>
      <PageHead
        title="Projects"
        lead="Create a project for something you're working on and ship it easily."
      />
      <HackatimeNotice status={hackatime} />
      <GameBoard startAdding={startNew === "1" || hackatime === "linked"} />
    </HydrateClient>
  );
}
