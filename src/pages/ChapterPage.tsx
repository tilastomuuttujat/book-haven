import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { InlineSection, InlineSectionTitle } from "@/components/InlineSection";

export default function ChapterPage({ slug, chapterSlug }: { slug: string; chapterSlug: string }) {
  const { isAdmin } = useAuth();

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
      <div className="flex items-center justify-between">
        <a href={`#/books/${slug}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {data.book.title}
        </a>
        {isAdmin && (
          <span className="rounded-full border bg-accent/30 px-3 py-1 text-xs text-muted-foreground">
            Muokkaustila — valitse tekstiä muotoillaksesi
          </span>
        )}
      </div>
      <h1 className="mt-6 text-4xl md:text-5xl">{data.chapter.title}</h1>

      <div className="mt-10 space-y-12">
        {data.sections.map((s) => (
          <section key={s.id}>
            <InlineSectionTitle sectionId={s.id} initialTitle={s.title} editable={isAdmin} />
            <InlineSection sectionId={s.id} initialContent={s.content} editable={isAdmin} />
          </section>
        ))}
      </div>

      <nav className="mt-16 flex justify-between border-t pt-6 text-sm">
        {prev ? (
          <a href={`#/books/${slug}/${prev.slug}`} className="hover:text-foreground text-muted-foreground">
            ← {prev.title}
          </a>
        ) : <span />}
        {next ? (
          <a href={`#/books/${slug}/${next.slug}`} className="hover:text-foreground text-muted-foreground text-right">
            {next.title} →
          </a>
        ) : <span />}
      </nav>
    </article>
  );
}
