import { NextResponse } from "next/server";
import matter from "gray-matter";
import { slugify } from "@/lib/meta";
import { saveUploadedFile } from "@/lib/store";

export const dynamic = "force-dynamic";

const MAX_TEXT = 2 * 1024 * 1024; // 2 MB
const MAX_PDF = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["md", "mdx", "txt", "pdf"];

function ext(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const extension = ext(file.name);
  if (!ALLOWED.includes(extension)) {
    return NextResponse.json(
      { error: `Unsupported file type ".${extension}". Allowed: ${ALLOWED.join(", ")}` },
      { status: 415 },
    );
  }

  const limit = extension === "pdf" ? MAX_PDF : MAX_TEXT;
  if (file.size > limit) {
    const mb = Math.round(limit / (1024 * 1024));
    return NextResponse.json({ error: `File too large (max ${mb} MB)` }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (extension === "md" || extension === "mdx") {
    const raw = new TextDecoder().decode(bytes);
    const { data, content } = matter(raw);
    const firstHeading = /^#\s+(.+)$/m.exec(content)?.[1];
    const title = String(data.title ?? firstHeading ?? file.name.replace(/\.[^.]+$/, ""));
    const body = content.replace(/^#\s+.+\n+/, "").trim();
    const firstPara = body.split(/\n\n+/).find((p) => p.trim() && !p.startsWith("#")) ?? "";
    return NextResponse.json({
      kind: "markdown",
      parsed: {
        title,
        description: String(data.description ?? firstPara.slice(0, 180)),
        type: String(data.type ?? "note"),
        category: String(data.category ?? "General"),
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        difficulty: String(data.difficulty ?? ""),
        author: String(data.author ?? ""),
        published: data.published !== false ? "published" : "draft",
        date: String(data.date ?? new Date().toISOString().slice(0, 10)),
        body,
        sourceName: file.name,
        hasFrontmatter: Object.keys(data).length > 0,
        suggestedSlug: slugify(title),
      },
    });
  }

  const preview =
    extension === "txt"
      ? new TextDecoder().decode(bytes.slice(0, 4000))
      : `PDF document · ${file.name} · ${Math.round(file.size / 1024)} KB`;

  const meta = saveUploadedFile(file.name, bytes, preview);
  return NextResponse.json({ kind: meta.kind, meta });
}
