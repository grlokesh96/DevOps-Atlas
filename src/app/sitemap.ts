import type { MetadataRoute } from "next";
import {
  CATEGORIES,
  CONTENT_TYPES,
  TYPE_META,
  getAllContent,
  getTagCounts,
  slugify,
} from "@/lib/content";

const SITE_URL = process.env.SITE_URL || "https://devops-atlas.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/about",
    "/search",
    "/categories",
    "/tags",
    ...CONTENT_TYPES.map((type) => `/${TYPE_META[type].route}`),
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));

  const contentRoutes: MetadataRoute.Sitemap = getAllContent().map((item) => ({
    url: `${SITE_URL}${item.route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${SITE_URL}/categories/${slugify(category)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = getTagCounts().map(([tag]) => ({
    url: `${SITE_URL}/tags/${slugify(tag)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...contentRoutes, ...categoryRoutes, ...tagRoutes];
}
