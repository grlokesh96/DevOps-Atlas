import Link from "next/link";
import {
  ArrowRight,
  FileText,
  FlaskConical,
  Megaphone,
  StickyNote,
  Terminal,
} from "lucide-react";
import ContentCard from "@/components/ContentCard";
import CategoryCard from "@/components/CategoryCard";
import {
  CATEGORIES,
  getAllContent,
  getCategoryCounts,
  getStats,
} from "@/lib/content";

const STATS = [
  { key: "articles", label: "Articles", icon: FileText },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "posts", label: "Posts", icon: Megaphone },
  { key: "labs", label: "Labs", icon: FlaskConical },
  { key: "commands", label: "Commands", icon: Terminal },
] as const;

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
  const stats = getStats();
  const items = getAllContent();
  const counts = getCategoryCounts();

  const featuredArticles = [
    ...items.filter((i) => i.type === "article" && i.featured),
    ...items.filter((i) => i.type === "article" && !i.featured),
  ].slice(0, 3);
  const latestPosts = items.filter((i) => i.type === "post").slice(0, 3);
  const latestNotes = items.filter((i) => i.type === "note").slice(0, 3);
  const popular = items.slice(0, 3);

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
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
            Navigate. Learn. Build. Operate.
          </p>
          <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500">
            Practical DevOps, Cloud, Kubernetes, DevSecOps and Platform Engineering knowledge.
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
              href="/notes"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-600 hover:text-cyan-300"
            >
              Browse Notes
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        {/* Statistics */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                >
                  <Icon size={18} aria-hidden="true" className="text-cyan-400" />
                  <p className="mt-3 text-2xl font-bold text-slate-100">{stats[stat.key]}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

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

        {/* Popular */}
        <section aria-labelledby="popular-heading">
          <div id="popular-heading">
            <SectionHeader title="Popular Content" />
          </div>
          {popular.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((item) => (
                <ContentCard key={`${item.type}-${item.slug}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState message="Content will appear here once published." />
          )}
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
