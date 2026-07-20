"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "./LanguageProvider";
import OnboardingBackground from "./onboarding/OnboardingBackground";
import { AppleIcon, GoogleIcon } from "./Icons";
import styles from "./SignInScreen.module.css";

type Provider = "apple" | "google";

export default function SignInScreen() {
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const hadError = searchParams.get("error") === "1";
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  async function handleSignIn(provider: Provider) {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    const supabase = createClient();
    // redirectTo is derived from window.location.origin, not hardcoded —
    // this is what makes the same code correctly return to localhost in
    // dev and the real Vercel domain in production without an env var or
    // config value to keep in sync. /auth/callback (see that route)
    // exchanges the code and lands on /gallery by default.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/gallery` },
    });
    if (error) setLoadingProvider(null);
    // On success the browser is about to navigate away to the provider's
    // own sign-in page, so there's nothing further to do here.
  }

  return (
    <div className={styles.screen} dir={lang === "he" ? "rtl" : "ltr"}>
      <OnboardingBackground />
      <div className={styles.content}>
        <div className={styles.logoWindow}>
          <img src="/images/onboarding/lucid-logo.png" alt="Lucid" className={styles.logo} />
        </div>

        {/* Text + buttons are one Figma group (node 1699:26067) — a 20px
            gap between them, distinct from the larger gap separating the
            logo above from this whole group. */}
        <div className={styles.group}>
          <div className={styles.textBlock}>
            <p className={styles.subtitle}>
              {t.signInSubtitleBefore}
              <span className={styles.subtitleAccent}>{t.signInSubtitleAccent}</span>
              {t.signInSubtitleAfter}
            </p>
            <p className={styles.explainer}>{t.signInExplainer}</p>
          </div>

          {hadError && <p className={styles.error}>{t.signInError}</p>}

          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.cta}
              onClick={() => handleSignIn("apple")}
              disabled={loadingProvider !== null}
            >
              <span className={styles.ctaIcon}>
                <AppleIcon size={18} />
              </span>
              <span className={styles.ctaLabel}>{t.signInWithApple}</span>
            </button>
            <button
              type="button"
              className={styles.cta}
              onClick={() => handleSignIn("google")}
              disabled={loadingProvider !== null}
            >
              <span className={styles.ctaIcon}>
                <GoogleIcon size={18} />
              </span>
              <span className={styles.ctaLabel}>{t.signInWithGoogle}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
