import Link from "next/link";
import { Compass, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-6xl font-bold text-cyan-400">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        The page you are looking for does not exist, was moved, or the content is unavailable.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <Compass size={15} aria-hidden="true" />
          Back home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300"
        >
          <Search size={15} aria-hidden="true" />
          Search content
        </Link>
      </div>
    </div>
  );
}
