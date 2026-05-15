import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RenderContent } from "@/components/RenderContent";

export default function ChapterPage() {
  const { slug = "", chapterSlug = "" } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["chapter", slug, chapterSlug],
    queryFn: async () => {
      const { data: book } = await supabase.from("books").select("id,title,slug").eq("slug", slug).maybeSingle();
      if (!book) throw new Error("not_found");
      const { data: chapter } = await supabase.from("chapters")
        .select("*").eq("book_id", book.id).eq("slug", chapterSlug).maybeSingle();
      if (!chapter) throw new Error("not_found");
      const { data: sections } = await supabase.from("sections")
        .select("*").eq("chapter_id", chapter.id).order("position");
      const { data: allChapters } = await supabase.from("chapters")
        .select("slug,title,position").eq("book_id", book.id).order("position");
      return { book, chapter, sections: sections ?? [], allChapters: allChapters ?? [] };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-16 text-muted-foreground">Ladataan…</div>;
  if (error || !data) return <div className="mx-auto max-w-3xl px-6 py-16">Lukua ei löytynyt.</div>;

  const idx = data.allChapters.findIndex((c) => c.slug === chapterSlug);
  const prev = idx > 0 ? data.allChapters[idx - 1] : null;
  const next = idx < data.allChapters.length - 1 ? data.allChapters[idx + 1] : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link to={`/books/${slug}`} className="text-sm text-muted-foreground hover:text-foreground">
        ← {data.book.title}
      </Link>
      <h1 className="mt-6 text-4xl md:text-5xl">{data.chapter.title}</h1>

      <div className="mt-10 space-y-12">
        {data.sections.map((s) => (
          <section key={s.id}>
            {s.title && <h2 className="mb-4 text-2xl">{s.title}</h2>}
            <RenderContent content={s.content} />
          </section>
        ))}
      </div>

      <nav className="mt-16 flex justify-between border-t pt-6 text-sm">
        {prev ? (
          <Link to={`/books/${slug}/${prev.slug}`} className="hover:text-foreground text-muted-foreground">
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/books/${slug}/${next.slug}`} className="hover:text-foreground text-muted-foreground text-right">
            {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}
