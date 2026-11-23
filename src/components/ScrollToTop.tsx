"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-40 hidden h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-300 shadow-lg shadow-black/30 backdrop-blur transition-colors hover:border-cyan-600 hover:text-cyan-300 sm:flex"
    >
      <ArrowUp size={18} aria-hidden="true" />
    </button>
  );
}
