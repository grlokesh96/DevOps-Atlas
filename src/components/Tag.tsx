import Link from "next/link";
import { slugify } from "@/lib/meta";

export default function Tag({ tag }: { tag: string }) {
  return (
    <Link
      href={`/tags/${slugify(tag)}`}
      className="rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300 transition-colors hover:border-cyan-600 hover:text-cyan-300"
    >
      #{tag}
    </Link>
  );
}
