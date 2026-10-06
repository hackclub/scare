import { Ari } from "@hackclub/ari";
import { type NextRequest } from "next/server";

import { env } from "~/env";
import { applyAriEvent } from "~/server/ari";
import { publicOrigin } from "~/server/origin";

/** Ari's review decisions. Signed with the outbound secret from Ari's program settings. */
export async function POST(req: NextRequest) {
  if (!env.ARI_WEBHOOK_SECRET) return new Response("Ari webhooks aren't configured.", { status: 503 });
  const origin = publicOrigin(req);
  const handle = Ari.webhooks.createHandler({
    secret: env.ARI_WEBHOOK_SECRET,
    async on_event(event, context) {
      await applyAriEvent(context.delivery_id, event, origin);
    },
  });
  return handle(req);
}
