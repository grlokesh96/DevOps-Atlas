import type { Metadata } from "next";
import SearchClient from "@/components/SearchClient";
import { getSearchIndex } from "@/lib/content";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search DevOps-Atlas across articles, blogs, notes, posts, labs, troubleshooting, commands and interview prep.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const entries = getSearchIndex();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Global</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Search</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Search across title, description, content, category and tags. Press{" "}
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
            /
          </kbd>{" "}
          from anywhere to focus search.
        </p>
      </header>

      <SearchClient entries={entries} initialQuery={q ?? ""} />
    </div>
  );
}
