import { MetadataRoute } from "next";
import { GAMES } from "@/lib/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const gamePages: MetadataRoute.Sitemap = GAMES.map((game) => ({
    url: `https://gamespump.onrender.com/games/${game.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: "https://gamespump.onrender.com", lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...gamePages,
    { url: "https://gamespump.onrender.com/stats", lastModified: now, changeFrequency: "weekly", priority: 0.3 },
  ];
}
