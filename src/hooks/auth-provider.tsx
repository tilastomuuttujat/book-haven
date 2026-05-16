import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    const loadSession = async (s: Session | null) => {
      if (!active) return;
      setSession(s);
      setIsAdmin(false);

      if (!s?.user) {
        setLoading(false);
        qc.invalidateQueries();
        return;
      }

      const roleCheck = supabase.rpc("has_role", {
        _user_id: s.user.id,
        _role: "admin",
      });
      const timeout = new Promise<{ data: false }>((resolve) => {
        window.setTimeout(() => resolve({ data: false }), 3000);
      });
      const { data } = await Promise.race([roleCheck, timeout]);

      if (!active) return;
      setIsAdmin(!!data);
      setLoading(false);
      qc.invalidateQueries();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => void loadSession(s), 0);
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      await loadSession(s);
    }).catch(() => {
      if (!active) return;
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [qc]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
