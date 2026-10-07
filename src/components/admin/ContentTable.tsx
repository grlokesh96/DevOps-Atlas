"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FileCheck2, FileX2, Loader2, Pencil, Trash2 } from "lucide-react";
import TypeBadge from "@/components/TypeBadge";
import { formatDate, TYPE_META } from "@/lib/meta";
import type { ContentType } from "@/lib/types";

interface Row {
  type: ContentType;
  slug: string;
  title: string;
  published: boolean;
  date: string;
  category: string;
}

export default function ContentTable({ items }: { items: Row[] }) {
  const router = useRouter();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function toggleStatus(row: Row) {
    const key = `${row.type}-${row.slug}`;
    setBusySlug(key);
    setError("");
    try {
      const res = await fetch(`/api/content/${TYPE_META[row.type].route}/${row.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: row.published ? "draft" : "published" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Update failed");
      }
      router.refresh();
    } finally {
      setBusySlug(null);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.title}" permanently? This cannot be undone.`)) return;
    const key = `${row.type}-${row.slug}`;
    setBusySlug(key);
    setError("");
    try {
      const res = await fetch(`/api/content/${TYPE_META[row.type].route}/${row.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Delete failed");
      }
      router.refresh();
    } finally {
      setBusySlug(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-14 text-center">
        <p className="text-sm font-medium text-slate-300">Nothing here</p>
        <p className="mt-1 text-sm text-slate-500">
          <Link href="/admin/create" className="text-cyan-400 hover:text-cyan-300">
            Create content
          </Link>{" "}
          or upload a file to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-rose-600/50 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
        {items.map((row) => {
          const key = `${row.type}-${row.slug}`;
          const busy = busySlug === key;
          const editHref = `/admin/edit/${TYPE_META[row.type].route}/${row.slug}`;
          return (
            <li
              key={key}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-5"
            >
              <TypeBadge type={row.type} />
              <div className="min-w-0 flex-1">
                <Link href={editHref} className="block truncate text-sm font-medium text-slate-100 hover:text-cyan-300">
                  {row.title}
                </Link>
                <p className="mt-0.5 text-xs text-slate-500">
                  {row.category} ·{" "}
                  <time dateTime={row.date}>{formatDate(row.date)}</time>
                </p>
              </div>

              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                  row.published
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-amber-500/10 text-amber-300"
                }`}
              >
                {row.published ? "Published" : "Draft"}
              </span>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={editHref}
                  title="Edit"
                  aria-label={`Edit ${row.title}`}
                  className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:border-cyan-600 hover:text-cyan-300"
                >
                  <Pencil size={14} aria-hidden="true" />
                </Link>
                {row.published ? (
                  <Link
                    href={`/${TYPE_META[row.type].route}/${row.slug}`}
                    target="_blank"
                    title="Preview"
                    aria-label={`Preview ${row.title}`}
                    className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:border-cyan-600 hover:text-cyan-300"
                  >
                    <Eye size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <Link
                    href={editHref}
                    title="Preview in editor"
                    aria-label={`Preview ${row.title} in editor`}
                    className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:border-cyan-600 hover:text-cyan-300"
                  >
                    <Eye size={14} aria-hidden="true" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => toggleStatus(row)}
                  disabled={busy}
                  title={row.published ? "Unpublish (save as draft)" : "Publish"}
                  aria-label={row.published ? `Unpublish ${row.title}` : `Publish ${row.title}`}
                  className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:border-emerald-600 hover:text-emerald-300 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  ) : row.published ? (
                    <FileX2 size={14} aria-hidden="true" />
                  ) : (
                    <FileCheck2 size={14} aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => remove(row)}
                  disabled={busy}
                  title="Delete"
                  aria-label={`Delete ${row.title}`}
                  className="rounded-lg border border-slate-800 p-2 text-slate-400 hover:border-rose-600 hover:text-rose-300 disabled:opacity-50"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
