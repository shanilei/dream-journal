import type { NavKey } from "@/components/BottomNav";

// Which tab (if any) BottomNav should show as active for a given route —
// null means "no nav on this screen" (onboarding, sign-in, the typed-
// dream flow). Kept as one small pure function so GlobalBottomNav stays
// a thin usePathname() -> props mapping.
export function bottomNavKeyForPath(pathname: string): NavKey | null {
  if (pathname === "/record") return "record";
  if (pathname === "/gallery") return "dreams";
  if (pathname.startsWith("/dream/")) return "dreams";
  if (pathname.startsWith("/type/")) return "dreams";
  if (pathname === "/user") return "user";
  return null;
}
