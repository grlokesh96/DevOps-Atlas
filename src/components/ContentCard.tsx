import Link from "next/link";
import { Clock, CalendarDays } from "lucide-react";
import Tag from "./Tag";
import TypeBadge from "./TypeBadge";
import { formatDate, slugify, TYPE_META } from "@/lib/meta";
import type { ContentMeta } from "@/lib/types";

export { formatDate };

export default function ContentCard({ item }: { item: ContentMeta }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:border-cyan-700/60 hover:bg-slate-900/70">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TypeBadge type={item.type} />
        <Link
          href={`/categories/${slugify(item.category)}`}
          className="text-xs font-medium text-slate-500 hover:text-cyan-300"
        >
          {item.category}
        </Link>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-6 text-slate-100">
        <Link href={item.route} className="hover:text-cyan-300 focus-visible:outline-none">
          <span className="bg-gradient-to-r from-cyan-300 to-cyan-300 bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">
            {item.title}
          </span>
        </Link>
      </h3>

      <p className="mt-2 line-clamp-2 flex-grow text-sm leading-6 text-slate-400">
        {item.description}
      </p>

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
        <time dateTime={item.date} className="inline-flex items-center gap-1">
          <CalendarDays size={12} aria-hidden="true" />
          {formatDate(item.date)}
        </time>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} aria-hidden="true" />
          {item.readingTime} min read
        </span>
        <span className="ml-auto hidden font-medium text-slate-600 sm:inline">
          {TYPE_META[item.type].label}
        </span>
      </div>
    </article>
  );
}
