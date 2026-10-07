"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TypeBadge from "@/components/TypeBadge";
import { renderMarkdown } from "@/lib/render";
import { formatDate } from "@/lib/meta";
import type { UploadMeta } from "@/lib/types";

const ALLOWED = ["md", "mdx", "txt", "pdf"];
const MAX_TEXT = 2 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;

interface ParsedMarkdown {
  title: string;
  description: string;
  type: string;
  category: string;
  tags: string[];
  difficulty: string;
  author: string;
  published: string;
  date: string;
  body: string;
  sourceName: string;
  hasFrontmatter: boolean;
  suggestedSlug: string;
}

type State =
  | { phase: "idle" }
  | { phase: "uploading"; progress: number; name: string }
  | { phase: "error"; message: string }
  | { phase: "markdown"; parsed: ParsedMarkdown }
  | { phase: "stored"; meta: UploadMeta; kind: "txt" | "pdf" };

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export default function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [saving, setSaving] = useState(false);
  const [savedRoute, setSavedRoute] = useState("");

  function validate(file: File): string | null {
    const e = ext(file.name);
    if (!ALLOWED.includes(e)) return `Unsupported file type ".${e}". Allowed: ${ALLOWED.join(", ")}.`;
    const limit = e === "pdf" ? MAX_PDF : MAX_TEXT;
    if (file.size > limit)
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Max ${
        limit / (1024 * 1024)
      } MB.`;
    return null;
  }

  function upload(file: File) {
    const error = validate(file);
    if (error) {
      setState({ phase: "error", message: error });
      return;
    }

    setState({ phase: "uploading", progress: 0, name: file.name });
    setSavedRoute("");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setState({ phase: "uploading", progress: Math.round((e.loaded / e.total) * 100), name: file.name });
      }
    };
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* noop */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        if (data.kind === "markdown") setState({ phase: "markdown", parsed: data.parsed });
        else setState({ phase: "stored", meta: data.meta, kind: data.meta.kind });
      } else {
        setState({ phase: "error", message: data.error ?? `Upload failed (${xhr.status})` });
      }
    };
    xhr.onerror = () => setState({ phase: "error", message: "Network error — upload failed." });

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  }

  async function addToLibrary(status: "draft" | "published") {
    const parsed = state.phase === "markdown" ? state.parsed : null;
    if (!parsed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: parsed.type,
          title: parsed.title,
          description: parsed.description,
          category: parsed.category,
          tags: parsed.tags,
          author: parsed.author,
          cover: "",
          body: parsed.body,
          status,
          date: parsed.date,
          difficulty: parsed.difficulty,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedRoute(data.route);
      } else {
        setState({ phase: "error", message: data.error ?? "Could not save to library" });
      }
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setState({ phase: "idle" });
    setSavedRoute("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const previewHtml =
    state.phase === "markdown" ? renderMarkdown(state.parsed.body || "*empty*").html : null;

  return (
    <div className="space-y-5">
      {state.phase !== "uploading" && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
            dragOver
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
          }`}
        >
          <UploadCloud size={32} aria-hidden="true" className={dragOver ? "text-cyan-400" : "text-slate-600"} />
          <p className="mt-3 text-sm font-medium text-slate-300">Drag &amp; Drop File Here</p>
          <p className="mt-1 text-xs text-slate-500">.md · .mdx · .txt · .pdf — max 2 MB (10 MB PDF)</p>
          <p className="my-3 text-xs text-slate-600">or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300"
          >
            Choose File
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".md,.mdx,.txt,.pdf"
            className="hidden"
            aria-label="Choose file to upload"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </div>
      )}

      {state.phase === "uploading" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Loader2 size={16} className="animate-spin text-cyan-400" aria-hidden="true" />
            Uploading <span className="font-medium text-slate-100">{state.name}</span>
            <span className="ml-auto font-mono text-xs text-slate-500">{state.progress}%</span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuenow={state.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.phase === "error" && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-600/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{state.message}</p>
            <button type="button" onClick={reset} className="mt-1 text-xs underline">
              Try another file
            </button>
          </div>
        </div>
      )}

      {savedRoute && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-600/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={16} aria-hidden="true" />
          Saved to the content library.
          <Link href={savedRoute} target="_blank" className="ml-auto font-medium underline">
            Open
          </Link>
          <button type="button" onClick={reset} className="text-xs underline">
            Upload another
          </button>
        </div>
      )}

      {/* Markdown / MDX result */}
      {state.phase === "markdown" && !savedRoute && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3">
            <FileText size={15} aria-hidden="true" className="text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">{state.parsed.sourceName}</span>
            <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
              {state.parsed.hasFrontmatter ? "frontmatter read" : "no frontmatter — defaults applied"}
            </span>
          </div>

          <dl className="grid gap-x-6 gap-y-1.5 px-4 py-3 text-sm sm:grid-cols-2">
            {[
              ["Title", state.parsed.title],
              ["Description", state.parsed.description || "—"],
              ["Type", state.parsed.type],
              ["Category", state.parsed.category],
              ["Tags", state.parsed.tags.join(", ") || "—"],
              ["Date", state.parsed.date],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-24 shrink-0 text-xs text-slate-500">{k}</dt>
                <dd className="min-w-0 truncate text-slate-300">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-slate-800 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Preview</p>
            <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <MarkdownRenderer html={previewHtml ?? ""} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-3">
            <button
              type="button"
              onClick={() => addToLibrary("draft")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300 disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => addToLibrary("published")}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving && <Loader2 size={13} className="animate-spin" />}
              Publish
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* TXT / PDF result */}
      {state.phase === "stored" && !savedRoute && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-4 py-3">
            <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-400">
              {state.meta.kind}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-200">
              {state.meta.originalName}
            </span>
            <span className="text-xs text-slate-500">
              {(state.meta.size / 1024).toFixed(1)} KB · {formatDate(state.meta.uploadedAt.slice(0, 10))}
            </span>
            <a
              href={`/api/files/${state.meta.name}?download=1`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300"
            >
              <Download size={13} aria-hidden="true" />
              Download
            </a>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {state.meta.kind === "pdf" ? "Preview (browser PDF viewer)" : "Text preview"}
            </p>
            {state.meta.kind === "pdf" ? (
              <iframe
                src={`/api/files/${state.meta.name}`}
                title={`Preview of ${state.meta.originalName}`}
                className="mt-2 h-96 w-full rounded-lg border border-slate-800 bg-slate-950"
              />
            ) : (
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs leading-5 text-slate-300">
                {state.meta.preview}
              </pre>
            )}
          </div>

          <div className="border-t border-slate-800 px-4 py-3">
            <button type="button" onClick={reset} className="text-xs font-medium text-slate-400 hover:text-cyan-300">
              Upload another file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
