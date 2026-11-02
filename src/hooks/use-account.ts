import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function useAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const { data: member } = await supabase.from("member_balances").select("*").eq("user_id", u.user.id).maybeSingle();
      return {
        user: u.user,
        isAdmin: !!roles?.some((r) => r.role === "admin"),
        member,
      };
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}
