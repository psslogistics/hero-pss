import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://psslogistics.in", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://psslogistics.in/privacy", lastModified: new Date("2026-09-20"), changeFrequency: "yearly", priority: 0.4 },
    { url: "https://psslogistics.in/terms", lastModified: new Date("2026-09-20"), changeFrequency: "yearly", priority: 0.4 },
  ];
}
