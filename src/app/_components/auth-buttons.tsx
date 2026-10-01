import { redirect } from "next/navigation";

import { authConfigured, signIn, signOut } from "~/server/auth";
import { ArrowRight } from "./icons";

export function SignInButton({
  children = "Sign in with Hack Club",
  variant = "primary",
  className = "",
  redirectTo = "/platform",
}: {
  children?: React.ReactNode;
  variant?: "primary" | "ghost" | "hud";
  className?: string;
  /** Where to land after sign-in. Only same-site paths are honored. */
  redirectTo?: string;
}) {
  const target = redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/platform";
  return (
    <form
      className={className}
      action={async () => {
        "use server";
        if (!authConfigured) redirect("/login?error=Unconfigured");
        await signIn("hackclub", { redirectTo: target });
      }}
    >
      <button type="submit" className={`btn btn-${variant}`}>
        <span>{children}</span>
        {variant !== "hud" && <ArrowRight className="btn-icon" />}
      </button>
    </form>
  );
}

export function SignOutButton({
  variant = "hud",
  className = "",
}: {
  variant?: "hud" | "ghost";
  className?: string;
}) {
  return (
    <form
      className={className}
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit" className={`btn btn-${variant}`}>
        Sign out
      </button>
    </form>
  );
}
