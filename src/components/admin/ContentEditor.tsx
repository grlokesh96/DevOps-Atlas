"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bold,
  CheckCircle2,
  Code,
  ExternalLink,
  Heading2,
  Italic,
  List,
  Link2,
  Loader2,
  Quote,
  Save,
  Send,
  Table2,
  Trash2,
  Columns2,
} from "lucide-react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TableOfContents from "@/components/TableOfContents";
import TypeBadge from "@/components/TypeBadge";
import { formatDate } from "@/lib/meta";
import { CATEGORIES, CONTENT_TYPES, TYPE_META } from "@/lib/meta";
import { readingTime, renderMarkdown } from "@/lib/render";
import type { ContentType } from "@/lib/types";

const CREATE_TYPES: ContentType[] = ["article", "blog", "note", "post", "troubleshooting"];
const DIFFICULTIES = ["", "Beginner", "Intermediate", "Advanced"];

export interface EditorInitial {
  type: ContentType;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  cover: string;
  body: string;
  status: "draft" | "published";
  date: string;
  difficulty: string;
}

function initialFromDefaults(): EditorInitial {
  return {
    type: "article",
    title: "",
    description: "",
    category: CATEGORIES[0],
    tags: [],
    author: "",
    cover: "",
    body: "",
    status: "draft",
    date: new Date().toISOString().slice(0, 10),
    difficulty: "",
  };
}

