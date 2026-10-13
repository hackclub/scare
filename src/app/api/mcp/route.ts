import { type NextRequest } from "next/server";
import { z } from "zod";

import { type Admin, adminFromMcpToken, mcpConfigured } from "~/server/admin";
import * as ops from "~/server/admin-ops";
import { db } from "~/server/db";
import { publicOrigin } from "~/server/origin";
import { rateLimit } from "~/server/rate-limit";

/**
 * Admin MCP server: the admin dashboard as tools, for driving it from Claude or any MCP client.
 * Stateless Streamable HTTP (plain JSON responses, no sessions). Auth is a bearer token from
 * ADMIN_MCP_TOKENS; writes go through ~/server/admin-ops, so they're audited as that admin
 * exactly like the dashboard. Anyone without a valid token gets a 404, like /admin.
 */

export const dynamic = "force-dynamic";

const PROTOCOL = "2025-06-18";

type Json = Record<string, unknown>;
interface Tool {
  description: string;
  inputSchema: Json;
  readOnly?: boolean;
  run: (admin: Admin, args: unknown, req: NextRequest) => Promise<unknown>;
}

const str = (description: string) => ({ type: "string", description });
const obj = (properties: Json, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });
const limit = z.coerce.number().int().min(1).max(200).default(50);

/** Validate with the same schema the dashboard uses, then run the op. */
const write =
  <T,>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, fn: (admin: Admin, input: T, req: NextRequest) => Promise<string>) =>
  (admin: Admin, args: unknown, req: NextRequest) => {
    const r = schema.safeParse(args ?? {});
    if (!r.success) throw new Error(r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    return fn(admin, r.data, req);
  };

const read =
  <T,>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, fn: (input: T) => Promise<unknown>) =>
  (_: Admin, args: unknown) =>
    fn(schema.parse(args ?? {}));

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  slackId: true,
  hcIdentityId: true,
  yswsEligible: true,
  verificationStatus: true,
  pumpkins: true,
  onboardedAt: true,
} as const;

const GAME_FIELDS = {
  id: true,
  title: true,
  pitch: true,
  engine: true,
  sourceUrl: true,
  playUrl: true,
  status: true,
  hackatimeProject: true,
  trackedSeconds: true,
  claimedSeconds: true,
  shippedAt: true,
  reviewStatus: true,
  reviewNote: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewHours: true,
  awardedPumpkins: true,
  airtableRecordId: true,
  airtableError: true,
  ariShipId: true,
  ariError: true,
  createdAt: true,
} as const;

