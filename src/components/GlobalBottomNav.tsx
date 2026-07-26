"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import { useBottomNavVisibilityState } from "./BottomNavVisibility";
import { bottomNavKeyForPath } from "@/lib/bottomNavForPath";

// The one and only BottomNav instance for the whole app — mounted once in
// the root layout (outside {children}), so it never unmounts/remounts as
// routes change. Individual screens used to each render their own
// <BottomNav>, which meant a fresh instance (and a fresh mount) on every
// single navigation between them — the actual cause of the nav visibly
// jumping/flashing on every tap, not any one screen's animation. Screens
// now just report their desired hidden/dimmed state via the hooks in
// BottomNavVisibility.tsx instead of rendering BottomNav themselves.
export default function GlobalBottomNav() {
  const pathname = usePathname();
  const { hidden, dimmed } = useBottomNavVisibilityState();
  const active = bottomNavKeyForPath(pathname);
  if (!active) return null;
  return <BottomNav active={active} hidden={hidden} dimmed={dimmed} />;
}
