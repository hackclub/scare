import "~/styles/welcome.css";

import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { SilenceAmbience } from "~/app/_components/silence-ambience";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { hackatimeConfigured } from "~/server/hackatime";
import { CarvingTable } from "./carving-table";

export const metadata: Metadata = { title: "Welcome — Scare" };
export const dynamic = "force-dynamic";

/** Same person, same lantern: the face is seeded from who they are. */
function seedFrom(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return 1000 + ((h >>> 0) % 9000);
}

export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ hackatime?: string; step?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/welcome");
  const { hackatime } = await searchParams;

  const [user, link, firstGame] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, hcIdentityId: true },
    }),
    db.hackatimeLink.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    db.game.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { title: true },
    }),
  ]);

  return (
    <>
      <SilenceAmbience />
      <CarvingTable
        seed={seedFrom(user?.hcIdentityId ?? session.user.id)}
        hackatime={{ configured: hackatimeConfigured, linked: Boolean(link) }}
        firstGame={firstGame?.title ?? null}
        returnStatus={hackatime ?? null}
      />
    </>
  );
}
