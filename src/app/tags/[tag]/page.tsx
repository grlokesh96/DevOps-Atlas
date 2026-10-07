import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCard from "@/components/ContentCard";
import { getContentByTag, getTagCounts, slugify } from "@/lib/content";

export function generateStaticParams() {
  return getTagCounts().map(([tag]) => ({ tag: slugify(tag) }));
}

export const revalidate = 15;

function findTag(param: string): string | undefined {
  return getTagCounts().find(([tag]) => slugify(tag) === param)?.[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const name = findTag(tag);
  if (!name) return { title: "Tag not found" };
  return {
    title: `#${name}`,
    description: `All DevOps-Atlas content tagged with #${name}.`,
    alternates: { canonical: `/tags/${tag}` },
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: param } = await params;
  const name = findTag(param);
  if (!name) notFound();

  const items = getContentByTag(name);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Tag</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">#{name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </header>

      {items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={`${item.type}-${item.slug}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-300">Nothing tagged #{name} yet</p>
          <p className="mt-1 text-sm text-slate-500">Browse all tags to explore other topics.</p>
        </div>
      )}
    </div>
  );
}
