"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, Files, LayoutDashboard, UploadCloud } from "lucide-react";

const TABS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Create Content", href: "/admin/create", icon: FilePlus2 },
  { label: "Upload Content", href: "/admin/upload", icon: UploadCloud },
  { label: "Manage Content", href: "/admin/content", icon: Files },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="mt-5 overflow-x-auto">
      <ul className="flex min-w-max gap-2">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
