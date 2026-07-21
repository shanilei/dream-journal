import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucid — Dream Journal",
    short_name: "Lucid",
    description: "A quiet place to remember your dreams.",
    start_url: "/",
    display: "standalone",
    // Matches the loader's actual background (#050A1A, not --bg-base) —
    // iOS generates the PWA launch screen from this color when no
    // apple-touch-startup-image is provided, so a mismatch here was
    // exactly why the launch screen read as a plain white flash instead
    // of blending into the app.
    background_color: "#050A1A",
    theme_color: "#050A1A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
