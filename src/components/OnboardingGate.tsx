"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ONBOARDING_SESSION_KEY } from "./OnboardingScreen";

export default function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    let seen = true;
    try {
      seen = sessionStorage.getItem(ONBOARDING_SESSION_KEY) === "1";
    } catch {
      // private browsing or storage disabled — skip onboarding rather than block entry
    }
    if (!seen) router.replace("/onboarding");
  }, [router]);

  return null;
}
