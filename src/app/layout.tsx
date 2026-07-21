import type { Metadata, Viewport } from "next";
import { Urbanist, Alumni_Sans } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PhotoBorderProvider } from "@/components/PhotoBorderProvider";
import AppBackground from "@/components/AppBackground";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("dream-journal-theme");
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
  } catch (e) {}
`;

const LANG_INIT_SCRIPT = `
  try {
    var l = localStorage.getItem("dream-journal-lang");
    var lang = l === "he" ? "he" : "en";
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "he" ? "rtl" : "ltr");
  } catch (e) {}
`;

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-urbanist",
  // Next's default ("swap") shows a fallback font first and swaps to
  // Urbanist once it's ready — visible on the loader (and everywhere
  // else) as a brief flash/reflow. "optional" only ever uses Urbanist if
  // it's already loaded in time for the very first paint; otherwise it
  // sticks with the fallback for that render instead of swapping in
  // later, so there's never a visible font jump either way.
  display: "optional",
});

const alumniSans = Alumni_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-alumni-sans",
});

const ploni = localFont({
  src: [
    { path: "../../font/ploni-regular-aaa.otf", weight: "400" },
    { path: "../../font/ploni-medium-aaa.otf", weight: "500" },
    { path: "../../font/ploni-demibold-aaa.otf", weight: "600" },
  ],
  variable: "--font-ploni",
  // Same reasoning as Urbanist above — no visible swap either direction.
  display: "optional",
});

export const metadata: Metadata = {
  title: "Lucid — Dream Journal",
  description: "Record your dreams and let Lucid interpret them.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lucid",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Matches manifest.ts's background_color — same loader background, not
  // --bg-base, so the browser/status-bar chrome tint agrees with what's
  // actually painted underneath it.
  themeColor: "#050A1A",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="lang-init" strategy="beforeInteractive">
          {LANG_INIT_SCRIPT}
        </Script>
      </head>
      <body className={`${urbanist.variable} ${alumniSans.variable} ${ploni.variable}`}>
        <AppBackground />
        <ThemeProvider>
          <LanguageProvider>
            {/* Onboarding gating now happens in middleware.ts (server-side,
                before any page renders) instead of a client-side effect
                here — that used to leave a window between paint and the
                redirect firing where an unonboarded user could see/touch
                the real app underneath. */}
            <PhotoBorderProvider>{children}</PhotoBorderProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
