"use server";

import { redirect, RedirectType } from "next/navigation";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

/**
 * Finish (or skip) onboarding: mark it done and go to the dashboard in one round trip, so the
 * platform never sees a half-saved state and bounces back here. Replacing the history entry
 * means Back doesn't return to the carving table.
 */
export async function finishOnboarding() {
  const session = await auth();
  if (!session) redirect("/login");
  // Keep the first finish time when someone replays it from Profile.
  await db.user.updateMany({
    where: { id: session.user.id, onboardedAt: null },
    data: { onboardedAt: new Date() },
  });
  redirect("/platform", RedirectType.replace);
}
