import { Marked } from "marked";
import hljs from "highlight.js";
import { slugify } from "./meta";
import type { Heading } from "./types";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const marked = new Marked({
    gfm: true,
    breaks: false,
    renderer: {
      heading(token: any) {
        const id = slugify(token.text);
        headings.push({ id, text: token.text, level: token.depth });
        const inner = this.parser.parseInline(token.tokens);
        return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
      },
      code({ text, lang }: any) {
        const language = /^[a-zA-Z0-9_+-]*/.exec(lang || "")?.[0] ?? "";
        let highlighted = escapeHtml(text);
        try {
          if (language && hljs.getLanguage(language)) {
            highlighted = hljs.highlight(text, { language, ignoreIllegals: true }).value;
          }
        } catch {
          /* fall back to escaped text */
        }
        const label = language || "code";
        return `<pre class="code-block"><code class="hljs language-${escapeHtml(language)}" data-lang="${escapeHtml(label)}">${highlighted}</code></pre>\n`;
      },
    },
  });
  const html = marked.parse(markdown) as string;
  return { html, headings };
}

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function toPlain(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[^\n]*\n?/g, " "))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>|-]{1,3}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
