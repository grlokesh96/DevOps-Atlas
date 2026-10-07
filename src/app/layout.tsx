import type { Metadata } from "next";
import "highlight.js/styles/github-dark.css";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import Footer from "@/components/Footer";
import SearchShortcut from "@/components/SearchShortcut";

const SITE_URL = process.env.SITE_URL || "https://devops-atlas.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DevOps-Atlas — Navigate. Learn. Build. Operate.",
    template: "%s | DevOps-Atlas",
  },
  description:
    "A practical knowledge base for DevOps, Cloud & Platform Engineering — articles, blogs, notes, posts, labs, troubleshooting, commands and interview prep.",
  keywords: [
    "DevOps",
    "Cloud",
    "Kubernetes",
    "AWS",
    "Terraform",
    "Docker",
    "CI/CD",
    "DevSecOps",
    "Platform Engineering",
  ],
  applicationName: "DevOps-Atlas",
  authors: [{ name: "DevOps-Atlas" }],
  openGraph: {
    type: "website",
    siteName: "DevOps-Atlas",
    title: "DevOps-Atlas — Navigate. Learn. Build. Operate.",
    description:
      "A practical knowledge base for DevOps, Cloud & Platform Engineering.",
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "DevOps-Atlas — Navigate. Learn. Build. Operate.",
    description: "A practical knowledge base for DevOps, Cloud & Platform Engineering.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b14] font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-cyan-400 focus:px-4 focus:py-2 focus:font-semibold focus:text-slate-950"
        >
          Skip to content
        </a>

        <Sidebar />

        <div className="flex min-h-screen flex-col lg:pl-64">
          <MobileMenu />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>

        <SearchShortcut />
      </body>
    </html>
  );
}
