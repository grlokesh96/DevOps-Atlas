import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CONTENT_DIR, TYPE_META } from "./content";
import { slugify } from "./meta";
import type { ContentFormInput, ContentType, UploadMeta } from "./types";

export const UPLOAD_DIR = path.join(CONTENT_DIR, "uploads");
const MANIFEST_PATH = path.join(UPLOAD_DIR, "manifest.json");

export const DEFAULT_AUTHOR = "DevOps-Atlas";

export function contentFilePath(type: ContentType, slug: string): string {
  return path.join(CONTENT_DIR, TYPE_META[type].dir, `${slug}.md`);
}

function frontmatterFrom(input: ContentFormInput): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    type: input.type,
    category: input.category,
    tags: input.tags,
  };
  if (input.difficulty) data.difficulty = input.difficulty;
  data.author = input.author || DEFAULT_AUTHOR;
  if (input.cover) data.cover = input.cover;
  data.published = input.status === "published";
  data.date = input.date || new Date().toISOString().slice(0, 10);
  return data;
}

export function saveContent(input: ContentFormInput & { slug: string }): string {
  const filePath = contentFilePath(input.type, input.slug);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const data = frontmatterFrom(input);
  const doc = matter.stringify(`${input.body.trim()}\n`, data);
  fs.writeFileSync(filePath, doc, "utf8");
  return filePath;
}

export function readRawContent(type: ContentType, slug: string): { data: any; content: string } {
  const filePath = contentFilePath(type, slug);
  if (!fs.existsSync(filePath)) throw new Error("Content not found");
  return matter(fs.readFileSync(filePath, "utf8"));
}

export function updateContent(
  type: ContentType,
  slug: string,
  patch: Partial<ContentFormInput> & { published?: boolean },
): void {
  const { data, content } = readRawContent(type, slug);
  const next: Record<string, unknown> = { ...data };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.category !== undefined) next.category = patch.category;
  if (patch.tags !== undefined) next.tags = patch.tags;
  if (patch.author !== undefined) next.author = patch.author;
  if (patch.cover !== undefined) next.cover = patch.cover;
  if (patch.date !== undefined) next.date = patch.date;
  if (patch.difficulty !== undefined) next.difficulty = patch.difficulty;
  if (patch.status !== undefined) {
    next.published = patch.status === "published";
  } else if (typeof patch.published === "boolean") {
    next.published = patch.published;
  }
  const body = patch.body ?? content;
  const doc = matter.stringify(`${body.trim()}\n`, next);
  fs.writeFileSync(contentFilePath(type, slug), doc, "utf8");
}

export function deleteContent(type: ContentType, slug: string): void {
  const filePath = contentFilePath(type, slug);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function slugExists(type: ContentType, slug: string): boolean {
  return fs.existsSync(contentFilePath(type, slug));
}

/* ---------------- uploads ---------------- */

export function listUploads(): UploadMeta[] {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as UploadMeta[];
  } catch {
    return [];
  }
}

function writeManifest(records: UploadMeta[]): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(records, null, 2), "utf8");
}

export function sanitizeFilename(name: string): string {
  return path
    .basename(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "");
}

export function saveUploadedFile(originalName: string, bytes: Uint8Array, preview: string): UploadMeta {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = sanitizeFilename(originalName);
  const isPdf = name.endsWith(".pdf");
  const prefixed = `devops-atlas-${name.replace(/^(devops-atlas-)?/, "")}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, prefixed), bytes);
  const meta: UploadMeta = {
    name: prefixed,
    originalName,
    kind: isPdf ? "pdf" : "txt",
    size: bytes.byteLength,
    title: originalName.replace(/\.[^.]+$/, ""),
    preview,
    uploadedAt: new Date().toISOString(),
  };
  writeManifest([meta, ...listUploads().filter((m) => m.name !== prefixed)]);
  return meta;
}

export function uploadFilePath(name: string): string | null {
  const safe = path.basename(name);
  const filePath = path.join(UPLOAD_DIR, safe);
  if (!filePath.startsWith(UPLOAD_DIR + path.sep)) return null;
  return fs.existsSync(filePath) ? filePath : null;
}
