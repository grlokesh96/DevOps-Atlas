import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentCard from "@/components/ContentCard";
import Pagination from "@/components/Pagination";
import {
  CATEGORIES,
  TYPE_META,
  CONTENT_TYPES,
  getContentByCategory,
  paginate,
  slugify,
} from "@/lib/content";

const PER_PAGE = 6;

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: slugify(category) }));
}

export const dynamicParams = false;

function findCategory(param: string): string | undefined {
  return CATEGORIES.find((category) => slugify(category) === param);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = findCategory(category);
  if (!name) return { title: "Category not found" };
  const description = `All DevOps-Atlas content filed under ${name} — articles, notes, labs and more.`;
  return {
    title: name,
    description,
    alternates: { canonical: `/categories/${category}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category: param } = await params;
  const { page: pageParam } = await searchParams;

  const name = findCategory(param);
  if (!name) notFound();

  const all = getContentByCategory(name);
  const { items, page, totalPages, total } = paginate(all, Number(pageParam) || 1, PER_PAGE);

  const breakdown = CONTENT_TYPES.map((type) => ({
    type,
    count: all.filter((item) => item.type === type).length,
  })).filter(({ count }) => count > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Category</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{name}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {total} {total === 1 ? "item" : "items"}
          {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
        </p>

        {breakdown.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-2">
            {breakdown.map(({ type, count }) => (
              <div
                key={type}
                className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs"
              >
                <dt className="inline text-slate-500">{TYPE_META[type].label}: </dt>
                <dd className="inline font-semibold text-slate-200">{count}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      {items.length > 0 ? (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Latest in {name}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={`${item.type}-${item.slug}`} item={item} />
            ))}
          </div>
          <Pagination basePath={`/categories/${param}`} page={page} totalPages={totalPages} />
        </>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
          <p className="text-sm font-medium text-slate-300">No content in {name} yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon — new items are published regularly.
          </p>
        </div>
      )}
    </div>
  );
}
