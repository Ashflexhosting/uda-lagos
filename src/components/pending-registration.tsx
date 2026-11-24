import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/portal-ui";
import { validateRegistrationName } from "@/lib/registration";

export function PendingRegistration({ userId, initialName }: { userId: string; initialName: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const { data: request, isPending, error, refetch } = useQuery({
    queryKey: ["my-registration", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("member_registrations").select("id,full_name,status").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
  useEffect(() => {
    if (request?.status === "approved") void qc.invalidateQueries({ queryKey: ["account"] });
  }, [request?.status, qc]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.rpc("submit_my_registration", { _full_name: validateRegistrationName(name) });
      if (error) throw error;
      await refetch();
      toast.success("Your name has been sent to an officer for verification.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your request.");
    } finally { setBusy(false); }
  }

  if (isPending) return <p className="text-muted-foreground">Loading your registration…</p>;
  if (error) return <div role="alert" className="space-y-3"><p className="text-destructive">Unable to load your registration.</p><Button variant="outline" onClick={() => void refetch()}>Try again</Button></div>;
  if (request?.status === "pending" || request?.status === "approved") return (
    <section className="max-w-xl space-y-4 py-6">
      {request.status === "pending" ? <Clock className="h-8 w-8 text-primary" /> : <ShieldCheck className="h-8 w-8 text-primary" />}
      <h2 className="font-serif text-2xl">{request.status === "pending" ? "Awaiting officer approval" : "Membership approved"}</h2>
      <p className="font-semibold">{request.full_name}</p>
      <p className="text-sm text-muted-foreground">{request.status === "pending" ? "An officer will verify your identity and match your name to the register. Your membership number and account remain private until approval." : "Your membership number and account are now available."}</p>
      <Button variant="outline" onClick={() => { void refetch(); void qc.invalidateQueries({ queryKey: ["account"] }); }}>Refresh status</Button>
    </section>
  );
  return (
    <section className="max-w-xl space-y-4 py-6">
      <h2 className="font-serif text-2xl">Verify your membership</h2>
      <p className="text-sm text-muted-foreground">{request?.status === "rejected" ? "Your previous request was not approved. Check your name with an officer before submitting again." : "Enter your full name as it appears on the association register. An officer will confirm your identity before linking your account."}</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-medium" htmlFor="registration-name">Full name</label>
        <input id="registration-name" required minLength={3} maxLength={150} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputCls} />
        <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit for approval"}</Button>
      </form>
    </section>
  );
}