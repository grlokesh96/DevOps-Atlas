import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { slugify, CONTENT_TYPES, TYPE_META } from "@/lib/meta";
import { saveContent, slugExists, DEFAULT_AUTHOR } from "@/lib/store";
import type { ContentFormInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let input: ContentFormInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!CONTENT_TYPES.includes(input.type)) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
  }
  if (!input.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!input.body?.trim()) {
    return NextResponse.json({ error: "Content body is required" }, { status: 400 });
  }

  const slug = slugify(input.title);
  if (!slug) return NextResponse.json({ error: "Title produces an empty slug" }, { status: 400 });
  if (slugExists(input.type, slug)) {
    return NextResponse.json(
      { error: `An item with slug "${slug}" already exists in ${TYPE_META[input.type].label}` },
      { status: 409 },
    );
  }

  saveContent({
    ...input,
    title: input.title.trim(),
    author: input.author?.trim() || DEFAULT_AUTHOR,
    tags: Array.isArray(input.tags) ? input.tags.map(String).filter(Boolean) : [],
    status: input.status === "published" ? "published" : "draft",
    date: input.date || new Date().toISOString().slice(0, 10),
    slug,
  });

  revalidatePath("/", "layout");
  return NextResponse.json({
    ok: true,
    slug,
    route: `/${TYPE_META[input.type].route}/${slug}`,
  });
}
