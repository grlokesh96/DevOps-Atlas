import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "DevOps-Atlas content management — create, upload, edit, preview and publish.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Content Management
            </h1>
          </div>
          <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
            V1 · No authentication
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <AlertTriangle size={13} aria-hidden="true" className="text-amber-400" />
          Do not expose this interface on a public deployment without access control.
        </p>
      </header>

      <AdminNav />

      <div className="mt-6">{children}</div>
    </div>
  );
}
