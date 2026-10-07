import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { CONTENT_TYPES, TYPE_META } from "@/lib/meta";
import { resolveType } from "@/lib/content";
import { deleteContent, readRawContent, updateContent } from "@/lib/store";
import type { ContentFormInput, ContentType } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolve(type: string): ContentType | undefined {
  if (CONTENT_TYPES.includes(type as ContentType)) return type as ContentType;
  return resolveType(type);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type: typeParam, slug } = await params;
  const type = resolve(typeParam);
  if (!type || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid content address" }, { status: 400 });
  }

  let patch: Partial<ContentFormInput>;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    updateContent(type, slug, patch);
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, route: `/${TYPE_META[type].route}/${slug}` });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type: typeParam, slug } = await params;
  const type = resolve(typeParam);
  if (!type || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid content address" }, { status: 400 });
  }

  try {
    readRawContent(type, slug);
  } catch {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  deleteContent(type, slug);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
