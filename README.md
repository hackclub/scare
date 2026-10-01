# Scare

A Hack Club YSWS: make a horror game, ship it before Halloween (October 31, 2026), earn **Pumpkins**, and spend them on Steam games in the Pumpkin Shop.

This repo is the program site: the landing page and a signed-in dashboard ("your haunt") where participants register games and mark them shipped.

## Stack

Next.js 15 (App Router) · tRPC · Prisma (Postgres) · Auth.js with Hack Club Auth (OIDC) · Tailwind v4 · bun

## Run it

```sh
bun install
cp .env.example .env        # then fill in the values below
bun run dev
```

The app talks to Postgres through node-postgres (`@prisma/adapter-pg`). Prisma's own engine can't negotiate TLS 1.3 on macOS, which the dev database requires, so `prisma db push` and `prisma studio` fail locally with "bad protocol version". They work on Linux, which is how the container syncs the schema at startup. To change the dev schema from a Mac, run `prisma db push` from Linux or a Docker container.

### Environment

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Local dev uses the shared dev database; production has its own |
| `AUTH_SECRET` | Random secret for Auth.js (`npx auth secret`) |
| `AUTH_HACKCLUB_ID` / `AUTH_HACKCLUB_SECRET` | OAuth app from [auth.hackclub.com](https://auth.hackclub.com/developer/apps). Redirect URI: `http://localhost:3000/api/auth/callback/hackclub` (add your production URL's callback too) |

In production, also set `AUTH_URL` to the site's public URL.

Without the Hack Club Auth keys the site still runs; `/login` explains that sign-in isn't connected yet.

### Sign-in

Hack Club Auth over OAuth 2.0 (PKCE + state, client secret in the token request body), identity from `GET /api/v1/me`. Scopes: `email name phone birthdate address verification_status slack_id basic_info`; phone, birthdate, address and basic_info are HQ-only and need the app at the `hq_official` trust level.

Scare stores only the Hack Club identity ID, name, email, Slack ID, verification status and YSWS eligibility, refreshed on every sign-in and whenever Profile is opened. Phone, birthday and addresses are never written to the database; `getIdentity()` in `src/server/hackclub.ts` reads them live, refreshing the access token (refresh tokens rotate) when needed.

### Hackatime linking

Participants link Hackatime from Profile (or from the project form) so they can pick a Hackatime project for a game and use its tracked time, or override it. Hackatime is linked to an existing Scare account and is never a sign-in method.

- Env: `HACKATIME_CLIENT_ID`, `HACKATIME_CLIENT_SECRET`. Scopes `profile read`. Redirect URI: `http://localhost:3000/api/auth/callback/hackatime` (plus the production equivalent).
- `/api/hackatime/connect` starts the flow (state + PKCE in a short-lived httpOnly cookie); `src/app/api/auth/callback/hackatime/route.ts` handles the callback. It's a static route, so it wins over Auth.js's catch-all.
- One Hackatime account can be linked to one Scare account. Profile warns when Hackatime's Slack ID differs from Hack Club Auth's.
- Per game: `hackatimeProject`, `trackedSeconds` (Hackatime's total, re-read on the server on save and frozen at shipping) and `claimedSeconds` (set only when the participant edited the time). Counted time is `claimedSeconds ?? trackedSeconds`.
- Project totals are all-time Hackatime totals; nothing limits them to the program's dates yet.

### Screenshots

A game needs a screenshot to ship (`game.ship` refuses without one). Uploads go to `POST /api/games/[id]/screenshot` (multipart, field `file`) and are served back to the owner from `GET` on the same path.

- PNG, JPEG or WebP, up to 5 MB. The type is decided from the file's bytes (`src/lib/screenshot.ts`), so a GIF renamed to `.png` is still refused; animated PNG and WebP are refused too.
- Stored in Postgres in the `Screenshot` table (one per game, replaced on re-upload), kept out of `Game` so listing games never loads image bytes. Move to object storage if volume grows.
- Uploads are rate limited to 20 per user per 10 minutes.

### The Pumpkin economy

- Rates live in `src/lib/program.ts`: `PUMPKINS_PER_HOUR = 10`, `USD_PER_HOUR = 4`, so one Pumpkin is worth $0.40.
- The catalog is `src/lib/shop-catalog.ts`. Each item has a dollar cost (`usd`); its Pumpkin price is computed from it (`pumpkinsFor`), so changing a dollar amount reprices the item. Items can ask for one free-text detail (`ask`), offer variants (`pick`, stored as the order's details and checked on the server), and be marked `ships` (physical, sent to the address on the buyer's Hack Club account). Steam items are grants, so they ask for nothing. Shelves and items are listed most popular first, which is the order the shop shows them in; `featured: true` puts an item on the Featured tab, which sorts by price. Dollar amounts for the physical items are estimates.
- Orders (`Order` model) copy the item name and price at purchase time. Buying holds Pumpkins with a single conditional decrement, so a balance can't be overspent; cancelling a pending order refunds it. Fulfilling or rejecting orders is not built yet (do it in the DB for now).
- `User.pumpkins` is the balance. Nothing credits it automatically yet: which hours count (shipped only, Hackatime vs. edited, after review) is still open.

### Admin (`/admin`)

For reviewing ships, handling orders and managing balances.

- **Access:** `ADMIN_IDENTITY_IDS`, a comma-separated list of Hack Club identity IDs (`ident!xxxx`, shown on Profile). It's matched against the identity stored from Hack Club Auth, which users can't edit. Empty or unset means no admins.
- **Gating:** every admin page, server action and admin image read re-checks the allowlist on the server (`src/server/admin.ts`). Anyone else gets a plain 404. Pages are `noindex` and never cached, and actions are rate limited (60 a minute per admin).
- **Audit:** every action writes an `AdminAudit` row in the same transaction as the change: who, what, target and detail. `/admin/audit` lists them.
- **Ships:** approve (awards Pumpkins once, suggested at 10/hour from counted time) or send back with a note (the game returns to brewing, and the participant sees the note).
- **Orders:** fulfill, or reject (refunds the Pumpkins). Both only act on pending orders.
- **Suggestions:** items participants asked for from the shop's "Suggest an item" tile (`Suggestion` model). New ones sort by how many people asked for the same name. Mark one added (after putting it in the catalog) or decline it; an optional note is shown to the person who suggested it. Participants can have 10 open suggestions and send 5 an hour.
- **Users:** search, view games/orders/history, adjust Pumpkins with a reason (can't go below zero), reset onboarding.

### Airtable

Shipped games are mirrored to the program base's "YSWS Project Submission" table (`src/server/airtable.ts`), which is how they reach Hack Club's Unified YSWS database.

- Env: `AIRTABLE_PAT` (scoped to the one base), `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_ID`.
- Shipping creates the record as **Pending**, sent after the response so Airtable can never block shipping. Approving sets **Accepted**; sending back sets **Resubmission Requested** with the note as the reason. Editing a shipped game updates it.
- Fields: code/play URL, description, screenshot, Hackatime ID, GitHub username, project name and hours (override + justification when the hours were edited). Name, email, birthday and address are read live from Hack Club Auth at sync time and never stored in Scare. Fields are written by ID, so renaming an Airtable column doesn't break the sync.
- Screenshots go up through a signed link that expires after 3 days (HMAC with `AUTH_SECRET`), because the image route is otherwise private. Airtable has to reach the site to fetch it, so this only works on the public domain, not localhost.
- Your approval note goes into the Unified Justification. It's written to "Justification - Additional Justification" (shown under `[ADDITIONAL JUSTIFICATION]`) and, when the hours were overridden, also appended to the override justification, since the formula uses only that field in that case. Send-back notes go to "Resubmission Request Reason".
- Scare **never** ticks "Automation - Submit to Unified YSWS". A person does that in Airtable.
- Sync failures are stored on the game and shown on its admin card, with a Resync button. Before creating a record, Scare reuses one with the same code URL if it was made but its ID never got saved, so a retry can't duplicate.

### Routes

- `/`: landing page
- `/login`: sign-in
- `/welcome`: first-run onboarding, the Carving Table. The platform redirects here until `User.onboardedAt` is set (finishing or skipping sets it); Profile → "Carve again" replays it
- `/platform`: home (next step, status, your games)
- `/platform/projects`: register and ship games
- `/platform/shop`: the Pumpkin Shop
- `/admin`: admin dashboard (allowlisted identities only; 404 for everyone else)
- `/platform/profile`: live Hack Club identity, sign out
- `/haunt`: redirects to `/platform`

## Deploy (Orchard)

The `Dockerfile` builds a production image that listens on port `3000`.

- Set `DATABASE_URL` (the production Postgres), `AUTH_SECRET`, `AUTH_URL`, `AUTH_HACKCLUB_ID` / `AUTH_HACKCLUB_SECRET` and `HACKATIME_CLIENT_ID` / `HACKATIME_CLIENT_SECRET`.
- Run one replica: the rate limiter is in memory, so it doesn't hold across instances.
- On start the container runs `prisma db push`, which refuses changes that would drop data. Apply those by hand.

## Where things live

- `src/lib/program.ts`: deadline, links. Change program facts here.
- `src/app/page.tsx`: landing page copy. Undecided facts render with the `.tba` tag ("Announced soon"); replace them once decided.
- `src/app/_components/lantern.tsx`: the live ASCII jack-o'-lantern (canvas, ray-marched, cursor-tracking, click to recarve).
- `src/lib/glyphs.ts` + `glyph-text.tsx`: display type built from typewriter characters (5x7 bitmap, server-rendered).
- `src/server/api/routers/game.ts`: register / ship / delete games.
- `User.pumpkins` in `prisma/schema.prisma`: the balance column, reserved for the shop platform.

## Still to decide

- Pumpkins per shipped game
- The shop catalog and prices
- Full submission requirements (team size, review process)
