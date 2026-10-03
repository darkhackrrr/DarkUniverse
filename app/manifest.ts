import type { MetadataRoute } from "next";
import { siteConfig, navLinks } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0c",
    theme_color: "#0a0a0c",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["utilities", "productivity", "games"],
    shortcuts: navLinks.slice(0, 4).map((link) => ({
      name: link.label,
      url: link.href,
    })),
  };
}
