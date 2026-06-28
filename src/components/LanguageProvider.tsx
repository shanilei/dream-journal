"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Lang, type TranslationKey } from "@/i18n/translations";

const STORAGE_KEY = "dream-journal-lang";

const LanguageContext = createContext<{
  lang: Lang;
  toggleLang: () => void;
  t: Record<TranslationKey, string>;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start at "en" so the client's first render matches the
  // server-rendered HTML exactly — avoids a hydration mismatch. The
  // beforeInteractive init script already set the real dir/lang
  // attributes on <html>, so this effect just syncs React's state to
  // match what's already on screen, right after mount.
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const initial = document.documentElement.getAttribute("dir") === "rtl" ? "he" : "en";
    setLang(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "he" ? "rtl" : "ltr");
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  function toggleLang() {
    setLang((l) => (l === "en" ? "he" : "en"));
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
