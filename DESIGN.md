---
name: Scare
description: A jack-o'-lantern rendered live in typewriter glyphs, watching the visitor. One pumpkin ink on warm black.
colors:
  void: "#070504"
  crypt: "#0e0906"
  ink-05: "#1a0e06"
  ink-15: "#2e1808"
  ink-30: "#5a2f0e"
  ink-60: "#c26a22"
  ink-80: "#f0a05a"
  ink: "#ff8a1f"
  hot: "#ffd9a3"
  blood: "#ff5b3a"
  shelf-steam: "#8fb8ff"
  shelf-gear: "#5fdcc8"
  shelf-friends: "#ffd84d"
  shelf-candy: "#ff8cc6"
  shelf-costume: "#b99aff"
  shelf-hardware: "#9ee86f"
typography:
  display:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "min(var(--max), calc(100cqi / var(--cols) / 0.6364))"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "0"
  headline:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(22px, 2.2vw, 30px)"
    fontWeight: 400
    letterSpacing: "0.12em"
  title:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    fontVariation: "'wdth' 87.5"
  body:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "'wdth' 87.5"
  lead:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "clamp(17px, 1.35vw, 20px)"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "'wdth' 87.5"
  label:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.14em"
  button:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    letterSpacing: "0.12em"
  label-sm:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.14em"
  caption:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    letterSpacing: "0.1em"
  body-sm:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
    fontVariation: "'wdth' 87.5"
  subhead:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "'wdth' 87.5"
  wordmark:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "18px"
    fontWeight: 400
    letterSpacing: "0.28em"
  platform-title:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "clamp(28px, 3vw, 40px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.1em"
  price:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1
  price-lg:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1
  readout:
    fontFamily: "Departure Mono, ui-monospace, Menlo, monospace"
    fontSize: "26px"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 4vw, 48px)"
  hud: "60px"
  band: "clamp(96px, 12vw, 168px)"
  band-head: "clamp(48px, 6vw, 80px)"
  panel: "24px"
  row: "22px"
  gap-sm: "12px"
  gap-md: "16px"
  gap-lg: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.void}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.hot}"
    textColor: "{colors.void}"
  button-primary-active:
    backgroundColor: "{colors.ink-60}"
    textColor: "{colors.void}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "48px"
  button-ghost-hover:
    backgroundColor: "{colors.ink-05}"
    textColor: "{colors.hot}"
  button-hud:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.void}"
    rounded: "{rounded.none}"
    padding: "0 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.void}"
    textColor: "{colors.hot}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
  frame-head:
    backgroundColor: "transparent"
    textColor: "{colors.ink-60}"
    typography: "{typography.label}"
    padding: "12px 20px"
  panel:
    backgroundColor: "{colors.crypt}"
    textColor: "{colors.ink-80}"
    rounded: "{rounded.none}"
    padding: "{spacing.panel}"
  tba-tag:
    backgroundColor: "transparent"
    textColor: "{colors.ink-60}"
    rounded: "{rounded.none}"
    padding: "1px 7px"
  link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
  link-hover:
    textColor: "{colors.hot}"
---

# Design System: Scare

## Overview

**Creative North Star: "The Glyph Lantern"**

Scare is a jack-o'-lantern printed by a typewriter and lit from inside. Every surface is warm black paper, every mark is one pumpkin ink, and the only way anything gets brighter is by getting denser: a `.` becomes a `:` becomes a `#` becomes an `@`, until the candle core at the very center goes near-white. Halloween here is a live object that turns to watch you, not a costume of fog, bats and dripping type. The lantern on the landing page is the one full expression of this; everything else on the site is the same material at rest.

The system is monospace all the way down. Departure Mono (a pixel-grid mono) runs the HUD, labels, buttons and the 5x7 bitmap display type; Martian Mono, narrowed to 87.5% width, carries reading text. Structure is drawn, not filled: 1px dotted rules and frames, square corners, header rows set like terminal status lines. Density stays calm and readable. Atmosphere is two fixed overlays (fine scanlines and a candle-dark vignette) that sit above everything, take no pointer events, and never cost contrast.

The build refuses the stock Halloween landing page: no fog, no bats, no dripping or "horror" display fonts, no purple-and-green second palette. Horror is fun and tense, never gore.

