"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";

const STORAGE_KEY = "dream-journal-lang";

// The actual generated @font-face family names (see next/font's compiled
// output in layout.tsx). Every Ploni-rendered element that needs this
// happens to use weight 400; English's onboarding heading needs 500, its
// CTA needs 400 — Urbanist is otherwise already used everywhere in the
// app and typically warm/cached, so this mostly matters for Ploni.
function fontSpecsFor(lang: Lang): string[] {
  return lang === "he" ? ["400 16px ploni"] : ["500 16px Urbanist", "400 16px Urbanist"];
}

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: Record<TranslationKey, string>;
  // True once `lang` has been synced from the DOM at least once.
  // Consumers that render language-dependent text before a user has
  // ever seen it (the onboarding language picker, specifically) should
  // wait for this instead of showing the "en" default and correcting
  // visibly a moment later.
  resolved: boolean;
  // True once the font(s) the *current* lang needs are loaded. Kicked
  // off from here — the moment `resolved` is true, i.e. at app mount —
  // rather than waiting for any specific screen to mount, so a slow
  // Ploni fetch has the whole splash-screen duration to finish in the
  // background instead of showing up later as a late, isolated entrance
  // animation on whichever screen first needs it.
  fontReady: boolean;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start at "en" so the client's first render matches the
  // server-rendered HTML exactly — avoids a hydration mismatch. The
  // beforeInteractive init script already set the real dir/lang
  // attributes on <html>, so this effect just syncs React's state to
  // match what's already on screen. useLayoutEffect (not useEffect) so
  // that sync happens before the browser paints the hydrated frame —
  // the "en" default above is never actually visible on screen when the
  // saved language is "he", instead of flashing English and correcting
  // a frame later.
  const [lang, setLangState] = useState<Lang>("en");
  const [resolved, setResolved] = useState(false);
  const [fontReady, setFontReady] = useState(false);
  // Tracks which languages already have a load in flight (or done) so a
  // re-render — or switching back to a language already loaded earlier
  // — never fires a duplicate document.fonts.load() call.
  const requestedFontsRef = useRef<Set<Lang>>(new Set());

  useLayoutEffect(() => {
    const initial = document.documentElement.getAttribute("dir") === "rtl" ? "he" : "en";
    setLangState(initial);
    setResolved(true);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "he" ? "rtl" : "ltr");
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    if (!resolved) return;
    if (typeof document === "undefined" || !("fonts" in document)) {
      setFontReady(true);
      return;
    }
    if (requestedFontsRef.current.has(lang)) {
      // Already requested for this language (either still loading, or
      // already resolved once before, e.g. switching back to it) —
      // nothing new to kick off.
      setFontReady(document.fonts.check(fontSpecsFor(lang)[0]));
      return;
    }
    requestedFontsRef.current.add(lang);
    setFontReady(false);
    let cancelled = false;
    Promise.all(fontSpecsFor(lang).map((spec) => document.fonts.load(spec)))
      .catch(() => {
        // Font Loading API rejected (e.g. a genuinely missing font) —
        // don't get stuck; treat as ready.
      })
      .then(() => {
        if (!cancelled) setFontReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [resolved, lang]);

  function toggleLang() {
    setLangState((l) => (l === "en" ? "he" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, toggleLang, t: translations[lang], resolved, fontReady }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
