import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) window.location.hash = "#/login";
  }, [loading, user]);

  if (loading) return <div className="p-10 text-muted-foreground">Tarkistetaan kirjautumista…</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="mx-auto max-w-md p-10 text-center"><p>Sinulla ei ole oikeuksia.</p></div>;

  return <>{children}</>;
}
