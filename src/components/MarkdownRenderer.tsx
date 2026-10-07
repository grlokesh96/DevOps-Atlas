import CodeBlock from "./CodeBlock";

export default function MarkdownRenderer({ html }: { html: string }) {
  return (
    <div className="markdown-body">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CodeBlock />
    </div>
  );
}
