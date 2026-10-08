import type { MetadataRoute } from "next";

// Lets phones add FinGuard to the home screen, from where it opens full-screen
// (standalone) in the app's dark colours. Served at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FinGuard",
    short_name: "FinGuard",
    description: "Don't just detect the scam. Know what to do next.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Full-bleed, with the shield inside the safe zone that Android's icon shapes keep.
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
