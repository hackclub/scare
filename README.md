# Scare

A Hack Club YSWS: make a horror game, ship it before Halloween (October 31, 2026), earn **Pumpkins**, and spend them on Steam games in the Pumpkin Shop.

This repo is the program site: the landing page and a signed-in dashboard ("your haunt") where participants register games and mark them shipped.

## Stack

Next.js 15 (App Router) · tRPC · Prisma (SQLite) · Auth.js with Hack Club Auth (OIDC) · Tailwind v4 · bun

## Run it

```sh
bun install
cp .env.example .env        # then fill in the values below
bunx prisma db push
bun run dev
```

### Environment

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | SQLite file, e.g. `file:./db.sqlite` |
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

### The Pumpkin economy

- Rates live in `src/lib/program.ts`: `PUMPKINS_PER_HOUR = 10`, `USD_PER_HOUR = 4`, so one Pumpkin is worth $0.40.
- The catalog is `src/lib/shop-catalog.ts`. Each item has a dollar cost (`usd`); its Pumpkin price is computed from it (`pumpkinsFor`), so changing a dollar amount reprices the item. Every item is currently marked `sample: true` (shows a "sample" tag): replace them with the real catalog.
- Orders (`Order` model) copy the item name and price at purchase time. Buying holds Pumpkins with a single conditional decrement, so a balance can't be overspent; cancelling a pending order refunds it. Fulfilling or rejecting orders is not built yet (do it in the DB for now).
- `User.pumpkins` is the balance. Nothing credits it automatically yet: which hours count (shipped only, Hackatime vs. edited, after review) is still open.

### Routes

- `/`: landing page
- `/login`: sign-in
- `/platform`: home (next step, status, your games)
- `/platform/projects`: register and ship games
- `/platform/shop`: the Pumpkin Shop, locked until it opens
- `/platform/profile`: live Hack Club identity, sign out
- `/haunt`: redirects to `/platform`

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