**Key Characteristics:**
- One hue. Tone comes from glyph density and a single ink ramp, never from a second color.
- Display type is built from characters: 5x7 bitmap letters whose lit pixels are typewriter glyphs chosen by ink weight.
- Dotted 1px frames with a header row hold all below-fold content.
- Square everything. No radius anywhere in the UI.
- Primary buttons are filled with ink the way a glyph fills a cell: a dense dot screen, not a flat plate.
- Motion is a spring, a flicker, a blinking cursor. All of it stops under reduced motion.

## Colors

A single pumpkin ink stepped from ember to candle core on warm black, with one reserved red for errors.

### Primary
- **Pumpkin Ink** (`ink`): The one hue. Primary button fill, links, active HUD values, glyph letter bodies, the FAQ cursor, frame-head leading label, step-number frames. 8.6:1 on Void.
- **Candle Core** (`hot`): The only near-white. Headings in Departure Mono, glyph highlights (with a 10px ink glow), `strong`, `code`, input text, hover state for every interactive element, focus ring. It means "lit": the brightest thing in view is either the lantern's flame or the thing you're touching.

### Secondary
- **Blood Ember** (`blood`): Errors only. Invalid input borders, field and form error text (prefixed `! `), the confirm-delete link. Never decorative, never a highlight.

### Neutral
The ink ramp is the neutral scale. Each step is Pumpkin Ink at lower density, so neutrals stay warm and on-hue.
- **Void** (`void`): Page background, input background, button text on ink fills, `theme-color`.
- **Crypt** (`crypt`): Raised panels, shipped-game cards, the top of the frame gradient (Crypt to Void).
- **Soot** (`ink-05`): Ghost button hover wash. Surface tint only.
- **Charred** (`ink-15`): Faintest rules: band dividers, row separators inside frames, empty-state frames. Never text (1.2:1).
- **Ember** (`ink-30`): Frame and panel borders, HUD underline, ledger leaders, glyph drop shadows, the step fuse, input rest border, decorative HUD brackets. Never text (1.8:1).
- **Smolder** (`ink-60`): Secondary text: labels, frame-head meta, hints, captions, notes, the `.tba` tag, dim glyph pixels. The lowest step allowed to carry text (5.2:1).
- **Warm Glow** (`ink-80`): Default body text color (9.6:1).

### Named Rules
**The One Ink Rule.** There is exactly one hue. Every color except `blood` is Pumpkin Ink at a density step. A new state, category or emphasis gets a denser or sparser step, never a new hue. The one exception is the shop's shelf hues (below), and they appear only on shop items: in the shop, and in the landing page's shop preview.

**The Shelf Hue Rule.** In the shop, each shelf has one hue (`shelf-*`) that tells shelves apart at a glance. It colors only the shelf's markers: tile icon, 2px top edge, tinted dotted border and wash, shelf label, meter, tab swatch and underline, and the selected state. Item names stay Candle Core and prices stay Pumpkin, because Pumpkins are the currency everywhere.

**The Blood Is For Errors Rule.** `blood` appears only where something is wrong. If it is on screen, the user has a problem to fix.

**The Candle Core Rule.** `hot` is the only near-white and it means "lit": headings, highlights, and whatever is being hovered or focused. Plain white never appears.

**The Smolder Floor Rule.** Text never goes below `ink-60`. `ink-30` and darker are for lines, shadows and texture only.

## Typography

