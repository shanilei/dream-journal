"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const IDLE_REDIRECT_MS = 60000;
const HOME_PATH = "/record";

// Paths where an idle visitor should NOT get bounced home: the home
// screen itself (nothing to do), onboarding/sign-in (mid pre-app flow,
// not "idle in the app"), and the OAuth callback (not even a real page).
const EXCLUDED_PREFIXES = ["/record", "/onboarding", "/signin", "/auth"];

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Kiosk/exhibition behavior: if nobody touches the app for a full minute
// on any screen other than the home (record) screen itself, send them
// back there — so the next visitor always finds the "add a dream" screen
// instead of wherever the previous person left off (gallery, settings, a
// specific dream's detail view, etc).
export default function IdleHomeRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function clear() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    if (isExcluded(pathname)) {
      clear();
      return;
    }

    function reset() {
      clear();
      timerRef.current = window.setTimeout(() => {
        router.push(HOME_PATH);
      }, IDLE_REDIRECT_MS);
    }

    reset();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart", "wheel", "scroll"];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    return () => {
      clear();
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [pathname, router]);

  return null;
}
