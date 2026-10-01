export const NAV = [
  { href: "/platform", label: "Home", segment: "home" },
  { href: "/platform/projects", label: "Projects", segment: "projects" },
  { href: "/platform/shop", label: "Shop", segment: "shop" },
  { href: "/platform/profile", label: "Profile", segment: "profile" },
] as const;

export function activeItem(pathname: string) {
  return (
    [...NAV].reverse().find((n) =>
      n.href === "/platform" ? pathname === "/platform" : pathname.startsWith(n.href),
    ) ?? NAV[0]
  );
}
