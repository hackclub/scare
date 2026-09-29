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
| `AUTH_HACKCLUB_ID` / `AUTH_HACKCLUB_SECRET` | OAuth app from [auth.hackclub.com](https://auth.hackclub.com). Redirect URI: `http://localhost:3000/api/auth/callback/hackclub` |

Without the Hack Club Auth keys the site still runs; the sign-in buttons explain that sign-in isn't connected yet.

Sign-in stores the `slack_id` and `ysws_eligible` claims on the user, and refreshes them on every sign-in.

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
