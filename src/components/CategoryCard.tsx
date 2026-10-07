import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { slugify } from "@/lib/content";

export default function CategoryCard({
  name,
  count,
}: {
  name: string;
  count: number;
}) {
  return (
    <Link
      href={`/categories/${slugify(name)}`}
      className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 px-5 py-4 transition-colors hover:border-cyan-700/60 hover:bg-slate-900/70"
    >
      <div>
        <p className="font-semibold text-slate-100 group-hover:text-cyan-300">{name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {count} {count === 1 ? "item" : "items"}
        </p>
      </div>
      <ArrowRight
        size={16}
        aria-hidden="true"
        className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-400"
      />
    </Link>
  );
}
