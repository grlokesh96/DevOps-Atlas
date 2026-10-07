"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CopyButton from "./CopyButton";

export default function CodeBlock() {
  const [blocks, setBlocks] = useState<HTMLElement[]>([]);

  useEffect(() => {
    const found = Array.from(
      document.querySelectorAll<HTMLElement>("pre.code-block:not([data-enhanced])"),
    );
    found.forEach((pre) => pre.setAttribute("data-enhanced", "true"));
    setBlocks(found);
    return () => {
      found.forEach((pre) => pre.removeAttribute("data-enhanced"));
    };
  }, []);

  if (typeof document === "undefined") return null;

  return (
    <>
      {blocks.map((pre, index) =>
        createPortal(
          <div className="absolute right-2 top-2 z-10">
            <CopyButton text={pre.querySelector("code")?.textContent ?? ""} />
          </div>,
          pre,
          `${index}-${pre.getAttribute("data-lang") ?? ""}`,
        ),
      )}
    </>
  );
}
