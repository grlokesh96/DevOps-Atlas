import type { ContentType } from "./types";

export const CATEGORIES = [
  "AWS",
  "Kubernetes",
  "Terraform",
  "Docker",
  "CI/CD",
  "DevSecOps",
  "Linux",
  "Monitoring",
  "Platform Engineering",
  "Python",
] as const;

export const TYPE_META: Record<
  ContentType,
  { dir: string; route: string; label: string; singular: string; description: string }
> = {
  article: {
    dir: "articles",
    route: "articles",
    label: "Articles",
    singular: "Article",
    description: "Long-form technical content on cloud, platforms and engineering.",
  },
  blog: {
    dir: "blogs",
    route: "blogs",
    label: "Blogs",
    singular: "Blog",
    description: "Experience, architecture, tutorials and explanations.",
  },
  note: {
    dir: "notes",
    route: "notes",
    label: "Notes",
    singular: "Note",
    description: "Short reference material for quick lookup.",
  },
  post: {
    dir: "posts",
    route: "posts",
    label: "Posts",
    singular: "Post",
    description: "Short technical updates and learnings.",
  },
  lab: {
    dir: "labs",
    route: "labs",
    label: "Labs",
    singular: "Lab",
    description: "Hands-on implementation guides you can follow end to end.",
  },
  troubleshooting: {
    dir: "troubleshooting",
    route: "troubleshooting",
    label: "Troubleshooting",
    singular: "Troubleshooting",
    description: "Problem → Diagnosis → Solution runbooks.",
  },
  command: {
    dir: "commands",
    route: "commands",
    label: "Command Atlas",
    singular: "Command",
    description: "Curated command references for everyday operations.",
  },
  interview: {
    dir: "interview",
    route: "interview",
    label: "Interview Prep",
    singular: "Interview Prep",
    description: "Interview notes, questions and model answers.",
  },
};

export const CONTENT_TYPES = Object.keys(TYPE_META) as ContentType[];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
