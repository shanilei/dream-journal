import type { Metadata } from "next";
import { Urbanist, Alumni_Sans } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { PhotoBorderProvider } from "@/components/PhotoBorderProvider";
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
});

const alumniSans = Alumni_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-alumni-sans",
});

export const metadata: Metadata = {
  title: "Lucid — Dream Journal",
  description: "Record your dreams and let Lucid interpret them.",
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
      <body className={`${urbanist.variable} ${alumniSans.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <PhotoBorderProvider>{children}</PhotoBorderProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