const SHIP_VIEWS = {
  pending: { status: "SHIPPED" as const, OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" as const }] },
  approved: { reviewStatus: "APPROVED" as const },
  rejected: { reviewStatus: "REJECTED" as const },
  brewing: { status: "BREWING" as const },
};

const TOOLS: Record<string, Tool> = {
  /* -------------------------------------------------------- reads */
  overview: {
    description: "Headline numbers and what needs attention: pending ships, orders, suggestions, totals.",
    inputSchema: obj({}),
    readOnly: true,
    run: async () => {
      const [users, onboarded, linked, brewing, shipsPending, approved, rejected, ordersPending, suggestionsNew, held, awarded] =
        await Promise.all([
          db.user.count(),
          db.user.count({ where: { onboardedAt: { not: null } } }),
          db.hackatimeLink.count(),
          db.game.count({ where: SHIP_VIEWS.brewing }),
          db.game.count({ where: SHIP_VIEWS.pending }),
          db.game.count({ where: SHIP_VIEWS.approved }),
          db.game.count({ where: SHIP_VIEWS.rejected }),
          db.order.count({ where: { status: "PENDING" } }),
          db.suggestion.count({ where: { status: "NEW" } }),
          db.user.aggregate({ _sum: { pumpkins: true } }),
          db.game.aggregate({ _sum: { awardedPumpkins: true } }),
        ]);
      return {
        needsAttention: { shipsWaitingInAri: shipsPending, ordersPending, suggestionsNew },
        users: { total: users, onboarded, hackatimeLinked: linked },
        games: { brewing, approved, rejected },
        pumpkins: { awarded: awarded._sum.awardedPumpkins ?? 0, heldByUsers: held._sum.pumpkins ?? 0 },
      };
    },
  },

  search_users: {
    description: "Find users by name, email, Slack ID or Hack Club identity. Empty query lists everyone.",
    inputSchema: obj({ query: str("Search text"), limit: { type: "integer", minimum: 1, maximum: 200 } }),
    readOnly: true,
    run: read(z.object({ query: z.string().trim().max(100).default(""), limit }), ({ query: q, limit }) =>
      db.user.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { slackId: { contains: q, mode: "insensitive" } },
                { hcIdentityId: { contains: q } },
              ],
            }
          : undefined,
        orderBy: { name: "asc" },
        take: limit,
        select: { ...USER_FIELDS, _count: { select: { games: true, orders: true } } },
      }),
    ),
  },

  get_user: {
    description: "Everything about one user: profile, balance, games, orders, suggestions, and admin actions on them.",
    inputSchema: obj({ userId: str("User id") }, ["userId"]),
    readOnly: true,
    run: read(ops.schemas.userId, async ({ userId }) => {
      const [user, audit] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            ...USER_FIELDS,
            tourSeenAt: true,
            hackatime: { select: { hackatimeId: true, githubUsername: true, trustLevel: true } },
            games: { select: GAME_FIELDS, orderBy: { createdAt: "desc" } },
            orders: { orderBy: { createdAt: "desc" } },
            suggestions: { orderBy: { createdAt: "desc" } },
          },
        }),
        db.adminAudit.findMany({ where: { targetType: "user", targetId: userId }, orderBy: { createdAt: "desc" }, take: 50 }),
      ]);
      if (!user) throw new Error("No user with that id.");
      return { ...user, adminActions: audit };
    }),
  },

  list_orders: {
    description: "Shop orders by status. Pending ones come oldest first.",
    inputSchema: obj({
      status: { type: "string", enum: ["PENDING", "FULFILLED", "REJECTED", "CANCELLED"], description: "Default PENDING" },
      limit: { type: "integer", minimum: 1, maximum: 200 },
    }),
    readOnly: true,
    run: read(
      z.object({ status: z.enum(["PENDING", "FULFILLED", "REJECTED", "CANCELLED"]).default("PENDING"), limit }),
      ({ status, limit }) =>
        db.order.findMany({
          where: { status },
          orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
          take: limit,
          include: { user: { select: { id: true, name: true, slackId: true, pumpkins: true } } },
        }),
    ),
  },

  list_ships: {
    description: "Games by state: pending (shipped, waiting on Ari), approved, rejected, or brewing.",
    inputSchema: obj({
      view: { type: "string", enum: Object.keys(SHIP_VIEWS), description: "Default pending" },
      limit: { type: "integer", minimum: 1, maximum: 200 },
    }),
    readOnly: true,
    run: read(z.object({ view: z.enum(["pending", "approved", "rejected", "brewing"]).default("pending"), limit }), ({ view, limit }) =>
      db.game.findMany({
        where: SHIP_VIEWS[view],
        orderBy: view === "pending" ? { shippedAt: "asc" } : view === "brewing" ? { updatedAt: "desc" } : { reviewedAt: "desc" },
        take: limit,
        select: { ...GAME_FIELDS, user: { select: { id: true, name: true, slackId: true, yswsEligible: true } } },
      }),
    ),
  },

  get_game: {
    description: "One game in full, including Ari's review detail and its admin history.",
    inputSchema: obj({ gameId: str("Game id") }, ["gameId"]),
    readOnly: true,
    run: read(ops.schemas.gameId, async ({ gameId }) => {
      const [game, audit] = await Promise.all([
        db.game.findUnique({
          where: { id: gameId },
          select: { ...GAME_FIELDS, reviewDetail: true, user: { select: USER_FIELDS } },
        }),
        db.adminAudit.findMany({ where: { targetType: "game", targetId: gameId }, orderBy: { createdAt: "desc" }, take: 50 }),
      ]);
      if (!game) throw new Error("No game with that id.");
      return { ...game, adminActions: audit };
    }),
  },

  list_suggestions: {
    description: "Shop item suggestions by status. New ones come oldest first.",
    inputSchema: obj({
      status: { type: "string", enum: ["NEW", "ADDED", "DECLINED"], description: "Default NEW" },
      limit: { type: "integer", minimum: 1, maximum: 200 },
    }),
    readOnly: true,
    run: read(z.object({ status: z.enum(["NEW", "ADDED", "DECLINED"]).default("NEW"), limit }), ({ status, limit }) =>
      db.suggestion.findMany({
        where: { status },
        orderBy: { createdAt: status === "NEW" ? "asc" : "desc" },
        take: limit,
        include: { user: { select: { id: true, name: true, slackId: true } } },
      }),
    ),
  },

  audit_log: {
    description: "Recent admin actions, newest first. Filter by action (e.g. order.reject), target, or actor identity.",
    inputSchema: obj({
      action: str("Exact action name"),
      targetType: { type: "string", enum: ["user", "game", "order", "suggestion"] },
      targetId: str("Target id"),
      actorIdentity: str("ident!xxxx of the admin"),
      limit: { type: "integer", minimum: 1, maximum: 200 },
    }),
    readOnly: true,
    run: read(
      z.object({
        action: z.string().max(60).optional(),
        targetType: z.string().max(20).optional(),
        targetId: z.string().max(40).optional(),
        actorIdentity: z.string().max(60).optional(),
        limit,
      }),
      ({ limit, ...where }) => db.adminAudit.findMany({ where, orderBy: { createdAt: "desc" }, take: limit }),
    ),
  },

  /* -------------------------------------------------------- writes (audited) */
  fulfill_order: {
    description: "Mark a pending order fulfilled (it's been sent).",
    inputSchema: obj({ orderId: str("Order id"), note: str("Optional note, e.g. tracking number") }, ["orderId"]),
    run: write(ops.schemas.fulfillOrder, ops.fulfillOrder),
  },
  reject_order: {
    description: "Reject a pending order and refund its Pumpkins. A reason is required.",
    inputSchema: obj({ orderId: str("Order id"), note: str("Why it was rejected (shown to the user)") }, ["orderId", "note"]),
    run: write(ops.schemas.rejectOrder, ops.rejectOrder),
  },
  add_suggestion: {
    description: "Mark a new suggestion as added to the shop. Add the item to the catalog first.",
    inputSchema: obj({ suggestionId: str("Suggestion id"), note: str("Optional note") }, ["suggestionId"]),
    run: write(ops.schemas.suggestion, (a, i) => ops.resolveSuggestion(a, i, "ADDED")),
  },
  decline_suggestion: {
    description: "Decline a new shop suggestion.",
    inputSchema: obj({ suggestionId: str("Suggestion id"), note: str("Optional note") }, ["suggestionId"]),
    run: write(ops.schemas.suggestion, (a, i) => ops.resolveSuggestion(a, i, "DECLINED")),
  },
  adjust_pumpkins: {
    description: "Add (positive) or remove (negative) Pumpkins from a user. Never takes a balance below zero.",
    inputSchema: obj(
      {
        userId: str("User id"),
        delta: { type: "integer", minimum: -100000, maximum: 100000, description: "Non-zero change" },
        reason: str("Why; goes in the audit log"),
      },
      ["userId", "delta", "reason"],
    ),
    run: write(ops.schemas.adjustPumpkins, ops.adjustPumpkins),
  },
  reset_onboarding: {
    description: "Reset a user's onboarding so they see the carving table and tour again.",
    inputSchema: obj({ userId: str("User id") }, ["userId"]),
    run: write(ops.schemas.userId, ops.resetOnboarding),
  },
  resend_ari: {
    description: "Send a shipped game to Ari again, e.g. after a failed send.",
    inputSchema: obj({ gameId: str("Game id") }, ["gameId"]),
    run: write(ops.schemas.gameId, (a, i, req) => ops.resendAri(a, i, publicOrigin(req))),
  },
  resync_airtable: {
    description: "Re-sync a shipped game to the program Airtable now. Writes to the real base.",
    inputSchema: obj({ gameId: str("Game id") }, ["gameId"]),
    run: write(ops.schemas.gameId, (a, i, req) => ops.resyncAirtable(a, i, publicOrigin(req))),
  },
};

