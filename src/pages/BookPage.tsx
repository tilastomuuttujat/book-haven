import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withQueryTimeout } from "@/lib/query-timeout";

export default function BookPage({ slug }: { slug: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data: book, error } = await withQueryTimeout(supabase
        .from("books").select("*").eq("slug", slug).maybeSingle());
      if (error) throw error;
      if (!book) throw new Error("not_found");
      const { data: chapters } = await withQueryTimeout(supabase
        .from("chapters").select("*").eq("book_id", book.id).order("position"));
      return { book, chapters: chapters ?? [] };
    },
  });

  if (isLoading) return <div className="mx-auto max-w-3xl px-6 py-16 text-muted-foreground">Ladataan…</div>;
  if (error || !data) return <div className="mx-auto max-w-3xl px-6 py-16">Kirjaa ei löytynyt.</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <a href="#/" className="text-sm text-muted-foreground hover:text-foreground">← Kirjat</a>
      <h1 className="mt-6 text-5xl">{data.book.title}</h1>
      <p className="mt-2 text-muted-foreground">{data.book.author}</p>
      {data.book.description && <p className="mt-6 max-w-prose text-foreground/80">{data.book.description}</p>}

      <h2 className="mt-12 text-2xl">Sisällysluettelo</h2>
      <ol className="mt-4 space-y-2">
        {data.chapters.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#/books/${slug}/${c.slug}`}
              className="flex items-baseline gap-3 rounded px-2 py-2 hover:bg-secondary"
            >
              <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-serif text-lg">{c.title}</span>
            </a>
          </li>
        ))}
        {data.chapters.length === 0 && <li className="text-muted-foreground">Ei vielä lukuja.</li>}
      </ol>
    </div>
  );
}
