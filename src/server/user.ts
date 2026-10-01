import "server-only";

import { cache } from "react";

import { db } from "~/server/db";

/**
 * The signed-in participant's own row, as the platform shows it. Cached per request, so the
 * layout and the page share one query instead of each reading the same row.
 */
export const getPlatformUser = cache((id: string) =>
  db.user.findUnique({
    where: { id },
    select: { name: true, pumpkins: true, onboardedAt: true, verificationStatus: true },
  }),
);
