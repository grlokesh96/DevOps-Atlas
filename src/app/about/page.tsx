import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FlaskConical,
  MessageSquareText,
  NotebookTabs,
  StickyNote,
  Terminal,
  FileText,
  Wrench,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { TYPE_META, CONTENT_TYPES, getStats } from "@/lib/content";

export const revalidate = 15;

export const metadata: Metadata = {
  title: "About",
  description:
    "DevOps-Atlas is a practical knowledge base for DevOps, Cloud & Platform Engineering — Navigate. Learn. Build. Operate.",
  alternates: { canonical: "/about" },
};

const ICONS: Record<string, LucideIcon> = {
  article: FileText,
  blog: NotebookTabs,
  note: StickyNote,
  post: MessageSquareText,
  lab: FlaskConical,
  troubleshooting: Wrench,
  command: Terminal,
  interview: Briefcase,
};

const PRINCIPLES = [
  {
    title: "Local-first content",
    body: "Every article, note and lab lives as a Markdown file in the repository. No CMS, no database, no lock-in.",
  },
  {
    title: "Fast by default",
    body: "Static rendering, minimal JavaScript and server components keep pages instant on any device.",
  },
  {
    title: "Practical over theoretical",
    body: "Content follows problem → diagnosis → solution shapes you can apply in real environments.",
  },
  {
    title: "One knowledge base",
    body: "Articles, blogs, notes, posts, labs, troubleshooting, commands and interview prep — unified under one search.",
  },
];

export default function AboutPage() {
  const stats = getStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">About</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          DevOps<span className="text-cyan-400">-Atlas</span>
        </h1>
        <p className="mt-3 text-lg text-slate-400">Navigate. Learn. Build. Operate.</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          A practical knowledge base for DevOps, Cloud &amp; Platform Engineering.
        </p>
      </header>

      <section className="mt-8" aria-labelledby="about-what">
        <h2 id="about-what" className="text-lg font-semibold text-slate-100">
          What is DevOps-Atlas?
        </h2>
        <div className="mt-3 space-y-4 text-sm leading-7 text-slate-400">
          <p>
            DevOps-Atlas is a personal platform for publishing and organizing technical blogs,
            articles, DevOps notes, tutorials, short posts, troubleshooting guides, interview
            notes, labs and command references — all in one searchable place.
          </p>
          <p>
            The goal is simple: create, preview, publish, browse, search and download knowledge
            without fighting tooling. Content is plain Markdown, the site is static-first, and the
            whole thing stays minimal, fast and maintainable.
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="about-types">
        <h2 id="about-types" className="text-lg font-semibold text-slate-100">Content types</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONTENT_TYPES.map((type) => {
            const Icon = ICONS[type];
            return (
              <Link
                key={type}
                href={`/${TYPE_META[type].route}`}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-cyan-700/60"
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-cyan-400" aria-hidden="true" />
                  <p className="font-semibold text-slate-100 group-hover:text-cyan-300">
                    {TYPE_META[type].label}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  {TYPE_META[type].description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="about-principles">
        <h2 id="about-principles" className="text-lg font-semibold text-slate-100">
          Principles
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm font-semibold text-slate-200">{principle.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.06] p-6" aria-labelledby="about-stats">
        <h2 id="about-stats" className="text-lg font-semibold text-slate-100">
          Knowledge base at a glance
        </h2>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
          <span>
            <strong className="text-cyan-300">{stats.articles}</strong> articles
          </span>
          <span>
            <strong className="text-cyan-300">{stats.notes}</strong> notes
          </span>
          <span>
            <strong className="text-cyan-300">{stats.posts}</strong> posts
          </span>
          <span>
            <strong className="text-cyan-300">{stats.labs}</strong> labs
          </span>
          <span>
            <strong className="text-cyan-300">{stats.commands}</strong> commands
          </span>
        </div>
        <Link
          href="/search"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <BookOpen size={15} aria-hidden="true" />
          Start exploring
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