export default function ContentEditor({
  mode,
  editKey,
  initial,
}: {
  mode: "create" | "edit";
  editKey?: { type: ContentType; slug: string };
  initial?: EditorInitial;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<EditorInitial>(initial ?? initialFromDefaults());
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [view, setView] = useState<"editor" | "preview">("editor");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string; route?: string } | null>(
    null,
  );

  const types = mode === "create" ? CREATE_TYPES : CONTENT_TYPES;
  const categories = CATEGORIES.includes(form.category as (typeof CATEGORIES)[number])
    ? CATEGORIES
    : ([...CATEGORIES, form.category] as string[]);

  const preview = useMemo(() => renderMarkdown(form.body || "*Nothing to preview yet.*"), [form.body]);
  const words = form.body.trim() ? form.body.trim().split(/\s+/).length : 0;

  function set<K extends keyof EditorInitial>(key: K, value: EditorInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setMessage(null);
  }

  function insertBlock(before: string, after = "", placeholder = "") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = form.body.slice(start, end) || placeholder;
    const next = form.body.slice(0, start) + before + selected + after + form.body.slice(end);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function save(status: "draft" | "published") {
    if (!form.title.trim()) {
      setMessage({ kind: "err", text: "Title is required." });
      return;
    }
    if (!form.body.trim()) {
      setMessage({ kind: "err", text: "Content body is required." });
      return;
    }
    setBusy(true);
    setMessage(null);

    const payload = {
      ...form,
      status,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(
        mode === "create" ? "/api/content" : `/api/content/${TYPE_META[form.type].route}/${editKey?.slug}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "err", text: data.error ?? "Save failed" });
        return;
      }
      if (mode === "create") {
        router.push(`/admin/edit/${TYPE_META[form.type].route}/${data.slug}`);
        router.refresh();
      } else {
        setForm((f) => ({ ...f, status }));
        setMessage({
          kind: "ok",
          text: status === "published" ? "Published — live on the site." : "Draft saved.",
          route: data.route,
        });
        router.refresh();
      }
    } catch {
      setMessage({ kind: "err", text: "Network error — nothing was saved." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editKey) return;
    if (!window.confirm(`Delete "${form.title}" permanently? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/content/${TYPE_META[editKey.type].route}/${editKey.slug}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        router.push("/admin/content");
        router.refresh();
        return;
      }
      setMessage({ kind: "err", text: "Delete failed." });
    } finally {
      setBusy(false);
    }
  }

  const label = "block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const input =
    "mt-1.5 w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-600 focus:outline-none";
  const card = "rounded-xl border border-slate-800 bg-slate-900/40";

  const toolbar: { icon: typeof Bold; title: string; run: () => void }[] = [
    { icon: Heading2, title: "Heading", run: () => insertBlock("## ", "", "Heading") },
    { icon: Bold, title: "Bold", run: () => insertBlock("**", "**", "bold") },
    { icon: Italic, title: "Italic", run: () => insertBlock("*", "*", "italic") },
    { icon: Link2, title: "Link", run: () => insertBlock("[", "](https://)", "link text") },
    { icon: Code, title: "Inline code", run: () => insertBlock("`", "`", "code") },
    { icon: List, title: "List", run: () => insertBlock("- ", "", "item") },
    { icon: Quote, title: "Quote", run: () => insertBlock("> ", "", "quote") },
    {
      icon: Table2,
      title: "Table",
      run: () =>
        insertBlock(
          "| Column | Value |\n| --- | --- |\n| ",
          " |  |\n",
          "row",
        ),
    },
    {
      icon: Code,
      title: "Code block",
      run: () => insertBlock("```bash\n", "\n```", "command"),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-1 text-xs font-semibold uppercase ${
              form.status === "published"
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-amber-500/10 text-amber-300"
            }`}
          >
            {form.status}
          </span>
          {mode === "edit" && editKey && (
            <Link
              href={`/${TYPE_META[editKey.type].route}/${editKey.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-cyan-300"
            >
              <ExternalLink size={13} aria-hidden="true" />
              Open public page
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800/70 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 disabled:opacity-50"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => save("draft")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-600 hover:text-cyan-300 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => save("published")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            <Send size={14} aria-hidden="true" />
            {form.status === "published" ? "Update & Publish" : "Publish"}
          </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm ${
            message.kind === "ok"
              ? "border-emerald-600/50 bg-emerald-500/10 text-emerald-300"
              : "border-rose-600/50 bg-rose-500/10 text-rose-300"
          }`}
        >
          <CheckCircle2 size={15} aria-hidden="true" className="shrink-0" />
          <span>{message.text}</span>
          {message.route && (
            <Link
              href={message.route}
              target="_blank"
              className="ml-auto inline-flex items-center gap-1 font-medium underline"
            >
              View <ExternalLink size={12} />
            </Link>
          )}
        </div>
      )}

      {/* Metadata form */}
      <div className={`${card} p-5`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={label} htmlFor="f-type">
              Content Type
            </label>
            <select
              id="f-type"
              className={input}
              value={form.type}
              disabled={mode === "edit"}
              onChange={(e) => set("type", e.target.value as ContentType)}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].singular}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <label className={label} htmlFor="f-title">
              Title
            </label>
            <input
              id="f-title"
              className={input}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Production EKS Architecture"
            />
            {form.title.trim() && (
              <p className="mt-1 font-mono text-[11px] text-slate-600">
                /{TYPE_META[form.type].route}/
                {form.title
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, "")
                  .replace(/[\s_]+/g, "-")
                  .replace(/-+/g, "-")
                  .replace(/^-+|-+$/g, "")}
              </p>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className={label} htmlFor="f-desc">
              Description
            </label>
            <textarea
              id="f-desc"
              rows={2}
              className={input}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="One-sentence summary shown in listings and search results."
            />
          </div>

          <div>
            <label className={label} htmlFor="f-category">
              Category
            </label>
            <select
              id="f-category"
              className={input}
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label} htmlFor="f-tags">
              Tags <span className="normal-case text-slate-600">(comma separated)</span>
            </label>
            <input
              id="f-tags"
              className={input}
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="aws, eks, kubernetes"
            />
          </div>

          <div>
            <label className={label} htmlFor="f-author">
              Author
            </label>
            <input
              id="f-author"
              className={input}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              placeholder="DevOps-Atlas"
            />
          </div>

          <div>
            <label className={label} htmlFor="f-cover">
              Cover Image URL <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <input
              id="f-cover"
              className={input}
              value={form.cover}
              onChange={(e) => set("cover", e.target.value)}
              placeholder="https://…/cover.png"
            />
          </div>

          <div>
            <label className={label} htmlFor="f-date">
              Publish Date
            </label>
            <input
              id="f-date"
              type="date"
              className={input}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="f-difficulty">
              Difficulty <span className="normal-case text-slate-600">(optional)</span>
            </label>
            <select
              id="f-difficulty"
              className={input}
              value={form.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d || "none"} value={d}>
                  {d || "—"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Editor / Preview tabs (mobile) */}
      <div className="flex gap-2 lg:hidden" role="tablist" aria-label="Editor view">
        <button
          type="button"
          role="tab"
          aria-selected={view === "editor"}
          onClick={() => setView("editor")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            view === "editor"
              ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
              : "border-slate-800 bg-slate-900/50 text-slate-400"
          }`}
        >
          Editor
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "preview"}
          onClick={() => setView("preview")}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
            view === "preview"
              ? "border-cyan-600 bg-cyan-500/10 text-cyan-300"
              : "border-slate-800 bg-slate-900/50 text-slate-400"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Split editor + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${card} overflow-hidden ${view === "editor" ? "" : "hidden"} lg:block`}>
          <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 px-3 py-2">
            <span className="mr-2 hidden text-xs font-semibold uppercase tracking-wider text-slate-500 sm:inline">
              Markdown
            </span>
            {toolbar.map((btn, i) => {
              const Icon = btn.icon;
              return (
                <button
                  key={`${btn.title}-${i}`}
                  type="button"
                  title={btn.title}
                  aria-label={btn.title}
                  onClick={btn.run}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                >
                  <Icon size={15} aria-hidden="true" />
                </button>
              );
            })}
            <span className="ml-auto text-[11px] text-slate-600">
              {words} words · {readingTime(form.body)} min read
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={"Write your content in Markdown…\n\n## Heading\n\nLists, **tables**, `code` and ```fenced blocks``` are supported."}
            spellCheck
            className="min-h-[28rem] w-full resize-y bg-slate-950/60 p-4 font-mono text-[13px] leading-6 text-slate-200 placeholder:text-slate-600 focus:outline-none lg:min-h-[36rem]"
          />
        </div>

        <div
          className={`${card} min-w-0 overflow-hidden ${view === "preview" ? "" : "hidden"} lg:block`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Columns2 size={12} aria-hidden="true" className="mr-1 inline" />
              Preview
            </span>
            <span className="text-[11px] text-slate-600">renders like the published page</span>
          </div>
          <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6 lg:max-h-[42rem]">
            <article>
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={form.type} />
                <span className="rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">
                  {form.category}
                </span>
                {form.difficulty && (
                  <span className="rounded-md border border-slate-700/70 bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                    {form.difficulty}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                {form.title || "Untitled"}
              </h1>
              {form.description && (
                <p className="mt-2 text-sm leading-6 text-slate-400">{form.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{form.author || "DevOps-Atlas"}</span>
                <time dateTime={form.date}>{formatDate(form.date)}</time>
                <span>{readingTime(form.body)} min read</span>
                <span
                  className={
                    form.status === "published" ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {form.status}
                </span>
              </div>

              {preview.headings.length > 0 && (
                <div className="mt-5 border-b border-slate-800 pb-4">
                  <TableOfContents headings={preview.headings} />
                </div>
              )}

              <div className="mt-5">
                <MarkdownRenderer html={preview.html} />
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
