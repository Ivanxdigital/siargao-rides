import type { MetadataRoute } from "next";

import { getAllBlogPosts, getBlogPostPath } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

const corePaths = [
  "/",
  "/blog",
  "/private-van-hire-siargao",
  "/airport-transfer-siargao",
  "/land-tours-siargao",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const blogPosts = getAllBlogPosts();

  const coreEntries = corePaths.map((path, index) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency:
      path === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: index === 0 ? 1 : path === "/blog" ? 0.9 : 0.8,
  }));

  const blogEntries = blogPosts.map((post) => ({
    url: absoluteUrl(getBlogPostPath(post.slug)),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...coreEntries, ...blogEntries];
}
