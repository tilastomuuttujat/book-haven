import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withQueryTimeout } from "@/lib/query-timeout";

export default function Index() {
  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const { data, error } = await withQueryTimeout(supabase
        .from("books")
        .select("*")
        .order("position", { ascending: true }));
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-5xl md:text-6xl">Kirjasto</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Harri Käyhkön julkaisemat tekstit – luettavissa verkossa.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Ladataan…</p>}
      {!isLoading && !books && <p className="text-muted-foreground">Sisältöä ei saatu ladattua. Päivitä sivu.</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {books?.map((b) => (
          <a
            key={b.id}
            href={`#/books/${b.slug}`}
            className="group rounded-lg border bg-card p-6 transition hover:border-accent hover:shadow-sm"
          >
            <h2 className="text-2xl group-hover:text-accent-foreground">{b.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{b.author}</p>
            {b.description && <p className="mt-3 text-sm leading-relaxed text-foreground/80">{b.description}</p>}
          </a>
        ))}
        {books?.length === 0 && (
          <p className="text-muted-foreground">Ei vielä kirjoja.</p>
        )}
      </div>
    </div>
  );
}
