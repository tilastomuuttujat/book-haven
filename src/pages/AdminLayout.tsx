import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/login");
  }, [loading, user, nav]);

  if (loading) return <div className="p-10 text-muted-foreground">Ladataan…</div>;
  if (!user) return null;
  if (!isAdmin) return <div className="mx-auto max-w-md p-10 text-center"><p>Sinulla ei ole oikeuksia.</p></div>;

  return <Outlet />;
}
