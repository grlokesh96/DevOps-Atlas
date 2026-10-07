"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";

export default function DownloadButton({
  filename,
  content,
  label = "Download",
}: {
  filename: string;
  content: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.endsWith(".md") ? filename : `${filename}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-600 hover:text-cyan-300"
    >
      {done ? <Check size={13} aria-hidden="true" /> : <Download size={13} aria-hidden="true" />}
      {done ? "Saved" : label}
    </button>
  );
}
