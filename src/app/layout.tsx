import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Martian_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";

import { TabHaunt } from "./_components/tab-haunt";

const TITLE = "Scare - Make a horror game, get games, candy, and more!";
const DESCRIPTION =
  "Make a horror game and ship it before Halloween. Every hour you put in earns 10 Pumpkins, which you can trade for Steam games, candy and more. A Hack Club YSWS.";
/** The link preview card: the carved lantern beside the glyph wordmark (public/og.png, 1200x630). */
const CARD = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Scare: a carved ASCII jack-o'-lantern beside the Scare wordmark. Make a horror game, get games, candy, and more.",
};

export const metadata: Metadata = {
  // Link previews need absolute image URLs.
  metadataBase: new URL(process.env.AUTH_URL ?? "https://scare.hackclub.com"),
  title: TITLE,
  description: DESCRIPTION,
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  openGraph: {
    type: "website",
    siteName: "Scare",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    images: [CARD],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [CARD],
  },
};

export const viewport: Viewport = {
  themeColor: "#070504",
  colorScheme: "dark",
};

const departure = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-martian",
  display: "swap",
});

const CONTRACT = `<!--
THESIS: Scare is a jack-o'-lantern rendered live in typewriter glyphs, watching the visitor. It refuses the fog, bats and dripping-font Halloween landing page.
OWN-WORLD: One pumpkin ink on warm black; tone is glyph density from '.' to '@', the candle core the only near-white. Departure Mono HUD, Martian Mono body, 5x7 bitmap display type built from characters, dotted 1px frames, density-filled buttons.
STORY: A pumpkin turns to look at you. You learn the deal: make a horror game, ship it by Oct 31, earn Pumpkins, spend them on Steam games. You sign in with Hack Club and register your game.
FIRST VIEWPORT: HUD bar with countdown and sign-in. Left: glyph SCARE, the deal in one sentence, primary Sign in with Hack Club. Right: full-height live lantern that tracks the cursor; click recarves.
FORM: Glyph Lantern (live ASCII scene), dealt challenger chosen over assigned #3; seed d394ebf7.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${departure.variable} ${martian.variable}`}>
      <body>
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* The tRPC client lives in the platform and welcome routes, which are the only ones
            that use it, so the landing and sign-in pages don't ship it. */}
        {children}
        <TabHaunt />
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          src="https://plausible.io/js/pa-EDIlJn6pUM_C-atCV4RL_.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
        </Script>
      </body>
    </html>
  );
}
