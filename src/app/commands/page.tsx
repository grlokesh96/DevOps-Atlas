import type { Metadata } from "next";
import Link from "next/link";
import CommandAtlas from "@/components/CommandAtlas";
import { COMMAND_ATLAS, COMMAND_GROUPS } from "@/data/commands";

export const metadata: Metadata = {
  title: "Command Atlas",
  description:
    "Curated, searchable command reference for Kubernetes, Docker, Linux, Git, networking, AWS CLI, Terraform and observability — with copy-to-clipboard.",
  alternates: { canonical: "/commands" },
  openGraph: {
    title: "Command Atlas — DevOps-Atlas",
    description: "Curated command reference for everyday DevOps operations.",
    url: "/commands",
  },
};

export default function CommandsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-cyan-500">
          Reference
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Command Atlas
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          The commands you actually type during operations — filtered by tool, explained in one
          line, and copyable with a click. Kubernetes, Docker, Linux, Git, networking, AWS CLI,
          Terraform and observability in one place.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>
            <strong className="text-slate-200">{COMMAND_ATLAS.length}</strong> commands
          </span>
          <span>
            <strong className="text-slate-200">{COMMAND_GROUPS.length}</strong> groups
          </span>
          <span>
            <strong className="text-slate-200">0</strong> dependencies to remember
          </span>
        </div>
      </header>

      <div className="mt-8">
        <CommandAtlas />
      </div>

      <section className="mt-14 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Related guides
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/commands/kubectl-essential-commands"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Kubernetes Essential Commands (guide)
          </Link>
          <Link
            href="/commands/linux-troubleshooting-commands"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Linux Troubleshooting Commands (guide)
          </Link>
          <Link
            href="/troubleshooting"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Troubleshooting library
          </Link>
        </div>
      </section>
    </div>
  );
}
