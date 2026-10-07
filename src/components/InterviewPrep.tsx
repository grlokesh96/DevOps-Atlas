"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { INTERVIEW_CATEGORIES, INTERVIEW_QUESTIONS } from "@/data/interview";

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "border-emerald-600/40 bg-emerald-500/10 text-emerald-300",
  Intermediate: "border-amber-600/40 bg-amber-500/10 text-amber-300",
  Advanced: "border-rose-600/40 bg-rose-500/10 text-rose-300",
};

export default function InterviewPrep() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTERVIEW_QUESTIONS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search questions</span>
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions… e.g. readiness probe, state, OIDC"
            className="w-full rounded-lg border border-slate-700 bg-slate-900/70 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600"
          />
        </label>
        <p className="text-xs text-slate-500 sm:w-40 sm:text-right" aria-live="polite">
          {filtered.length} / {INTERVIEW_QUESTIONS.length} questions
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Question categories">
        {["All", ...INTERVIEW_CATEGORIES].map((c) => {
          const active = category === c;
          const count =
            c === "All"
              ? INTERVIEW_QUESTIONS.length
              : INTERVIEW_QUESTIONS.filter((q) => q.category === c).length;
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(c)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
                  : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {c}
              <span className="ml-1.5 text-[10px] text-slate-500">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <ul className="mt-6 space-y-2.5">
          {filtered.map((item) => {
            const open = openId === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-900/70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-6 text-slate-100">
                      {item.question}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded border border-slate-700/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {item.category}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
                          DIFFICULTY_STYLES[item.difficulty]
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`mt-1 shrink-0 text-slate-500 transition-transform ${
                      open ? "rotate-180 text-cyan-400" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-slate-800/80 bg-slate-950/50 px-4 py-4">
                    <p className="text-[13px] leading-6 text-slate-300">{item.answer}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
          <p className="text-sm font-medium text-slate-300">No questions match “{query}”</p>
          <p className="mt-1 text-xs text-slate-500">
            Try a broader term like “probe”, “state” or “rollback”.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("All");
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
