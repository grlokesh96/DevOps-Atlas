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
