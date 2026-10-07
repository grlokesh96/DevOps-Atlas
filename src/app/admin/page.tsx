import Link from "next/link";
import {
  FilePlus2,
  FileText,
  FolderOpen,
  Pencil,
  UploadCloud,
  FileArchive,
} from "lucide-react";
import TypeBadge from "@/components/TypeBadge";
import { formatDate, TYPE_META, CONTENT_TYPES } from "@/lib/meta";
import { getAllContentAdmin } from "@/lib/content";
import { listUploads } from "@/lib/store";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <Icon size={18} aria-hidden="true" className={accent} />
      <p className="mt-3 text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const items = getAllContentAdmin();
  const uploads = listUploads();
  const published = items.filter((i) => i.published);
  const drafts = items.filter((i) => !i.published);
  const recent = items.slice(0, 6);
  const storage = uploads.reduce((sum, u) => sum + u.size, 0);

  return (
    <div className="space-y-8">
      <section aria-label="Statistics">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={FileText} label="Total Content" value={items.length} accent="text-cyan-400" />
          <StatCard icon={FolderOpen} label="Published" value={published.length} accent="text-emerald-400" />
          <StatCard icon={Pencil} label="Drafts" value={drafts.length} accent="text-amber-400" />
          <StatCard icon={UploadCloud} label="Uploads" value={uploads.length} accent="text-violet-400" />
          <StatCard
            icon={FileArchive}
            label="Upload Storage"
            value={`${(storage / 1024).toFixed(1)} KB`}
            accent="text-sky-400"
          />
        </div>
      </section>

      <section aria-label="Quick actions">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/create"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            <FilePlus2 size={15} aria-hidden="true" />
            Create Content
          </Link>
          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300"
          >
            <UploadCloud size={15} aria-hidden="true" />
            Upload Content
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="by-type">
          <h2 id="by-type" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            By content type
          </h2>
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
            {CONTENT_TYPES.map((type) => {
              const typeItems = items.filter((i) => i.type === type);
              const pub = typeItems.filter((i) => i.published).length;
              return (
                <li key={type} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-slate-300">{TYPE_META[type].label}</span>
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-200">{pub}</span> published ·{" "}
                    {typeItems.length - pub} draft{typeItems.length - pub === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="recent">
          <h2 id="recent" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Recent content
          </h2>
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
            {recent.map((item) => (
              <li key={`${item.type}-${item.slug}`} className="flex items-center gap-3 px-4 py-2.5">
                <TypeBadge type={item.type} />
                <Link
                  href={`/admin/edit/${TYPE_META[item.type].route}/${item.slug}`}
                  className="min-w-0 flex-1 truncate text-sm text-slate-200 hover:text-cyan-300"
                >
                  {item.title}
                </Link>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                    item.published
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {item.published ? "Live" : "Draft"}
                </span>
                <time dateTime={item.date} className="hidden shrink-0 text-xs text-slate-500 sm:block">
                  {formatDate(item.date)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="uploads-heading">
        <h2 id="uploads-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Recent uploads
        </h2>
        {uploads.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
            {uploads.slice(0, 5).map((u) => (
              <li key={u.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-400">
                  {u.kind}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-200">{u.originalName}</span>
                <span className="text-xs text-slate-500">{(u.size / 1024).toFixed(1)} KB</span>
                <a
                  href={`/api/files/${u.name}?download=1`}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
            No uploads yet.
          </p>
        )}
      </section>
    </div>
  );
}
