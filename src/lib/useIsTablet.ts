"use client";

import { useEffect, useState } from "react";

// Matches the CSS tablet breakpoint (see the "TABLET / IPAD" block in each
// screen's module.css) — kept in sync manually since CSS can't reference a
// JS constant. Two comma-branches cover both iPad orientations: portrait
// (short side >= 768, long side >= 900) and landscape (the same two
// thresholds with width/height swapped) — a plain `min-width/min-height`
// pair alone would fail landscape, since e.g. a 1024x768 iPad has a
// height under 900. `any-pointer: coarse` (not `pointer: coarse`) so an
// iPad with an attached trackpad/keyboard — which makes the trackpad the
// *primary* pointer, reporting `pointer: fine` — still counts, since its
// touchscreen remains present as a secondary pointer. No user-agent
// sniffing.
const TABLET_QUERY =
  "((min-width: 768px) and (min-height: 900px) and (any-pointer: coarse)), " +
  "((min-width: 900px) and (min-height: 768px) and (any-pointer: coarse))";

// Client-only signal for screens that need real structural/JSX branching,
// not just CSS overrides — most screens should prefer the CSS media query
// directly (no hydration flash, works before JS loads). Defaults to false
// during SSR/first paint to avoid a hydration mismatch.
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(TABLET_QUERY);
    setIsTablet(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isTablet;
}
