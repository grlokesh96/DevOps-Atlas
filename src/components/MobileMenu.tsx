"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Compass, Menu, Search, X } from "lucide-react";
import NavLinks from "./NavLinks";
import SearchBar from "./SearchBar";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-slate-800 bg-[#070b14]/90 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <Link href="/" className="flex items-center gap-2 font-bold text-slate-100">
          <Compass size={20} aria-hidden="true" className="text-cyan-400" />
          DevOps<span className="text-cyan-400">-Atlas</span>
        </Link>

        <Link
          href="/search"
          aria-label="Search"
          className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-slate-300 hover:border-slate-700 hover:text-white"
        >
          <Search size={18} aria-hidden="true" />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" id="mobile-navigation">
          <button
            type="button"
            aria-label="Close navigation menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 font-bold text-slate-100">
                <Compass size={20} aria-hidden="true" className="text-cyan-400" />
                DevOps<span className="text-cyan-400">-Atlas</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:text-white"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="p-4">
              <SearchBar />
            </div>
            <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 pb-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            <p className="border-t border-slate-800 px-4 py-4 text-xs text-slate-500">
              Navigate. Learn. Build. Operate.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
