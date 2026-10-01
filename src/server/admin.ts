import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";

import { env } from "~/env";
import { type Prisma } from "../../generated/prisma";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { rateLimit } from "~/server/rate-limit";

/**
 * Admin access. The allowlist is ADMIN_IDENTITY_IDS: Hack Club identity IDs (ident!xxxx), which
 * come from Hack Club Auth at sign-in and can't be edited by the user. Empty or unset means no
 * admins at all. Everything admin goes through requireAdmin(), on the server, every time.
 */
const ADMIN_IDS = new Set(
  (env.ADMIN_IDENTITY_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^ident![A-Za-z0-9_-]+$/.test(s)),
);

export const isAdminIdentity = (identity: string | null | undefined) =>
  Boolean(identity && ADMIN_IDS.has(identity));

export interface Admin {
  userId: string;
  identity: string;
  name: string | null;
}

/** The signed-in admin, or null. Reads the identity from the database, not the session cookie. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  if (ADMIN_IDS.size === 0) return null;
  const session = await auth();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, hcIdentityId: true, name: true },
  });
  if (!user || !isAdminIdentity(user.hcIdentityId)) return null;
  return { userId: user.id, identity: user.hcIdentityId!, name: user.name };
});

/**
 * Gate for admin pages and server actions. Anyone else gets a plain 404, so the dashboard
 * doesn't advertise that it exists.
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}

/**
 * For server actions: the gate plus a rate limit, so a stuck button or a script can't hammer
 * it. Over the limit returns null and the action reports it instead of running.
 */
export async function requireAdminAction(): Promise<Admin | null> {
  const admin = await requireAdmin();
  return rateLimit(`admin:${admin.userId}`, 60, 60_000).ok ? admin : null;
}

/** Record an admin action. Pass the transaction client so the log and the change commit together. */
export function audit(
  tx: Prisma.TransactionClient,
  admin: Admin,
  action: string,
  target: { type: string; id: string },
  detail?: Prisma.InputJsonValue,
) {
  return tx.adminAudit.create({
    data: {
      actorUserId: admin.userId,
      actorIdentity: admin.identity,
      action,
      targetType: target.type,
      targetId: target.id,
      detail,
    },
  });
}
