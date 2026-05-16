import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminIndex() {
  const qc = useQueryClient();
  const { data: books } = useQuery({
    queryKey: ["admin-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("Harri Käyhkö");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").insert({
        title, author, description: description || null,
        slug: slugify(title), position: (books?.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kirja lisätty");
      setTitle(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-4xl">Hallinta</h1>

      <section className="mt-10">
        <h2 className="text-2xl">Kirjat</h2>
        <div className="mt-4 space-y-2">
          {books?.map((b) => (
            <a key={b.id} href={`#/admin/books/${b.id}`}
              className="flex items-center justify-between rounded border bg-card p-4 hover:border-accent">
              <div>
                <div className="font-serif text-lg">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.author}</div>
              </div>
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border bg-card p-6">
        <h2 className="text-xl">Lisää uusi kirja</h2>
        <div className="mt-4 grid gap-4">
          <div className="space-y-2"><Label>Otsikko</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label>Kirjoittaja</Label><Input value={author} onChange={(e) => setAuthor(e.target.value)} /></div>
          <div className="space-y-2"><Label>Kuvaus</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending}>
            <Plus className="mr-1 h-4 w-4" /> Lisää
          </Button>
        </div>
      </section>
    </div>
  );
}
