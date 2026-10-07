import type { Metadata } from "next";
import Link from "next/link";
import ContentTable from "@/components/admin/ContentTable";
import { TYPE_META, getAllContentAdmin } from "@/lib/content";

export const metadata: Metadata = {
  title: "Manage Content",
  robots: { index: false, follow: false },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published Content" },
  { key: "draft", label: "Drafts" },
] as const;

export default async function ManageContentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status === "draft" || status === "published" ? status : "all";

  const all = getAllContentAdmin();
  const items =
    active === "all"
      ? all
      : all.filter((i) => (active === "published" ? i.published : !i.published));

  const counts = {
    all: all.length,
    published: all.filter((i) => i.published).length,
    draft: all.filter((i) => !i.published).length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Content status filter">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/admin/content" : `/admin/content?status=${tab.key}`}
              role="tab"
              aria-selected={active === tab.key}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                active === tab.key
                  ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-slate-500">{counts[tab.key]}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/admin/create"
          className="rounded-lg bg-cyan-500 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          + New
        </Link>
      </div>

      <div className="mt-4">
        <ContentTable
          items={items.map((i) => ({
            type: i.type,
            slug: i.slug,
            title: i.title,
            published: i.published,
            date: i.date,
            category: i.category,
          }))}
        />
      </div>

      <p className="mt-4 text-xs text-slate-600">
        Published items appear on the homepage, listings, categories, tags and search. Drafts are
        private to this admin view. Types:{" "}
        {Object.values(TYPE_META)
          .map((m) => m.label)
          .join(", ")}
        .
      </p>
    </div>
  );
}
