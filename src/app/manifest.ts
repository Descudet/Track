import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Track - Cinéma & Séries",
    short_name: "Track",
    description: "Votre cinémathèque personnelle élégante sur iPhone",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#050507",
    theme_color: "#050507",
    orientation: "portrait",
    categories: ["entertainment", "movies"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
