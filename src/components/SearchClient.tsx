"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileSearch, SearchX } from "lucide-react";
import TypeBadge from "./TypeBadge";
import Tag from "./Tag";
import { TYPE_META, slugify } from "@/lib/meta";
import type { ContentType, SearchEntry } from "@/lib/types";

const FILTERS: { label: string; value: ContentType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Articles", value: "article" },
  { label: "Blogs", value: "blog" },
  { label: "Notes", value: "note" },
  { label: "Posts", value: "post" },
  { label: "Labs", value: "lab" },
  { label: "Troubleshooting", value: "troubleshooting" },
];

function matches(entry: SearchEntry, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = [
    entry.title,
    entry.description,
    entry.category,
    entry.tags.join(" "),
    entry.text,
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export default function SearchClient({
  entries,
  initialQuery = "",
}: {
  entries: SearchEntry[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<ContentType | "all">("all");

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return entries.filter(
      (entry) => (filter === "all" || entry.type === filter) && matches(entry, terms),
    );
  }, [entries, query, filter]);

  const hasQuery = query.trim().length > 0;

  return (
    <div>
      <div className="relative">
        <label htmlFor="search-page-input" className="sr-only">
          Search all content
        </label>
        <input
          id="search-page-input"
          data-global-search
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, description, content, category or tags…"
          className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-600 focus:outline-none"
          autoFocus
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by content type">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm text-slate-500" role="status" aria-live="polite">
        {results.length} {results.length === 1 ? "result" : "results"}
        {hasQuery ? ` for “${query.trim()}”` : ""}
        {filter !== "all" ? ` in ${TYPE_META[filter].label}` : ""}
      </p>

      {results.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {results.map((entry) => (
            <li key={`${entry.type}-${entry.slug}`}>
              <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-cyan-700/60">
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge type={entry.type} />
                  <Link
                    href={`/categories/${slugify(entry.category)}`}
                    className="text-xs text-slate-500 hover:text-cyan-300"
                  >
                    {entry.category}
                  </Link>
                </div>
                <h2 className="mt-2 text-base font-semibold text-slate-100">
                  <Link href={entry.route} className="hover:text-cyan-300">
                    {entry.title}
                  </Link>
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-400">
                  {entry.description}
                </p>
                {entry.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <Tag key={tag} tag={tag} />
                    ))}
                  </div>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-12 text-center">
          <SearchX size={28} aria-hidden="true" className="mx-auto text-slate-600" />
          <p className="mt-3 text-sm font-medium text-slate-300">
            {hasQuery ? `No results for “${query.trim()}”` : "No content matches these filters"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try different keywords or switch the content type filter.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-xs text-slate-600">
            <FileSearch size={14} aria-hidden="true" />
            Search covers title, description, content, category and tags.
          </p>
        </div>
      )}
    </div>
  );
}
