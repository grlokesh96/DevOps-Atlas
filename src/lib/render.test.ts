import { describe, expect, it } from "vitest";
import { escapeHtml, readingTime, renderMarkdown, toPlain } from "./render";

function words(count: number): string {
  return Array.from({ length: count }, () => "word").join(" ");
}

describe("readingTime", () => {
  it("never returns less than one minute", () => {
    expect(readingTime("")).toBe(1);
    expect(readingTime(words(10))).toBe(1);
  });

  it("rounds up roughly at 200 words per minute", () => {
    expect(readingTime(words(400))).toBe(2);
    expect(readingTime(words(300))).toBe(2);
  });
});

describe("escapeHtml", () => {
  it("escapes special characters", () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
  });
});

describe("toPlain", () => {
  it("removes markdown syntax", () => {
    const markdown = "# Title\n\nSome **bold** text with [a link](https://example.com) and `code`.";
    expect(toPlain(markdown)).toBe("Title Some bold text with a link and code.");
  });
});

describe("renderMarkdown", () => {
  it("extracts headings with slugged ids", () => {
    const { html, headings } = renderMarkdown("## Getting Started\n\nHello world.");
    expect(html).toContain('<h2 id="getting-started">Getting Started</h2>');
    expect(headings).toEqual([{ id: "getting-started", text: "Getting Started", level: 2 }]);
  });

  it("highlights fenced code blocks", () => {
    const { html } = renderMarkdown("```bash\necho hello\n```");
    expect(html).toContain('class="code-block"');
    expect(html).toContain('language-bash');
    expect(html).toContain('data-lang="bash"');
  });

  it("escapes unsafe HTML inside code fences", () => {
    const { html } = renderMarkdown("```\n<script>alert(1)</script>\n```");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
