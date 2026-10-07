import Link from "next/link";
import { Compass } from "lucide-react";
import NavLinks from "./NavLinks";
import SearchBar from "./SearchBar";

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-800 px-5">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-100">
          <Compass size={22} aria-hidden="true" className="text-cyan-400" />
          DevOps<span className="text-cyan-400">-Atlas</span>
        </Link>
      </div>

      <div className="shrink-0 px-4 py-4">
        <SearchBar />
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks />
      </nav>

      <div className="shrink-0 border-t border-slate-800 px-5 py-4">
        <p className="text-xs font-medium tracking-wide text-slate-500">
          Navigate. Learn. Build. Operate.
        </p>
      </div>
    </aside>
  );
}
