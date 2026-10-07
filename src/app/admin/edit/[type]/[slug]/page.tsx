import { notFound } from "next/navigation";
import ContentEditor from "@/components/admin/ContentEditor";
import type { ContentType } from "@/lib/types";
import { CONTENT_TYPES, TYPE_META, getAllContentAdmin, resolveType } from "@/lib/content";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type: typeParam, slug } = await params;
  const type = CONTENT_TYPES.includes(typeParam as ContentType)
    ? (typeParam as ContentType)
    : resolveType(typeParam);
  if (!type) notFound();

  const item = getAllContentAdmin().find((i) => i.type === type && i.slug === slug);
  if (!item) notFound();

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Editing{" "}
        <span className="font-medium text-slate-300">
          {TYPE_META[item.type].singular} · {item.title}
        </span>{" "}
        — changes to frontmatter and Markdown are preserved on save.
      </p>
      <ContentEditor
        mode="edit"
        editKey={{ type: item.type, slug: item.slug }}
        initial={{
          type: item.type,
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags,
          author: item.author,
          cover: item.cover,
          body: item.body,
          status: item.published ? "published" : "draft",
          date: item.date,
          difficulty: item.difficulty,
        }}
      />
    </div>
  );
}