/* ------------------------------------------------------------ JSON-RPC */

interface RpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Json;
}

const ok = (id: RpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id, result });
const fail = (id: RpcRequest["id"], code: number, message: string) => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

async function handle(msg: RpcRequest, admin: Admin, req: NextRequest) {
  switch (msg.method) {
    case "initialize":
      return ok(msg.id, {
        protocolVersion: PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: "scare-admin", version: "1.0.0" },
        instructions:
          `You're acting as ${admin.name ?? admin.identity}, a Scare admin. Every write is audited under that identity. ` +
          "Ships are reviewed in Ari, not here. Look things up before changing them, and confirm money-like changes (Pumpkins, refunds) with the person.",
      });
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, {
        tools: Object.entries(TOOLS).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: { readOnlyHint: Boolean(t.readOnly), destructiveHint: !t.readOnly, openWorldHint: false },
        })),
      });
    case "tools/call": {
      const name = typeof msg.params?.name === "string" ? msg.params.name : "";
      const tool = TOOLS[name];
      if (!tool) return fail(msg.id, -32602, `Unknown tool: ${name}`);
      // Same budget as the dashboard's actions for writes; reads get more room.
      const budget = tool.readOnly ? rateLimit(`admin-mcp-read:${admin.userId}`, 300, 60_000) : rateLimit(`admin:${admin.userId}`, 60, 60_000);
      if (!budget.ok) return ok(msg.id, { isError: true, content: [{ type: "text", text: `Slow down: try again in ${budget.retryAfter}s.` }] });
      try {
        const result = await tool.run(admin, msg.params?.arguments, req);
        const text = typeof result === "string" ? result : JSON.stringify(result, null, 1);
        return ok(msg.id, { content: [{ type: "text", text }] });
      } catch (e) {
        const text = e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : e instanceof Error ? e.message : "Something went wrong.";
        return ok(msg.id, { isError: true, content: [{ type: "text", text }] });
      }
    }
    default:
      return msg.id === undefined ? null : fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

const notFound = () => new Response("Not Found", { status: 404 });

export async function POST(req: NextRequest) {
  if (!mcpConfigured) return notFound();
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return notFound();
  const admin = await adminFromMcpToken(token);
  if (!admin) return notFound();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(fail(null, -32700, "Parse error"), { status: 400 });
  }
  const batch = Array.isArray(body);
  const msgs = (batch ? body : [body]) as RpcRequest[];
  const replies = (await Promise.all(msgs.map(async (m) => (m && typeof m.method === "string" ? handle(m, admin, req) : fail(null, -32600, "Invalid request"))))).filter(Boolean);

  // Notifications only (e.g. notifications/initialized): accepted, nothing to say.
  if (replies.length === 0) return new Response(null, { status: 202 });
  return Response.json(batch ? replies : replies[0]);
}

// No server-to-client stream and no sessions.
export function GET() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
export function DELETE() {
  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } });
}
