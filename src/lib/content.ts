import fs from "fs";
import path from "path";
import { cache } from "react";
import matter from "gray-matter";
import { Marked } from "marked";
import hljs from "highlight.js";
import type { ContentItem, ContentType, Heading, SearchEntry } from "./types";
import { CATEGORIES, CONTENT_TYPES, TYPE_META, slugify } from "./meta";

export { CATEGORIES, CONTENT_TYPES, TYPE_META, slugify };

export const CONTENT_DIR = path.join(process.cwd(), "content");

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading(token: any) {
        const id = slugify(token.text);
        headings.push({ id, text: token.text, level: token.depth });
        const inner = this.parser.parseInline(token.tokens);
        return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
      },
      code({ text, lang }: any) {
        const language = /^[a-zA-Z0-9_+-]*/.exec(lang || "")?.[0] ?? "";
        let highlighted = escapeHtml(text);
        try {
          if (language && hljs.getLanguage(language)) {
            highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
          }
        } catch {
          /* fall back to escaped text */
        }
        const label = language || "code";
        return `<pre class="code-block"><code class="hljs language-${escapeHtml(language)}" data-lang="${escapeHtml(label)}">${highlighted}</code></pre>\n`;
      },
    },
  });
  const html = marked.parse(markdown) as string;
  return { html, headings };
}

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function toPlain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[^\n]*\n?/g, " "))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>|-]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFile(filePath: string): ContentItem | null {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  if (data.published === false) return null;

  const dirName = path.basename(path.dirname(filePath));
  const dirType = CONTENT_TYPES.find((t) => TYPE_META[t].dir === dirName);
  if (!dirType) return null;

  const type = (data.type as ContentType) || dirType;
  const meta = TYPE_META[type] ?? TYPE_META[dirType];
  const slug = (data.slug as string) || slugify(path.basename(filePath).replace(/\.(md|mdx)$/, ""));
  const { html, headings } = renderMarkdown(content);

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    type,
    category: String(data.category ?? "General"),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    difficulty: String(data.difficulty ?? ""),
    published: data.published !== false,
    featured: Boolean(data.featured),
    date: String(data.date ?? ""),
    readingTime: readingTime(content),
    route: `/${meta.route}/${slug}`,
    body: content,
    html,
    headings,
    sourcePath: path.relative(process.cwd(), filePath),
  };
}

export const getAllContent = cache((): ContentItem[] => {
  const items: ContentItem[] = [];
  for (const type of CONTENT_TYPES) {
    const dir = path.join(CONTENT_DIR, TYPE_META[type].dir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!/\.(md|mdx)$/i.test(file)) continue;
      const item = parseFile(path.join(dir, file));
      if (item) items.push(item);
    }
  }
  return items.sort((a, b) => b.date.localeCompare(a.date));
});

export const getContentByType = cache((type: ContentType): ContentItem[] =>
  getAllContent().filter((item) => item.type === type),
);

export const getContentItem = cache((type: ContentType, slug: string): ContentItem | undefined =>
  getAllContent().find((item) => item.type === type && item.slug === slug),
);

export function resolveType(route: string): ContentType | undefined {
  return CONTENT_TYPES.find((t) => TYPE_META[t].route === route);
}

export const getStats = cache(() => {
  const items = getAllContent();
  return {
    articles: items.filter((i) => i.type === "article").length,
    notes: items.filter((i) => i.type === "note").length,
    posts: items.filter((i) => i.type === "post").length,
    labs: items.filter((i) => i.type === "lab").length,
    commands: items.filter((i) => i.type === "command").length,
    total: items.length,
  };
});

export const getCategoryCounts = cache(() => {
  const counts = new Map<string, number>();
  for (const item of getAllContent()) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return counts;
});

export const getContentByCategory = cache((category: string) =>
  getAllContent().filter((item) => item.category === category),
);

export const getTagCounts = cache(() => {
  const counts = new Map<string, number>();
  for (const item of getAllContent()) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
});

export const getContentByTag = cache((tag: string) =>
  getAllContent().filter((item) => item.tags.some((t) => t.toLowerCase() === tag.toLowerCase())),
);

export const getRelated = cache((item: ContentItem, limit = 3): ContentItem[] => {
  const itemTags = new Set(item.tags.map((t) => t.toLowerCase()));
  return getAllContent()
    .filter((c) => c.slug !== item.slug || c.type !== item.type)
    .map((c) => ({
      c,
      score:
        (c.category === item.category ? 2 : 0) +
        c.tags.filter((t) => itemTags.has(t.toLowerCase())).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.c.date.localeCompare(a.c.date))
    .slice(0, limit)
    .map(({ c }) => c);
});

export const getSearchIndex = cache((): SearchEntry[] =>
  getAllContent().map((item) => ({
    slug: item.slug,
    route: item.route,
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    tags: item.tags,
    text: toPlain(item.body).slice(0, 4000),
  })),
);

export function paginate<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    items: items.slice((current - 1) * perPage, current * perPage),
    page: current,
    totalPages,
    total: items.length,
  };
}
