import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/room/", "/game/", "/join/"] },
    sitemap: "https://gamespump.onrender.com/sitemap.xml",
  };
}
