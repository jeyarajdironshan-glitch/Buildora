import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function useAccount() {
  const { user, ready } = useUser();
  const q = useQuery({
    queryKey: ["account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: roles }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user!.id),
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
      ]);
      const r = (roles ?? []).map((x) => x.role);
      return { roles: r, profile, role: r.includes("admin") ? "admin" : r.includes("company") ? "company" : "customer" } as const;
    },
  });
  return { user, ready: ready && (!user || !q.isLoading), account: q.data };
}