**Display Font:** 5x7 bitmap glyph type (the project's `renderGlyphs`), set in Departure Mono
**Body Font:** Martian Mono at `font-stretch: 87.5%` (with ui-monospace, SFMono-Regular, Menlo)
**Label/Mono Font:** Departure Mono (self-hosted woff2, with ui-monospace, Menlo)

**Character:** A pixel-grid mono for everything the machine says (HUD, labels, buttons, headings) and a slightly condensed humanist mono for everything a person reads. Both are monospace, so the whole page sits on a character grid.

### Hierarchy
- **Display** (glyph type, cells sized to fit the container, line-height 1.08): Page and section headings (SCARE, THE DEAL, PUMPKINS, WHAT COUNTS, FAQ, LIGHTS OUT, YOUR HAUNT) and big numerals (the glyph countdown, the Pumpkins balance). Each bitmap pixel becomes `2*scale` columns by `scale` rows of glyphs from `* % # & $ @`, brighter toward the letter's foot as if lit from below, with edge noise. Cell size is capped by a per-use `max` (hero 9px, section heads 5.5px, close 6.5px, countdown 6px) and shrinks via container query to fit. Hero and close titles add the density shadow; all headings use `bold`. The real text lives in an `sr-only` span; the art is `aria-hidden`.
- **Headline** (Departure Mono 400, clamp(22px, 2.2vw, 30px), 0.12em, uppercase, Candle Core): Step names in the deal (MAKE, SHIP, EARN, SPEND).
- **Title** (Martian Mono 600, 20px, line-height 1.3, Candle Core): User-authored titles such as game names. The Departure Mono variant (400, 20px, 0.12em, uppercase) titles the game board.
- **Body** (Martian Mono 400, 16px, line-height 1.6, Warm Glow): Running text. Step bodies and pitches run 15px; FAQ answers 16px/1.7. Measures cap at 38–64ch (hero lead 38ch, band leads 52ch, FAQ answers 64ch). `text-wrap: pretty` on prose.
- **Lead** (Martian Mono 400, clamp(17px, 1.35vw, 20px), line-height 1.6): The hero sentence; band leads and checklist rows sit at 17–20px.
- **Hero lockup:** the Hack Club flag (Pumpkin Ink, letters masked to the ground, 96–128px wide, 84px on mobile; links to hackclub.com, tips 5° on hover) sits above the glyph SCARE; below it a Label-style byline, "Ran with [pixel heart] by Barnav", in Smolder 12px at 0.16em with the heart in Candle Core and a small candle glow.
- **Label** (Departure Mono 400, 11–12px, 0.14em, uppercase, Smolder): Frame heads, panel titles, fact terms, countdown units, captions, lantern HUD. HUD links run 13px/0.1em; buttons 14px/0.12em (HUD button 12px).

### Named Rules
**The Built From Characters Rule.** Display type is always glyph type: bitmap letters made of typewriter characters. There is no display font. Never set a heading in a large webfont, and never add drip trails to glyph type (the renderer's `drips` option is the refused trope and stays at 0).

**The Narrow Scale Rule.** Every glyph heading at `scale={2}` ships a `narrowScale={1}` variant that swaps in at ≤640px, so letters stay letters when cells get tiny.

**The Machine Speaks Mono Rule.** Anything the interface itself says (labels, buttons, status, counts, nav) is Departure Mono, uppercase, tracked 0.1–0.14em. Anything a person reads as prose is Martian Mono in sentence case.

## Layout

A full-bleed character-grid page with a sticky HUD and long, spacious bands.

- **HUD:** Sticky, 60px tall (56px at ≤900px), Void at 92% opacity, dotted Ember underline. Brand lockup left (pixel pumpkin, Hack Club flag, dotted rule, SCARE), bracketed section nav centered, countdown and sign-in right. At ≤1100px the countdown hides; at ≤900px the nav hides.
- **Gutter:** `clamp(16px, 4vw, 48px)` on every horizontal edge; 16px minimum at phone width.
- **Hero:** Two columns (copy 1fr, lantern 1.1fr), `min-height: calc(100svh - HUD)`. The lantern column stretches to full height (min 560px). At ≤900px it stacks with the lantern first at `min(46svh, 440px)`.
- **Bands:** Max 1440px, vertical padding `clamp(96px, 12vw, 168px)`, separated by a dotted Charred rule. Heading block gets `clamp(48px, 6vw, 80px)` below. Three band layouts: full-width frame (the deal, and the Pumpkins band's shop preview), split 1.1fr/0.9fr, and aside 5fr/7fr with a sticky heading on the left and the frame on the right (rules, FAQ). All collapse to one column at ≤900px.
- **Dashboard (haunt):** Max 1280px; a 260–340px status sidebar of panels beside the game board, 40px gap. At ≤900px the board comes first and the panels reflow into an auto-fit grid (min 240px).
- **Rhythm:** Inside frames, rows sit at 22px vertical padding with 20px side padding (16px at ≤640px). Panels pad 24px. Common gaps are 12, 16, 24 and 40px.
- **Mobile (≤640px):** Glyph headings drop to the narrow scale, the step grid collapses to number + content, hero and close buttons go full width, forms go single column.

## Elevation & Depth

Flat. There are no drop shadows on any surface. Depth comes from three things only: tonal layering (Void page, Crypt panels, a Crypt-to-Void gradient inside frames), light (the `hot` glyph glow and the lantern's own candle), and the fixed atmosphere layers. The scanline layer (`repeating-linear-gradient`, 3px period, black at 14%) and the vignette (`radial-gradient`, 120% by 90% at 50% 40%, transparent to 55% black) sit at z-index 60 over the whole page with `pointer-events: none`.

### Shadow Vocabulary
- **Candle glow** (`text-shadow: 0 0 10px rgb(255 138 31 / 0.45)`): Only on the hottest glyph pixels in display type. It reads as light, not elevation.
- **Input focus inset** (`box-shadow: inset 0 0 0 1px var(--ink)`): Thickens the input border to 2px on focus. Not a lift.

### Named Rules
**The Lit, Not Lifted Rule.** Nothing floats. Brightness is the only depth cue: things get closer by getting denser and warmer, never by casting a shadow.

**The Glass Stays Clean Rule.** The scanline and vignette layers never intercept input and never go darker than the specified alphas; atmosphere must not cost text contrast.

## Shapes

Square and drawn. Every corner is 0px, including buttons, inputs, panels and the scrollbar thumb. Borders are 1px and dotted by default: frames, panels, frame heads, the HUD underline, row separators, ledger leaders, the step fuse, the `.tba` tag. Three deliberate exceptions change the stroke to mean something: dashed for the ghost button (an outline you could cut along), solid for inputs (a place to write), and solid Smolder for a shipped game card (it's done, the line is inked in). Status dots are 8px squares, hollow for pending and filled for done. Icons are pixel art on a 12x12 grid with `shape-rendering: crispEdges`, one 2-unit stroke.

## Components

### Buttons
Density-filled and square, like a stamped block of ink.
- **Shape:** Square corners (0px), 48px tall, 0 22px padding, 0.75em gap to a trailing pixel icon.
- **Primary:** Pumpkin Ink fill with Void text, overlaid with a Void dot screen (`radial-gradient(rgb(7 5 4 / 0.32) 0.75px, transparent 1.1px)` at 3px). Departure Mono 14px, 0.12em, uppercase.
- **Hover / Focus:** Fill brightens to Candle Core while the dot screen opens from 3px to 5px (0.35s, `cubic-bezier(0.16, 1, 0.3, 1)`); the trailing icon nudges 3px right. Active drops to Smolder. Focus is the global 2px Candle Core outline, 3px offset. Disabled is 55% opacity with a progress cursor.
- **Ghost:** Transparent with a 1px dashed Smolder border and Pumpkin Ink text; hover goes to Candle Core text and border over a Soot wash. Used for secondary actions (How it works, Register a game, Cancel).
- **HUD:** The primary treatment at 36px tall, 0 14px, 12px type, no icon. Sign in, Your haunt, Sign out.

### Links
- **Style:** Pumpkin Ink with a 1px dotted Smolder underline at 0.3em offset. Hover turns both to Candle Core.
- **Variants:** Quiet (Smolder text, for low-priority actions like Delete), Danger (Blood text and underline, for the confirm step of a destructive action only). External links carry the pixel up-right arrow at 0.75em.

### The TBA Tag (signature)
The honest placeholder for a program decision that hasn't been made. Departure Mono at max(11.5px, 0.72em), 0.12em, uppercase, Smolder text inside a 1px dotted Smolder box, 1px 7px padding, nudged up 0.12em to sit inline with prose. Text is short and factual ("Earn rate announced soon", "Posted soon").

### Frames (the below-fold container)
- **Corner Style:** Square (0px).
- **Background:** Vertical gradient Crypt to Void.
- **Border:** 1px dotted Ember.
- **Header row:** 12px 20px padding, dotted Ember underline, Departure Mono 12px/0.14em uppercase. The left item is Pumpkin Ink (what this is), the right item is Smolder meta (a count or summary: "4 steps · 1 deadline", "6 answered").
- **Rows inside:** 22px vertical padding, dotted Charred separators, no separator after the last row.

### Panels / Cards
- **Panels** (dashboard sidebar, register form): Crypt fill, 1px dotted Ember border, 24px padding, a Label-style panel title in Smolder.
- **Game card:** 1px dotted Ember, 24px padding, content left and actions right (stacked at ≤640px). A shipped game switches to a solid Smolder border on Crypt with a Candle Core status line and filled status dot.
- **Empty state:** 1px dotted Charred frame, centered, 56px 24px padding, a small ASCII picture (the tombstone) above Smolder text.

### Inputs / Fields
- **Style:** Void fill, 1px solid Ember border, square, 12px 14px padding, Martian Mono 15px in Candle Core. Placeholder in Smolder.
- **Label:** Departure Mono 12px/0.12em uppercase in Warm Glow, with an optional sentence-case Smolder hint on the same baseline.
- **Hover / Focus:** Border steps to Smolder on hover; on focus the border goes Pumpkin Ink with a 1px inset ink ring (no outline glow).
- **Error:** Border turns Blood; a Departure Mono 12px Blood message below, prefixed `! `.

### Navigation (HUD)
Departure Mono 13px, 0.1em, uppercase, Warm Glow, each link wrapped in Ember `[ ]` brackets. Hover turns the label Candle Core and the brackets Pumpkin Ink, each bracket sliding 3px outward. The brand lockup is one home link: the 14×12 pixel PumpkinMark (body Pumpkin Ink, stem Smolder), the official Hack Club flag (assets.hackclub.com, drawn in Pumpkin Ink with its lettering masked out to the ground, never in Hack Club red), a 20px dotted Ember rule, then SCARE in Departure Mono 18px at 0.28em in Candle Core. Hover warms pumpkin and flag to Candle Core and tips the flag 4°. The inline countdown reads "Lights out in" in Smolder with tabular Pumpkin Ink digits.

### Checklist and FAQ rows
- **Checklist:** A `[✓]` box (Pumpkin Ink brackets, Candle Core pixel check) or an empty `[ ]` for pending items, which drop the whole row to Smolder and end with a `.tba` tag.
- **FAQ:** A native `details` row: a `>` prompt in Smolder (Pumpkin Ink when open), the question in Pumpkin Ink (Candle Core on hover or open), and a 12px plus that rotates to a minus. The answer ends with a blinking block cursor in Pumpkin Ink (1.1s, stepped).

### The Glyph Lantern (signature)
A canvas scene: a 3D pumpkin, shaded per cell with the density ramp ` .'\`:-=+*%#@` (plus `| / \` for the stem and cuts) and an 8-tone single-ink palette from ember (rgb 74 32 10) through Pumpkin Ink to candle core (rgb 255 222 168), with glow on the top two tones. Cells are 8–16px tall at a 0.62 width ratio. It springs toward the pointer with a little overshoot, drifts on its own after 3.5s idle, flickers with occasional gusts, and throws a pool of light on the floor. Click recarves a new seeded face (triangle, angry, round, crescent or slit eyes; teeth, grin, zigzag or O mouths) behind a knife sweep. The only chrome on it is a Recarve control pinned bottom-right: a 36px dashed-Ember ghost button on 72% Void with a pixel knife icon; hover turns it Candle Core and nudges the knife. No numeric readouts sit on the scene. Under reduced motion it renders one still, three-quarter pose and recarves without the sweep. Touch input does not steer it.

### ASCII pictures
Hand-set `pre` art in Departure Mono (line-height 1.15), `aria-hidden`, always next to words that carry the meaning: the four deal steps (Smolder, turning Candle Core on row hover), the empty-state tombstone.

## Do's and Don'ts

### Do:
- **Do** make every new color a step on the ink ramp (`void` → `ink-05` → `ink-15` → `ink-30` → `ink-60` → `ink-80` → `ink` → `hot`); tone is density.
- **Do** set every heading and big numeral in glyph type, with `bold`, and give any `scale={2}` heading a `narrowScale={1}` variant for ≤640px.
- **Do** put below-fold content in a dotted 1px Ember frame with a header row: what it is on the left in Pumpkin Ink, a count or summary on the right in Smolder.
- **Do** render any undecided program fact (earn rate, shop prices, start date, submission rules) with the `.tba` tag and short factual copy.
- **Do** keep corners at 0px and strokes at 1px, dotted unless the stroke means something (dashed ghost button, solid input, solid shipped card).
- **Do** use Candle Core for hover and focus on every interactive element, and the 2px Candle Core outline at 3px offset for keyboard focus.
- **Do** draw icons as 12x12 pixel SVGs with crisp edges, sized in em.
- **Do** stop all animation and transitions under `prefers-reduced-motion`, and keep the lantern still for those users.

### Don't:
- **Don't** add a second hue. `blood` is for errors only; no purple, green, or white accents.
- **Don't** add drip trails, fog, bats, cobwebs, or a "horror" display font. They are the refused trope.
- **Don't** invent program facts, numbers, or dates to fill a layout. Use the `.tba` tag.
- **Don't** set text in `ink-30` or darker; they fail contrast and are for lines and texture only.
- **Don't** use border-radius, drop shadows, or glassmorphism on any surface.
- **Don't** flash, strobe, or jump-scare. Motion is springs, flicker and a blinking cursor, never strobing for anyone.
- **Don't** let the scanline or vignette overlays catch pointer events or darken past their set alphas.

## Platform (operate mode)

The signed-in platform at `/platform` (styles in `src/styles/platform.css`) uses the same ink, frames and ledgers, quieter:

- **Shell:** a 248px Crypt rail (brand lockup with a "platform" tag, nav, "Logged in" with an eye button that reveals the name, hidden by default, sign out) beside a main column whose sticky 68px bar carries two boxed readouts, right-aligned: the Pumpkin balance (pumpkin icon, value, linking to the shop) and the countdown. Readouts are 44px dotted Ember frames on Crypt, label in Smolder 12px uppercase, value in Candle Core Departure 17px tabular. At ≤640px they share one row as a grid, and the balance drops its "Pumpkins" label. At ≤900px the rail becomes a top bar with four equal tabs underlined in Candle Core; the user block moves to Profile.
- **Nav:** Departure 13px uppercase; the current page gets the lit PumpkinPlain marker and an Ink-05 fill, the same grammar as the landing HUD. Counts sit right in Smolder; Shop carries a dotted `locked` tag.
- **Page head:** Departure platform-title in Candle Core, then a one-line density rule (`.` → `@`, 12 of each, Ember) clipped to the column, then a lead.
- **Content:** dotted frames with header rows hold everything: a Next step panel (one contextual task, one primary button), a Status ledger with the glyph Pumpkin balance, compact game lists with square state dots.
- **Login (`/login`):** split view, the sign-in frame centered on the left, the live lantern (no controls) on the right; on mobile the lantern sits above at 30svh. Auth.js errors render as a Blood dotted notice in plain words.
- **Private data:** phone, birthday and addresses are never stored; Profile reads them live from Hack Club Auth and shows them masked.

## Onboarding: the Carving Table (`/welcome`)

First-run flow told by **the Keeper**, a hooded ASCII figure carrying a lantern (eyes and flame in Candle Core, blinking and flickering on CSS step timing). Desktop is three columns: Keeper portrait + typed line (Martian 17–20px Candle Core, block caret) on the left, the person's own lantern in the middle, one action on the right (dimmed to 55% until the line finishes typing; full on hover/focus). At ≤1100px the lantern spans the top; at ≤720px everything stacks, lantern first.

- **The lantern** runs in carving mode: a fixed face seeded from the Hack Club identity, each feature `blank`, `sketch` (dashed outline, Ember-to-Pumpkin dashes) or `carved` (a black hole with a lit cut edge while unlit). The candle stays out until the finale, then lights through the cuts with the ignition ramp. No possession, no recarve.
- **Steps:** eyes = link Hackatime, mouth = first game (name, pitch, source), nose = a four-line tour of the platform pages shown on a mini rail. Every step has "Skip"; "Skip setup" sits top-right throughout. A skipped feature stays sketched and dark when lit.
- **Finale line:** "Welcome to Scare - we are looking forward to your creation." then **Go to Scare**.
- **Voice:** the Keeper talks like a person, not a narrator: plain, casual, a little deadpan. No atmospheric scene-setting, no em dashes, no triads.
- **Progress** under the lantern: Eyes / Mouth / Nose, with hint text (blank: what it's for; sketch: "not yet"; carved: "done" in Candle Core).

## Landing shop preview (`src/app/_components/shop-preview.tsx`)

- The Pumpkins band shows the live catalog as a frame ("Pumpkin Shop", item count) holding one row of shop tiles that drifts left at about 26px a second, interleaved by shelf so neighbours never share a hue. Edges fade into the frame.
- Tiles match the shop's (shelf hue edge, icon and label, Candle Core name, price role 24px) but aren't buttons, and they open with a real photo of the item: 16:10, bled to the tile edges under a 2px shelf-hue line, slightly desaturated, fading into the tile at the bottom. Logos (Steam) are shown whole instead of cropped.
- The footer has the suggestion line, a folded "Photo credits" list (author and licence, linked to each Commons file), and "Open the shop".
- It's a real scroll area (`shop-drift.tsx`): trackpad and shift-wheel scroll it, touch swipes it, the mouse drags it (grab cursor), and arrow keys move it when focused. The scrollbar is hidden; the edge fade says there's more. Either way it loops seamlessly.
- It drifts whenever a mouse isn't over it and nobody is dragging it, picking up the moment the pointer leaves or a drag ends. After a touch swipe it waits about a second for momentum to settle. It stops while off screen, and with reduced motion it never drifts but still scrolls.

## Projects ideas (`/platform/projects`, `ideas.tsx`, data in `src/lib/ideas.ts`)

- Projects is three columns on wide screens: the board, the generator (280-340px) and the idea list (260-320px), side by side so the ideas add no scroll length. The page widens to 1680px for it. At ≤1600px (where the board would get squeezed) both panels move under the board, still side by side; at ≤700px they stack.
- **Idea generator:** a frame ("Idea generator", the number of combinations) dealing a horror premise from four lists: Where, What's there, How you play, The twist. The title ("The Caller in Apartment 4B") sits in Candle Core at the title size; each part is a row button with a Smolder label and Warm Glow text that turns Candle Core on hover, with a "· reroll" tag. Clicking a row redeals just that part; a new line fades up 4px with a slight blur (none for reduced motion). Actions: "Roll again" (ghost, pixel die) and "Use this idea" (primary), which opens the register form filled in and focuses the name.
- **Ideas to steal:** six hand-written ideas covering each kind that counts (games, horror websites, LED costumes), each with kind and size in mono, a Candle Core name, one line, and a quiet "Start this" link that fills the form the same way.
- First render is a fixed deal so server and browser match; it shuffles on mount.

## Shop (`/platform/shop`, styles in `src/styles/shop.css`)

- **Wallet strip:** balance in Departure 40px Candle Core with a soft glow, "about N hours of building", the next affordable goal ("15 more for …") with a 20-cell glyph meter, and the earn rate as a compact readout.
- **Shelves:** Steam games, Gear, Candy, Desk friends, Costume grants, Hardware grants, each with its shelf hue. Shelves and the items on them are ordered most popular first (catalog order); dollar tiers of the same grant stay in dollar order.
- **Everything** groups tiles by shelf: each group has a heading (hue swatch, shelf name in its hue, the shelf's one-line blurb in Smolder) and its own grid, 32px between groups. Tiles drop their shelf label there, since the heading carries it.
- **Width:** the shop page widens the platform column to 1680px (the other pages keep 1120px), so the grid uses wide screens instead of leaving them empty.
- **Featured** is the default tab: six hand-picked items (`featured: true` in the catalog) on bigger tiles, at most three across, that also show the item's description. Pick them as a price ladder, from a cheap first win to one big goal.
- **Shelf tabs:** Featured, Everything, then one tab per shelf with a 7px hue swatch. Every tab has a count. The selected tab gets a 2px underline in its hue (Pumpkin Ink for Featured and Everything). The row scrolls sideways and fades at the right edge when it doesn't fit. Tiles show their shelf label only on Featured.
- **Item tiles:** a Crypt tile washed and edged in its shelf hue, with a 20px pixel icon (per item when it has one: mouse, keyboard, macropad, keychain, handheld, gadget, laptop, duck, shark; otherwise the shelf's), name, price (price role, 24px), and a footer meter (`#` for what you have, `.` for the rest) in the shelf hue, with "N to go" or "You can get this" always on the line below it, so every foot is the same height and prices line up across a row. Selecting a tile turns its border solid in its hue with a soft glow. No per-item tags or buttons.
- **Variants:** an item with options (gaming mouse, keyboard, costume grants: Spirit Halloween, Amazon or a general grant) shows them in checkout as a stacked list of dotted rows with a square marker. The first is preselected, and the chosen row goes solid in the shelf hue. Physical items add "Ships to the address on your Hack Club account." to the fine print.
- **Suggest an item:** the last tile of every view is a dashed Pumpkin Ink tile ("Suggest an item", a plus icon, one line of hint) instead of a product. It opens a form in the side panel in place of checkout: what it is, an optional link, an optional why, and "Send suggestion". The person's last five suggestions sit under the form with their status (Waiting, Added in Candle Core, Not this time) and the admin's note.
- **Side panel:** sticky beside the grid (below it at ≤1000px). Empty: "Pick something". Selected: name, description, price (price-lg, 32px), a 20-cell meter, then either the one detail it needs plus "Spend N Pumpkins", or how many Pumpkins and hours are still needed with a link to Projects. Your orders sit beneath it, compact.

