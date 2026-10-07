import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCard from "@/components/ContentCard";
import Pagination from "@/components/Pagination";
import { CONTENT_TYPES, TYPE_META, getContentByType, paginate, resolveType } from "@/lib/content";
import type { ContentType } from "@/lib/types";

const PER_PAGE = 6;

export function generateStaticParams() {
  return CONTENT_TYPES.map((type) => ({ type: TYPE_META[type].route }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}): Promise<Metadata> {
  const { type: route } = await params;
  const type = resolveType(route);
  if (!type) return {};
  const meta = TYPE_META[type];
  return {
    title: meta.label,
    description: meta.description,
    alternates: { canonical: `/${route}` },
    openGraph: {
      title: `${meta.label} — DevOps-Atlas`,
      description: meta.description,
      url: `/${route}`,
      type: "website",
    },
  };
}

export default async function ContentListPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type: route } = await params;
  const { page: pageParam } = await searchParams;

  const type = resolveType(route);
  if (!type) notFound();

  const meta = TYPE_META[type];
  const all = getContentByType(type as ContentType);
  const { items, page, totalPages, total } = paginate(all, Number(pageParam) || 1, PER_PAGE);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Browse</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{meta.label}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{meta.description}</p>
        <p className="mt-3 text-xs text-slate-500">
          {total} {total === 1 ? "item" : "items"}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>
      </header>

      {items.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ContentCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-300">No content here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Items will appear as soon as they are published.
          </p>
        </div>
      )}

      <Pagination basePath={`/${route}`} page={page} totalPages={totalPages} />
    </div>
  );
}
