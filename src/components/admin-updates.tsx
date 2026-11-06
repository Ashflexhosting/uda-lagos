import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/portal-ui";

type Update = Database["public"]["Tables"]["association_updates"]["Row"];
const empty = { title: "", body: "", kind: "news", event_date: "", location: "", image_url: "", published: false };
export function AdminUpdates() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const { data: updates = [], isPending, error } = useQuery({ queryKey: ["admin-updates"], queryFn: async () => {
    const { data, error } = await supabase.from("association_updates").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } });
  function reset() { setEditing(null); setForm(empty); }
  function edit(item: Update) {
    setEditing(item.id);
    setForm({ title: item.title, body: item.body, kind: item.kind, event_date: item.event_date ?? "", location: item.location ?? "", image_url: item.image_url ?? "", published: item.published });
  }
  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin-updates"] });
    await qc.invalidateQueries({ queryKey: ["published-updates"] });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error("Enter a title and details."); return; }
    setBusy(true);
    try {
      const dated = form.kind === 'event' || form.kind === 'meeting';
      const values = { ...form, title: form.title.trim(), body: form.body.trim(), event_date: dated ? form.event_date || null : null, location: dated ? form.location.trim() || null : null, image_url: form.image_url.trim() || null };
      const result = editing ? await supabase.from("association_updates").update(values).eq("id", editing).select("id").single() : await supabase.from("association_updates").insert(values).select("id").single();
      if (result.error) throw result.error;
      toast.success(form.published ? "Update published." : "Draft saved.");
      reset(); await refresh();
    } catch { toast.error("Unable to save the update. Please try again."); }
    finally { setBusy(false); }
  }
  async function remove(item: Update) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    const { error } = await supabase.from("association_updates").delete().eq("id", item.id).select("id").single();
    if (error) { toast.error("Unable to delete this update."); return; }
    if (editing === item.id) reset();
    await refresh(); toast.success("Update deleted.");
  }
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <section className="min-w-0"><h2 className="mb-6 font-serif text-2xl">{editing ? "Edit update" : "New update"}</h2>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm">Type<select className={`${inputCls} mt-1`} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}><option value="news">News</option><option value="event">Event</option><option value="meeting">Meeting</option></select></label>
        <label className="block text-sm">Title<input required maxLength={200} className={`${inputCls} mt-1`} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
        <label className="block text-sm">Details<textarea required rows={7} className={`${inputCls} mt-1`} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}/></label>
        <label className="block text-sm">Logo image URL<input className={`${inputCls} mt-1`} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="/__l5e/assets-v1/…/logo.jpg"/></label>
        {(form.kind === 'event' || form.kind === 'meeting') && <><label className="block text-sm">Event date<input required type="date" className={`${inputCls} mt-1`} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })}/></label><label className="block text-sm">Venue<input className={`${inputCls} mt-1`} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></label></>}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}/>Published</label>
        <div className="flex gap-3"><Button type="submit" disabled={busy}><Plus className="size-4"/>{busy ? "Saving…" : editing ? "Save changes" : "Save update"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}</div>
      </form>
    </section>
    <section className="min-w-0"><h2 className="mb-6 font-serif text-2xl">News & Events</h2>{isPending && <p>Loading…</p>}{error && <p className="text-destructive">Unable to load updates.</p>}{!isPending && !error && !updates.length && <p className="text-muted-foreground">No updates yet.</p>}
      <div className="divide-y divide-border">{updates.map(item => <div key={item.id} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><p className="text-sm text-muted-foreground">{item.kind === 'event' ? 'Event' : item.kind === 'meeting' ? 'Meeting' : 'News'} · {item.published ? 'Published' : 'Draft'}</p><h3 className="break-words font-medium">{item.title}</h3>{item.event_date && <p className="text-sm text-muted-foreground">{item.event_date}</p>}</div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" title="Edit update" aria-label={`Edit ${item.title}`} onClick={() => edit(item)}><Pencil className="size-4"/></Button><Button size="icon" variant="ghost" title="Delete update" aria-label={`Delete ${item.title}`} onClick={() => remove(item)}><Trash2 className="size-4"/></Button></div></div>)}</div>
    </section>
  </div>;
}