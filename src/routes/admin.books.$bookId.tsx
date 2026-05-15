import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichEditor } from "@/components/RichEditor";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, ChevronUp, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/admin/books/$bookId")({
  component: EditBook,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function EditBook() {
  const { bookId } = Route.useParams();
  const qc = useQueryClient();

  const { data: book } = useQuery({
    queryKey: ["admin-book", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("*").eq("id", bookId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: chapters } = useQuery({
    queryKey: ["admin-chapters", bookId],
    queryFn: async () => {
      const { data, error } = await supabase.from("chapters").select("*").eq("book_id", bookId).order("position");
      if (error) throw error;
      return data;
    },
  });

  const [meta, setMeta] = useState({ title: "", author: "", description: "" });
  useEffect(() => {
    if (book) setMeta({ title: book.title, author: book.author, description: book.description ?? "" });
  }, [book]);

  const saveBook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").update({
        title: meta.title, author: meta.author, description: meta.description || null,
      }).eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tallennettu"); qc.invalidateQueries({ queryKey: ["books"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBook = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Kirja poistettu"); window.location.href = "/admin"; },
    onError: (e: Error) => toast.error(e.message),
  });

  const [newChapter, setNewChapter] = useState("");
  const addChapter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chapters").insert({
        book_id: bookId, title: newChapter, slug: slugify(newChapter),
        position: chapters?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => { setNewChapter(""); qc.invalidateQueries({ queryKey: ["admin-chapters", bookId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">← Hallinta</Link>

      <section className="mt-6 rounded-lg border bg-card p-6">
        <h1 className="text-2xl">Kirjan tiedot</h1>
        <div className="mt-4 grid gap-4">
          <div className="space-y-2"><Label>Otsikko</Label><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Kirjoittaja</Label><Input value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} /></div>
          <div className="space-y-2"><Label>Kuvaus</Label><Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
          <div className="flex justify-between">
            <Button onClick={() => saveBook.mutate()}><Save className="mr-1 h-4 w-4" /> Tallenna</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Poistetaanko kirja?")) deleteBook.mutate(); }}>
              <Trash2 className="mr-1 h-4 w-4" /> Poista kirja
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl">Luvut</h2>
        <div className="mt-4 space-y-3">
          {chapters?.map((c) => <ChapterEditor key={c.id} chapter={c} bookId={bookId} totalChapters={chapters.length} />)}
        </div>
        <div className="mt-6 flex gap-2">
          <Input placeholder="Uuden luvun otsikko" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} />
          <Button onClick={() => addChapter.mutate()} disabled={!newChapter}><Plus className="mr-1 h-4 w-4" /> Lisää luku</Button>
        </div>
      </section>
    </div>
  );
}

function ChapterEditor({ chapter, bookId, totalChapters }: { chapter: { id: string; title: string; slug: string; position: number }; bookId: string; totalChapters: number }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(chapter.title);
  const [open, setOpen] = useState(false);

  const { data: sections } = useQuery({
    queryKey: ["admin-sections", chapter.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("sections").select("*").eq("chapter_id", chapter.id).order("position");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const saveTitle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chapters").update({ title }).eq("id", chapter.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Luku tallennettu"); qc.invalidateQueries({ queryKey: ["admin-chapters", bookId] }); },
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chapters").delete().eq("id", chapter.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-chapters", bookId] }),
  });

  const move = useMutation({
    mutationFn: async (dir: -1 | 1) => {
      const { data: all } = await supabase.from("chapters").select("id,position").eq("book_id", bookId).order("position");
      if (!all) return;
      const i = all.findIndex((x) => x.id === chapter.id);
      const j = i + dir;
      if (j < 0 || j >= all.length) return;
      await supabase.from("chapters").update({ position: 9999 }).eq("id", all[i].id);
      await supabase.from("chapters").update({ position: all[i].position }).eq("id", all[j].id);
      await supabase.from("chapters").update({ position: all[j].position }).eq("id", all[i].id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-chapters", bookId] }),
  });

  const addSection = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sections").insert({
        chapter_id: chapter.id, title: null,
        content: { type: "doc", content: [{ type: "paragraph" }] },
        position: sections?.length ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sections", chapter.id] }),
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 p-3">
        <span className="font-mono text-xs text-muted-foreground w-6">{chapter.position + 1}</span>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
        <Button size="sm" variant="ghost" disabled={chapter.position === 0} onClick={() => move.mutate(-1)}><ChevronUp className="h-4 w-4" /></Button>
        <Button size="sm" variant="ghost" disabled={chapter.position === totalChapters - 1} onClick={() => move.mutate(1)}><ChevronDown className="h-4 w-4" /></Button>
        <Button size="sm" onClick={() => saveTitle.mutate()}>Tallenna</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>{open ? "Sulje" : "Avaa"}</Button>
        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Poistetaanko luku?")) del.mutate(); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-t p-4">
          {sections?.map((s) => <SectionEditor key={s.id} section={s} chapterId={chapter.id} />)}
          <Button variant="outline" onClick={() => addSection.mutate()}><Plus className="mr-1 h-4 w-4" /> Lisää osio</Button>
        </div>
      )}
    </div>
  );
}

function SectionEditor({ section, chapterId }: { section: { id: string; title: string | null; content: unknown }; chapterId: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(section.title ?? "");
  const [content, setContent] = useState<unknown>(section.content);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sections").update({
        title: title || null, content: content as object,
      }).eq("id", section.id);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Osio tallennettu"),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sections").delete().eq("id", section.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-sections", chapterId] }),
  });

  return (
    <div className="rounded border bg-background p-4">
      <div className="mb-3 flex gap-2">
        <Input placeholder="Osion otsikko (valinnainen)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button size="sm" onClick={() => save.mutate()}><Save className="mr-1 h-4 w-4" /> Tallenna</Button>
        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Poistetaanko osio?")) del.mutate(); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <RichEditor value={content} onChange={setContent} />
    </div>
  );
}
