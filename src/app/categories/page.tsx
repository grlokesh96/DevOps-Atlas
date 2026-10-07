import type { Metadata } from "next";
import CategoryCard from "@/components/CategoryCard";
import { CATEGORIES, getCategoryCounts, getAllContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Browse DevOps-Atlas by category — AWS, Kubernetes, Terraform, Docker, CI/CD, DevSecOps, Linux, Monitoring, Platform Engineering and Python.",
  alternates: { canonical: "/categories" },
};

export default function CategoriesPage() {
  const counts = getCategoryCounts();
  const total = getAllContent().length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Browse</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Categories</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {CATEGORIES.length} categories · {total} published items
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category} name={category} count={counts.get(category) ?? 0} />
        ))}
      </div>
    </div>
  );
}
