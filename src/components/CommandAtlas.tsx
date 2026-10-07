"use client";

import { useMemo, useState } from "react";
import { Search, Terminal } from "lucide-react";
import CopyButton from "@/components/CopyButton";
import { COMMAND_ATLAS, COMMAND_GROUPS } from "@/data/commands";

export default function CommandAtlas() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of COMMAND_ATLAS) map.set(c.group, (map.get(c.group) ?? 0) + 1);
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMMAND_ATLAS.filter((c) => {
      if (group !== "All" && c.group !== group) return false;
      if (!q) return true;
      return (
        c.command.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    });
  }, [query, group]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search commands</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands… e.g. kubectl logs, dig, terraform state"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600"
          />
        </label>
        <p className="text-xs text-slate-500 sm:w-40 sm:text-right" aria-live="polite">
          {filtered.length} / {COMMAND_ATLAS.length} commands
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Command groups">
        {["All", ...COMMAND_GROUPS].map((g) => {
          const active = group === g;
          const count = g === "All" ? COMMAND_ATLAS.length : (counts.get(g) ?? 0);
          return (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setGroup(g)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {g}
              <span className="ml-1.5 text-[10px] text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 grid gap-2.5 lg:grid-cols-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="group flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 transition-colors hover:border-cyan-800/60"
            >
              <Terminal
                size={15}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-cyan-600 group-hover:text-cyan-400"
              />
              <div className="min-w-0 flex-1">
                <code className="block break-words font-mono text-[13px] leading-5 text-cyan-200">
                  {c.command}
                </code>
                <p className="mt-1 text-xs leading-5 text-slate-400">{c.description}</p>
                <span className="mt-1.5 inline-block rounded border border-slate-700/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                  {c.group}
                </span>
              </div>
              <CopyButton text={c.command} className="shrink-0" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-300">No commands match “{query}”</p>
          <p className="mt-1 text-xs text-slate-500">
            Try a tool name like kubectl, docker, aws or dig.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup("All");
            }}
            className="mt-4 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
