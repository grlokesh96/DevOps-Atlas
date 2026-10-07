import {
  Briefcase,
  FileText,
  FlaskConical,
  Megaphone,
  PenLine,
  StickyNote,
  Terminal,
  Wrench,
} from "lucide-react";
import { TYPE_META } from "@/lib/meta";
import type { ContentType } from "@/lib/types";

const STYLES: Record<ContentType, string> = {
  article: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
  blog: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  note: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  post: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  lab: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  troubleshooting: "border-rose-500/25 bg-rose-500/10 text-rose-300",
  command: "border-lime-500/25 bg-lime-500/10 text-lime-300",
  interview: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
};

const ICONS: Record<ContentType, typeof FileText> = {
  article: FileText,
  blog: PenLine,
  note: StickyNote,
  post: Megaphone,
  lab: FlaskConical,
  troubleshooting: Wrench,
  command: Terminal,
  interview: Briefcase,
};

export default function TypeBadge({ type }: { type: ContentType }) {
  const Icon = ICONS[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[type]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {TYPE_META[type].singular}
    </span>
  );
}
