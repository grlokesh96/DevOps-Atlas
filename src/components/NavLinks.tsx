"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item, index) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const divider = index === NAV_ITEMS.length - 2;
        return (
          <li key={item.href} className={divider ? "mt-3 border-t border-slate-800 pt-3" : undefined}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <Icon size={17} aria-hidden="true" className={active ? "text-cyan-400" : "text-slate-500"} />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
