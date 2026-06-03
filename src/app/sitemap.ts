import type { MetadataRoute } from "next";
import { getPublicAppUrl, publicAppPath } from "@/lib/appUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: getPublicAppUrl(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: publicAppPath("/privacidade"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: publicAppPath("/termos"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
