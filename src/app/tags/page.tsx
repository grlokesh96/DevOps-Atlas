import type { Metadata } from "next";
import Link from "next/link";
import { Hash } from "lucide-react";
import { getTagCounts, slugify } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tags",
  description: "Every tag used across DevOps-Atlas content — browse related articles, notes and labs by tag.",
  alternates: { canonical: "/tags" },
};

export default function TagsPage() {
  const tags = getTagCounts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Browse</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Tags</h1>
        <p className="mt-2 text-sm text-slate-400">
          {tags.length} {tags.length === 1 ? "tag" : "tags"} across the knowledge base
        </p>
      </header>

      {tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/tags/${slugify(tag)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/60 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-cyan-600 hover:text-cyan-300"
            >
              <Hash size={13} aria-hidden="true" className="text-cyan-500" />
              {tag}
              <span className="text-xs text-slate-500">{count}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center text-sm text-slate-500">
          No tags yet.
        </div>
      )}
    </div>
  );
}
