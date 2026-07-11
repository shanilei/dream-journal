"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_SESSION_KEY } from "./OnboardingScreen";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

export default function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    let seen = true;
    try {
      // Cookie is the durable signal (also what the root page checks
      // server-side); sessionStorage is kept as a fallback so users who
      // onboarded before the cookie existed aren't sent through it again
      // mid-session.
      const hasCookie = document.cookie
        .split("; ")
        .some((c) => c === `${ONBOARDING_COOKIE}=1`);
      seen = hasCookie || sessionStorage.getItem(ONBOARDING_SESSION_KEY) === "1";
    } catch {
      // private browsing or storage disabled — skip onboarding rather than block entry
    }
    if (!seen) router.replace("/onboarding");
  }, [router]);

  return null;
}
