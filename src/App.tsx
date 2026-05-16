import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import BookPage from "@/pages/BookPage";
import ChapterPage from "@/pages/ChapterPage";
import AdminLayout from "@/pages/AdminLayout";
import AdminIndex from "@/pages/AdminIndex";
import AdminBook from "@/pages/AdminBook";
import NotFound from "@/pages/NotFound";

function currentHashPath() {
  const hashPath = window.location.hash.replace(/^#/, "");
  if (hashPath) return hashPath.startsWith("/") ? hashPath : `/${hashPath}`;

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const path = window.location.pathname.replace(base, "") || "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function HashLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return <a href={`#${to}`} className={className}>{children}</a>;
}

function Header() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <HashLink to="/" className="font-serif text-2xl tracking-tight">Käyhkö</HashLink>
        <nav className="flex items-center gap-3 text-sm">
          <HashLink to="/" className="text-muted-foreground hover:text-foreground">Kirjat</HashLink>
          {isAdmin && <HashLink to="/admin" className="text-muted-foreground hover:text-foreground">Admin</HashLink>}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>Kirjaudu ulos</Button>
          ) : (
            <HashLink to="/login" className="text-muted-foreground hover:text-foreground">Kirjaudu</HashLink>
          )}
        </nav>
      </div>
    </header>
  );
}

function PageView() {
  const [path, setPath] = useState(currentHashPath);

  useEffect(() => {
    const onChange = () => setPath(currentHashPath());
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  const parts = path.split("/").filter(Boolean);

  if (path === "/" || path === "/books") return <Index />;
  if (path === "/login") return <Login />;
  if (path === "/admin") return <AdminLayout><AdminIndex /></AdminLayout>;
  if (parts[0] === "admin" && parts[1] === "books" && parts[2]) {
    return <AdminLayout><AdminBook bookId={parts[2]} /></AdminLayout>;
  }
  if (parts[0] === "books" && parts[1] && parts[2]) return <ChapterPage slug={parts[1]} chapterSlug={parts[2]} />;
  if (parts[0] === "books" && parts[1]) return <BookPage slug={parts[1]} />;
  return <NotFound />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <PageView />
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Harri Käyhkö
        </footer>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
