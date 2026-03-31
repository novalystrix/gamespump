import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://gamespump.onrender.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://gamespump.onrender.com/stats", lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];
}
