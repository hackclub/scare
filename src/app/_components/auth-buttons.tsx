import { redirect } from "next/navigation";

import { authConfigured, signIn, signOut } from "~/server/auth";
import { ArrowRight } from "./icons";

export function SignInButton({
  children = "Sign in with Hack Club",
  variant = "primary",
  className = "",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "ghost" | "hud";
  className?: string;
}) {
  return (
    <form
      className={className}
      action={async () => {
        "use server";
        if (!authConfigured) redirect("/?signin=unavailable#top");
        await signIn("hackclub", { redirectTo: "/haunt" });
      }}
    >
      <button type="submit" className={`btn btn-${variant}`}>
        <span>{children}</span>
        {variant !== "hud" && <ArrowRight className="btn-icon" />}
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className="btn btn-hud">
        Sign out
      </button>
    </form>
  );
}
