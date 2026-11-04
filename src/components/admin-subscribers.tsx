import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { downloadFile, toCsv } from "@/lib/members";

type Subscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

export function AdminSubscribers() {
  const qc = useQueryClient();
  const { data: subscribers = [], isPending, error, refetch } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function remove(s: Subscriber) {
    if (!window.confirm(`Remove ${s.email} from the list?`)) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", s.id);
    if (error) { toast.error("Unable to remove this subscriber."); return; }
    await qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
    toast.success("Subscriber removed.");
  }

  function exportCsv() {
    const csv = toCsv(
      ["Name", "Email", "Signed up"],
      subscribers.map((s) => [s.name ?? "", s.email, new Date(s.created_at).toLocaleDateString("en-GB")]),
    );
    downloadFile("newsletter-subscribers.csv", csv);
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl">Email subscribers ({subscribers.length})</h2>
        <Button variant="outline" onClick={exportCsv} disabled={!subscribers.length}>
          <Download className="size-4" /> Export list (CSV)
        </Button>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Visitors who signed up on the News &amp; Events page. Export the list to send announcements through your own email service.
      </p>
      {isPending && <p className="text-muted-foreground">Loading subscribers…</p>}
      {error && (
        <div role="alert" className="space-y-3 py-4">
          <p className="text-destructive">Unable to load subscribers. Please try again.</p>
          <Button variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      )}
      {!isPending && !error && !subscribers.length && <p className="text-muted-foreground">No subscribers yet.</p>}
      <div className="divide-y divide-border">
        {subscribers.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{s.email}</p>
              <p className="text-sm text-muted-foreground">
                {s.name ? `${s.name} · ` : ""}Signed up {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <Button size="icon" variant="ghost" title="Remove subscriber" aria-label={`Remove ${s.email}`} onClick={() => remove(s)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
