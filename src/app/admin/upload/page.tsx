import type { Metadata } from "next";
import UploadZone from "@/components/admin/UploadZone";
import { listUploads } from "@/lib/store";

export const metadata: Metadata = {
  title: "Upload Content",
  robots: { index: false, follow: false },
};

export default function UploadContentPage() {
  const uploads = listUploads();

  return (
    <div className="space-y-8">
      <div>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Upload <code className="rounded bg-slate-800 px-1 text-cyan-300">.md</code> /{" "}
          <code className="rounded bg-slate-800 px-1 text-cyan-300">.mdx</code> to import into the
          content library (frontmatter is read and previewed).{" "}
          <code className="rounded bg-slate-800 px-1 text-cyan-300">.txt</code> and{" "}
          <code className="rounded bg-slate-800 px-1 text-cyan-300">.pdf</code> files are stored
          with metadata, a preview and a download link.
        </p>
      </div>

      <UploadZone />

      <section aria-labelledby="upload-history">
        <h2 id="upload-history" className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Stored uploads ({uploads.length})
        </h2>
        {uploads.length > 0 ? (
          <ul className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
            {uploads.map((u) => (
              <li key={u.name} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-400">
                  {u.kind}
                </span>
                <span className="min-w-0 flex-1 truncate text-slate-200">{u.originalName}</span>
                <span className="text-xs text-slate-500">{(u.size / 1024).toFixed(1)} KB</span>
                <a
                  href={`/api/files/${u.name}`}
                  target="_blank"
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  View
                </a>
                <a
                  href={`/api/files/${u.name}?download=1`}
                  className="text-xs font-medium text-slate-400 hover:text-cyan-300"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-800 px-4 py-6 text-sm text-slate-500">
            No stored uploads yet.
          </p>
        )}
      </section>
    </div>
  );
}
