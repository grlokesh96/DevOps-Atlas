import type { Metadata } from "next";
import Link from "next/link";
import InterviewPrep from "@/components/InterviewPrep";
import { INTERVIEW_CATEGORIES, INTERVIEW_QUESTIONS } from "@/data/interview";

export const metadata: Metadata = {
  title: "Interview Prep",
  description:
    "DevOps and platform engineering interview questions with model answers — Kubernetes, Docker, Linux, AWS, Terraform, CI/CD, security and more.",
  alternates: { canonical: "/interview" },
  openGraph: {
    title: "Interview Prep — DevOps-Atlas",
    description: "DevOps interview questions with model answers.",
    url: "/interview",
  },
};

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">
          Career
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Interview Prep
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Real questions asked for DevOps, SRE and platform roles — each with a concise model
          answer you can use as a study base. Filter by topic, search by keyword, expand to read.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
          <span>
            <strong className="text-slate-200">{INTERVIEW_QUESTIONS.length}</strong> questions
          </span>
          <span>
            <strong className="text-slate-200">{INTERVIEW_CATEGORIES.length}</strong> topics
          </span>
          <span>
            <strong className="text-slate-200">
              {INTERVIEW_QUESTIONS.filter((q) => q.difficulty === "Beginner").length}
            </strong>{" "}
            beginner-friendly
          </span>
        </div>
      </header>

      <div className="mt-8">
        <InterviewPrep />
      </div>

      <section className="mt-14 rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Keep going
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/interview/kubernetes-interview-questions"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Kubernetes deep-dive notes
          </Link>
          <Link
            href="/troubleshooting"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Troubleshooting runbooks
          </Link>
          <Link
            href="/commands"
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-cyan-600 hover:text-cyan-300"
          >
            Command Atlas
          </Link>
        </div>
      </section>
    </div>
  );
}
