import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const THEME_INIT_SCRIPT = `
  try {
    var t = localStorage.getItem("dream-journal-theme");
    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");
  } catch (e) {}
`;

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-urbanist",
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
      </head>
      <body className={urbanist.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
