import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading) return <div className="p-10 text-muted-foreground">Ladataan…</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="mx-auto max-w-md p-10 text-center"><p>Sinulla ei ole oikeuksia.</p></div>;

  return <Outlet />;
}
