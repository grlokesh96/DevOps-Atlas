import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Signal } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import DownloadButton from "@/components/DownloadButton";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TableOfContents from "@/components/TableOfContents";
import Tag from "@/components/Tag";
import TypeBadge from "@/components/TypeBadge";
import { formatDate } from "@/components/ContentCard";
import {
  CONTENT_TYPES,
  TYPE_META,
  getContentByType,
  getContentItem,
  getRelated,
  resolveType,
  slugify,
} from "@/lib/content";

export function generateStaticParams() {
  const params: { type: string; slug: string }[] = [];
  for (const type of CONTENT_TYPES) {
    for (const item of getContentByType(type)) {
      params.push({ type: TYPE_META[type].route, slug: item.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}): Promise<Metadata> {
  const { type: route, slug } = await params;
  const type = resolveType(route);
  const item = type ? getContentItem(type, slug) : undefined;
  if (!item) return { title: "Content not found" };

  return {
    title: item.title,
    description: item.description,
    keywords: item.tags,
    alternates: { canonical: item.route },
    openGraph: {
      title: `${item.title} — DevOps-Atlas`,
      description: item.description,
      url: item.route,
      type: "article",
      publishedTime: item.date,
      tags: item.tags,
    },
  };
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type: route, slug } = await params;
  const type = resolveType(route);
  if (!type) notFound();

  const item = getContentItem(type, slug);
  if (!item) notFound();

  const related = getRelated(item, 3);
  const meta = TYPE_META[item.type];

  if (!item.body.trim()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Content unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">
          This item exists but has no content yet.
        </p>
        <Link
          href={`/${route}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-600 hover:text-cyan-300"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to {meta.label}
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-cyan-300">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${route}`} className="hover:text-cyan-300">
              {meta.label}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-400">{item.title}</li>
        </ol>
      </nav>

      <header className="mt-6 border-b border-slate-800 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={item.type} />
          <Link
            href={`/categories/${slugify(item.category)}`}
            className="rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            {item.category}
          </Link>
          {item.difficulty && (
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
              <Signal size={12} aria-hidden="true" />
              {item.difficulty}
            </span>
          )}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {item.title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400">{item.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-500">
          <time dateTime={item.date} className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} aria-hidden="true" />
            {formatDate(item.date)}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} aria-hidden="true" />
            {item.readingTime} min read
          </span>
          <DownloadButton filename={item.slug} content={item.body} />
        </div>

        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>

      <div className="mt-8 grid gap-10 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-10">
            <TableOfContents headings={item.headings} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 xl:hidden">
            <TableOfContents headings={item.headings} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-6 sm:px-7 sm:py-8">
            <MarkdownRenderer html={item.html} />
          </div>

          {related.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-12">
              <h2 id="related-heading" className="text-lg font-semibold text-slate-100">
                Related Content
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((rel) => (
                  <ContentCard key={`${rel.type}-${rel.slug}`} item={rel} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-10 border-t border-slate-800 pt-6">
            <Link
              href={`/${route}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to {meta.label}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
