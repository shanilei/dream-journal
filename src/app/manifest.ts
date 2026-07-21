import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lucid — Dream Journal",
    short_name: "Lucid",
    description: "A quiet place to remember your dreams.",
    start_url: "/",
    display: "standalone",
    background_color: "#090A13",
    theme_color: "#090A13",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
