"use client";

import { useEffect, useState } from "react";
import { ChevronDown, List } from "lucide-react";
import type { Heading } from "@/lib/types";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-slate-200 xl:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <List size={15} aria-hidden="true" className="text-cyan-400" />
          Table of Contents
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <p className="hidden text-xs font-semibold uppercase tracking-wider text-slate-500 xl:block">
        Table of Contents
      </p>

      <ol
        className={`${open ? "mt-2 block" : "hidden"} xl:mt-3 xl:block xl:max-h-[70vh] xl:overflow-y-auto`}
      >
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}>
            <a
              href={`#${heading.id}`}
              onClick={() => setOpen(false)}
              className={`block border-l-2 py-1.5 pl-3 text-sm transition-colors ${
                activeId === heading.id
                  ? "border-cyan-400 text-cyan-300"
                  : "border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
