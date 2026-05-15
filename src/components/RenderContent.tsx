import { generateHTML } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";

export function RenderContent({ content }: { content: unknown }) {
  const html = useMemo(() => {
    try {
      const doc = (content && typeof content === "object" ? content : { type: "doc", content: [] }) as never;
      return generateHTML(doc, [StarterKit]);
    } catch {
      return "";
    }
  }, [content]);
  return <div className="prose-reader" dangerouslySetInnerHTML={{ __html: html }} />;
}
