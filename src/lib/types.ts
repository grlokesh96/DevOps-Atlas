export type ContentType =
  | "article"
  | "blog"
  | "note"
  | "post"
  | "lab"
  | "troubleshooting"
  | "command"
  | "interview";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface ContentMeta {
  slug: string;
  title: string;
  description: string;
  type: ContentType;
  category: string;
  tags: string[];
  difficulty: string;
  published: boolean;
  featured: boolean;
  author: string;
  cover: string;
  date: string;
  readingTime: number;
  route: string;
}

export interface ContentItem extends ContentMeta {
  body: string;
  html: string;
  headings: Heading[];
  sourcePath: string;
}

export interface SearchEntry {
  slug: string;
  route: string;
  title: string;
  description: string;
  type: ContentType;
  category: string;
  tags: string[];
  text: string;
}

export interface UploadMeta {
  name: string;
  originalName: string;
  kind: "txt" | "pdf";
  size: number;
  title: string;
  preview: string;
  uploadedAt: string;
}

export interface ContentFormInput {
  type: ContentType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  cover: string;
  body: string;
  status: "draft" | "published";
  date: string;
  difficulty?: string;
  slug?: string;
}
