import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`);
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:border-cyan-700 hover:text-cyan-300"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          Prev
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2 text-sm text-slate-600">
          <ChevronLeft size={14} aria-hidden="true" />
          Prev
        </span>
      )}

      {numbers.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-600 bg-cyan-500/10 text-sm font-medium text-cyan-300"
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-sm text-slate-400 hover:border-cyan-700 hover:text-cyan-300"
          >
            {n}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          rel="next"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 hover:border-cyan-700 hover:text-cyan-300"
        >
          Next
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2 text-sm text-slate-600">
          Next
          <ChevronRight size={14} aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
