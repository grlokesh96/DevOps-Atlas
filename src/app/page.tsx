import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  FileText,
  FlaskConical,
  Megaphone,
  PenLine,
  StickyNote,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import ContentCard from "@/components/ContentCard";
import CategoryCard from "@/components/CategoryCard";
import {
  CATEGORIES,
  CONTENT_TYPES,
  TYPE_META,
  getAllContent,
  getCategoryCounts,
} from "@/lib/content";
import type { ContentType } from "@/lib/types";

export const revalidate = 15;

const TYPE_ICONS: Record<ContentType, LucideIcon> = {
  article: FileText,
  blog: PenLine,
  note: StickyNote,
  post: Megaphone,
  lab: FlaskConical,
  troubleshooting: Wrench,
  command: Terminal,
  interview: Briefcase,
};

const TYPE_ACCENTS: Record<ContentType, string> = {
  article: "text-cyan-400",
  blog: "text-sky-400",
  note: "text-emerald-400",
  post: "text-violet-400",
  lab: "text-amber-400",
  troubleshooting: "text-rose-400",
  command: "text-lime-400",
  interview: "text-indigo-400",
};

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300"
        >
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function HomePage() {
  const items = getAllContent();
  const counts = getCategoryCounts();

  const featuredArticles = [
    ...items.filter((i) => i.type === "article" && i.featured),
    ...items.filter((i) => i.type === "article" && !i.featured),
  ].slice(0, 3);
  const latestPosts = items.filter((i) => i.type === "post").slice(0, 3);
  const latestNotes = items.filter((i) => i.type === "note").slice(0, 3);

  const typeCounts = CONTENT_TYPES.map((type) => ({
    type,
    count: items.filter((i) => i.type === type).length,
  }));

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-cyan-500/[0.06] to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Navigate. Learn. Build. Operate.
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            DevOps<span className="text-cyan-400">-Atlas</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Practical, battle-tested DevOps, Cloud, Kubernetes, DevSecOps and Platform Engineering
            knowledge — organised so you can find the fix, understand the why, and ship with
            confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-400"
            >
              Explore Articles
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/troubleshooting"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-600 hover:text-cyan-300"
            >
              Troubleshooting Library
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-600 hover:text-cyan-300"
            >
              Search Everything
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {/* Featured */}
        <section aria-labelledby="featured-heading">
          <div id="featured-heading">
            <SectionHeader title="Featured Articles" href="/articles" />
          </div>
          {featuredArticles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredArticles.map((item) => (
                <ContentCard key={`${item.type}-${item.slug}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState message="No articles published yet." />
          )}
        </section>

        {/* Latest posts + notes */}
        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="posts-heading">
            <div id="posts-heading">
              <SectionHeader title="Latest Posts" href="/posts" />
            </div>
            {latestPosts.length > 0 ? (
              <div className="grid gap-4">
                {latestPosts.map((item) => (
                  <ContentCard key={`${item.type}-${item.slug}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState message="No posts published yet." />
            )}
          </section>

          <section aria-labelledby="notes-heading">
            <div id="notes-heading">
              <SectionHeader title="Latest Notes" href="/notes" />
            </div>
            {latestNotes.length > 0 ? (
              <div className="grid gap-4">
                {latestNotes.map((item) => (
                  <ContentCard key={`${item.type}-${item.slug}`} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState message="No notes published yet." />
            )}
          </section>
        </div>

        {/* Explore by content type */}
        <section aria-labelledby="explore-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="explore-heading"
                className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl"
              >
                Explore the Atlas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {items.length} published {items.length === 1 ? "item" : "items"} across{" "}
                {CONTENT_TYPES.length} content types and {CATEGORIES.length} categories.
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 hover:text-cyan-300"
            >
              What&apos;s inside
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {typeCounts.map(({ type, count }) => {
              const Icon = TYPE_ICONS[type];
              const meta = TYPE_META[type];
              return (
                <Link
                  key={type}
                  href={`/${meta.route}`}
                  className="group flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-cyan-700/60 hover:bg-slate-900/70"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={20} aria-hidden="true" className={TYPE_ACCENTS[type]} />
                    <span className="rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs font-medium text-slate-400">
                      {count}
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-slate-100 group-hover:text-cyan-300">
                    {meta.label}
                  </p>
                  <p className="mt-1 flex-grow text-xs leading-5 text-slate-500">
                    {meta.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-slate-500 group-hover:text-cyan-300">
                    Browse
                    <ArrowRight
                      size={12}
                      aria-hidden="true"
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Categories */}
        <section aria-labelledby="categories-heading">
          <div id="categories-heading">
            <SectionHeader title="Categories" href="/categories" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category}
                name={category}
                count={counts.get(category) ?? 0}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
