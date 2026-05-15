import { Routes, Route, Link } from "react-router-dom";
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

function Header() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-serif text-2xl tracking-tight">Käyhkö</Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">Kirjat</Link>
          {isAdmin && <Link to="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link>}
          {user ? (
            <Button variant="ghost" size="sm" onClick={signOut}>Kirjaudu ulos</Button>
          ) : (
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Kirjaudu</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/books" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/books/:slug" element={<BookPage />} />
            <Route path="/books/:slug/:chapterSlug" element={<ChapterPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminIndex />} />
              <Route path="books/:bookId" element={<AdminBook />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer className="border-t py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Harri Käyhkö
        </footer>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
