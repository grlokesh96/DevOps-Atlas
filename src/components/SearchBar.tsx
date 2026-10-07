"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ autoFocusOnMount = false }: { autoFocusOnMount?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative">
      <Search
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
      <input
        data-global-search
        aria-label="Search DevOps-Atlas"
        type="search"
        value={query}
        autoFocus={autoFocusOnMount}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        className="w-full rounded-lg border border-slate-800 bg-slate-900/70 py-2 pl-9 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-600 focus:outline-none"
      />
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block"
      >
        /
      </kbd>
    </form>
  );
}
