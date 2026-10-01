# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + tRPC + Prisma (SQLite) + Tailwind v4, from create-t3-app. Package manager: bun. Sign-in lives in this app.

## What it is

Scare is a Hack Club YSWS ("You Ship, We Ship") program: teenagers build and ship a horror game, and Hack Club sends them Steam games in return.

## Users

Teen members of Hack Club (roughly 13–18), many of them first-time game devs. They arrive from Slack announcements or a friend's link, usually on a laptop, sometimes on a phone. Their job on the site: understand the deal in seconds, sign in, and register the game they're making.

## How it works (confirmed)

- Build a horror game and ship it (playable by other people).
- Shipping earns **Pumpkins**, Scare's currency.
- Earn rate (confirmed 2026-10-01): **10 Pumpkins per hour**. Which hours count (shipped games only? Hackatime vs. edited time? after review?) is not decided.
- Pumpkins are spent in the **Pumpkin Shop** on the platform (`/platform/shop`). It is **open** with a fixed catalog; the current items are placeholders until the real catalog is set.
- Program cost: **$4 per hour** (confirmed 2026-10-01), so 1 Pumpkin = $0.40; shop prices derive from each item's dollar cost.
- Rewards named for the "You get" line (confirmed 2026-09-30): **Steam games, costume grants, candy, and hardware grants**. How each is earned or priced is not decided.
- The program **ends on Halloween: October 31, 2026**.
- Primary action: **sign in on this site** (then register/submit a game).

## Open decisions (do not invent)

- Program start date and any mid-program milestones — undecided.
- Exact submission requirements (engine rules, minimum playtime, review process) — undecided; placeholder copy only, clearly marked.

## Terminology

- "Hack Club" — always written exactly that way (never Hackclub, hack club, HackClub).
- "YSWS" — You Ship, We Ship.
- "Pumpkins" — the currency; capitalized.
- "Ship" — publish a playable build others can run.

## Voice

Playful-spooky, teen-to-teen, never corporate. Horror as fun, not gore. Short sentences.

## Accessibility

Respect prefers-reduced-motion (no jump scares or flashing for those users; no strobing for anyone). Horror atmosphere must not cost text contrast.
