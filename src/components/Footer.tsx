import Link from "next/link";
import { MAIN_NAV } from "@/lib/nav";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-slate-100">
              DevOps<span className="text-cyan-400">-Atlas</span>
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              A practical knowledge base for DevOps, Cloud &amp; Platform Engineering.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explore</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {MAIN_NAV.slice(1).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-400 hover:text-cyan-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tagline</p>
            <p className="mt-3 font-mono text-sm text-cyan-400">Navigate. Learn. Build. Operate.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DevOps-Atlas. Built with Next.js, TypeScript &amp; Tailwind CSS.</p>
          <Link href="/admin" className="font-medium text-slate-400 hover:text-cyan-300">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
