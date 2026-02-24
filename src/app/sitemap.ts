import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

const corePaths = [
  "/",
  "/private-van-hire-siargao",
  "/airport-transfer-siargao",
  "/land-tours-siargao",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return corePaths.map((path, index) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8,
  }));
}
