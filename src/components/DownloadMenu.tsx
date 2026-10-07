"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Download, FileCode2, FileText, Printer } from "lucide-react";
import type { ContentMeta } from "@/lib/types";

function saveBlob(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function buildFrontmatter(item: ContentMeta): string {
  const lines = [
    "---",
    `title: ${JSON.stringify(item.title)}`,
    `description: ${JSON.stringify(item.description)}`,
    `type: ${item.type}`,
    `category: ${JSON.stringify(item.category)}`,
    `tags: [${item.tags.join(", ")}]`,
  ];
  if (item.difficulty) lines.push(`difficulty: ${JSON.stringify(item.difficulty)}`);
  lines.push(`author: ${JSON.stringify(item.author)}`);
  if (item.cover) lines.push(`cover: ${JSON.stringify(item.cover)}`);
  lines.push(`published: ${item.published}`, `date: ${item.date}`, "---", "");
  return lines.join("\n");
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[^\n]*\n?/g, " "))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>|-]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function DownloadMenu({
  item,
  body,
  html,
}: {
  item: ContentMeta;
  body: string;
  html: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const base = `devops-atlas-${item.slug}`;

  function downloadMarkdown() {
    saveBlob(`${base}.md`, "text/markdown", buildFrontmatter(item) + body.trim() + "\n");
    setOpen(false);
  }

  function downloadTxt() {
    const header = `${item.title}\n${"=".repeat(item.title.length)}\n\n${item.description}\n\n`;
    saveBlob(`${base}.txt`, "text/plain", header + toPlainText(body) + "\n");
    setOpen(false);
  }

  function printPdf() {
    setOpen(false);
    const w = window.open("", "_blank");
    if (!w) {
      window.alert("Allow popups to export as PDF, then choose “Save as PDF” in the print dialog.");
      return;
    }
    const styles = `
      body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 24px;color:#111;line-height:1.6}
      h1,h2,h3,h4{font-family:Helvetica,Arial,sans-serif;color:#0b1220;page-break-after:avoid}
      h2{border-bottom:1px solid #ddd;padding-bottom:4px}
      pre{background:#f6f8fa;border:1px solid #e1e4e8;border-radius:6px;padding:12px;overflow-x:auto;font-size:13px;white-space:pre-wrap;word-break:break-word}
      code{font-family:Menlo,Consolas,monospace;font-size:.9em}
      :not(pre)>code{background:#f0f1f3;padding:1px 5px;border-radius:4px}
      table{border-collapse:collapse;width:100%;margin:16px 0}
      th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;font-size:14px}
      th{background:#f6f8fa}
      blockquote{border-left:4px solid #22d3ee;margin:16px 0;padding:4px 16px;color:#334155;background:#f8fafc}
      img{max-width:100%}
      a{color:#0e7490}
      .meta{color:#64748b;font-size:13px;font-family:Helvetica,Arial,sans-serif}
    `;
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${item.title} — DevOps-Atlas</title><style>${styles}</style></head><body><h1>${item.title}</h1><p class="meta">${item.category} · ${item.author} · ${item.date} · ${item.readingTime} min read</p><p><em>${item.description}</em></p><hr>${html}</body></html>`,
    );
    w.document.close();
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-600 hover:text-cyan-300"
      >
        <Download size={13} aria-hidden="true" />
        Download
        <ChevronDown size={12} aria-hidden="true" className={open ? "rotate-180" : ""} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={downloadMarkdown}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-cyan-300"
          >
            <FileCode2 size={14} aria-hidden="true" className="text-cyan-500" />
            Markdown (.md)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={downloadTxt}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-cyan-300"
          >
            <FileText size={14} aria-hidden="true" className="text-emerald-500" />
            Plain text (.txt)
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={printPdf}
            className="flex w-full items-center gap-2 border-t border-slate-800 px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-900 hover:text-cyan-300"
          >
            <Printer size={14} aria-hidden="true" className="text-amber-500" />
            PDF (print dialog)
          </button>
        </div>
      )}
    </div>
  );
}
