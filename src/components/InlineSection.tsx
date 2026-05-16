import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  sectionId: string;
  initialContent: unknown;
  editable: boolean;
};

export function InlineSection({ sectionId, initialContent, editable }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(JSON.stringify(initialContent ?? {}));

  const save = useMutation({
    mutationFn: async (content: unknown) => {
      const { error } = await supabase
        .from("sections")
        .update({ content: content as never })
        .eq("id", sectionId);
      if (error) throw error;
    },
    onMutate: () => setStatus("saving"),
    onSuccess: () => {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    },
    onError: () => setStatus("idle"),
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: (initialContent as object) ?? { type: "doc", content: [] },
    editable,
    editorProps: { attributes: { class: "prose-reader focus:outline-none" } },
    onUpdate: ({ editor }) => {
      if (!editable) return;
      const json = editor.getJSON();
      const s = JSON.stringify(json);
      if (s === lastSaved.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastSaved.current = s;
        save.mutate(json);
      }, 1200);
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  const Btn = ({
    onClick,
    active,
    children,
    label,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded hover:bg-accent ${
        active ? "bg-accent text-accent-foreground" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="relative">
      {editable && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 rounded-md border bg-popover p-1 shadow-md"
        >
          <Btn label="Lihavoi" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <Bold className="h-4 w-4" />
          </Btn>
          <Btn label="Kursivoi" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <Italic className="h-4 w-4" />
          </Btn>
          <div className="mx-1 h-5 w-px bg-border" />
          <Btn
            label="Otsikko 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
          >
            <Heading2 className="h-4 w-4" />
          </Btn>
          <Btn
            label="Otsikko 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
          >
            <Heading3 className="h-4 w-4" />
          </Btn>
          <div className="mx-1 h-5 w-px bg-border" />
          <Btn
            label="Lista"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
          >
            <List className="h-4 w-4" />
          </Btn>
          <Btn
            label="Numeroitu lista"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </Btn>
          <Btn
            label="Lainaus"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
          >
            <Quote className="h-4 w-4" />
          </Btn>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />

      {editable && status !== "idle" && (
        <div className="pointer-events-none absolute -top-6 right-0 flex items-center gap-1 text-xs text-muted-foreground">
          {status === "saving" ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Tallennetaan…
            </>
          ) : (
            <>
              <Check className="h-3 w-3" /> Tallennettu
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function InlineSectionTitle({
  sectionId,
  initialTitle,
  editable,
}: {
  sectionId: string;
  initialTitle: string | null;
  editable: boolean;
}) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("sections")
        .update({ title: value || null })
        .eq("id", sectionId);
      if (error) throw error;
    },
  });

  if (!editable) {
    return title ? <h2 className="mb-4 text-2xl">{title}</h2> : null;
  }

  return (
    <input
      value={title}
      onChange={(e) => {
        setTitle(e.target.value);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => save.mutate(e.target.value), 800);
      }}
      placeholder="Osion otsikko (valinnainen)"
      className="mb-4 w-full bg-transparent text-2xl font-serif outline-none placeholder:text-muted-foreground/50 focus:placeholder:text-muted-foreground"
    />
  );
}
