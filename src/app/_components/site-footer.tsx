import { LINKS } from "~/lib/program";
import { ArrowUpRight, Heart } from "./icons";

function Help() {
  return (
    <a href={LINKS.slackChannel} className="foot-help" target="_blank" rel="noreferrer">
      <span className="foot-help-tag">Help</span>
      <span>
        Stuck? Ask in <strong>#scare</strong> on Slack
      </span>
      <ArrowUpRight className="link-icon" />
    </a>
  );
}

function Byline() {
  return (
    <p className="foot-byline">
      Made with <Heart className="foot-heart" title="love" /> by Barnav
    </p>
  );
}

/** The footer on every page. `compact` drops the legal row, for the sign-in screen. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <footer className="foot foot-compact">
        <Help />
        <Byline />
      </footer>
    );
  }

  return (
    <footer className="foot">
      <Help />
      <Byline />
      <p>
        Scare is a{" "}
        <a href={LINKS.hackClub} className="link">
          Hack Club
        </a>{" "}
        YSWS. Hack Club is a 501(c)(3) nonprofit.
      </p>
      <nav aria-label="Elsewhere" className="foot-links">
        <a href={LINKS.fulfillmentBounty} className="link">
          Fulfillment bounty <ArrowUpRight className="link-icon" />
        </a>
        <a href={LINKS.privacy} className="link">
          Privacy policy <ArrowUpRight className="link-icon" />
        </a>
        <a href={LINKS.terms} className="link">
          Terms of service <ArrowUpRight className="link-icon" />
        </a>
      </nav>
    </footer>
  );
}
