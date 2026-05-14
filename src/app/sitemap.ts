import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://routeworth.com/",
      lastModified: new Date("2026-05-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
