import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/portal-ui";

type Row = Database["public"]["Tables"]["birthday_announcements"]["Row"];
const empty = { name: "", birthday: "", message: "", image_url: "", published: true };

export function AdminBirthdays() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const { data: rows = [], isPending, error } = useQuery({ queryKey: ["admin-birthdays"], queryFn: async () => {
    const { data, error } = await supabase.from("birthday_announcements").select("*").order("birthday");
    if (error) throw error;
    return data;
  } });
  const reset = () => { setEditing(null); setForm(empty); };
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ["admin-birthdays"] }); await qc.invalidateQueries({ queryKey: ["birthdays"] }); };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.birthday) { toast.error("Enter a name and birthday."); return; }
    setBusy(true);
    const values = { name: form.name.trim(), birthday: form.birthday, message: form.message.trim(), image_url: form.image_url.trim() || null, published: form.published };
    const res = editing ? await supabase.from("birthday_announcements").update(values).eq("id", editing).select("id").single() : await supabase.from("birthday_announcements").insert(values).select("id").single();
    setBusy(false);
    if (res.error) { toast.error("Unable to save. Please try again."); return; }
    toast.success("Birthday saved."); reset(); await refresh();
  }
  async function remove(r: Row) {
    if (!window.confirm(`Delete ${r.name}'s birthday?`)) return;
    const { error } = await supabase.from("birthday_announcements").delete().eq("id", r.id);
    if (error) { toast.error("Unable to delete."); return; }
    if (editing === r.id) reset();
    await refresh(); toast.success("Deleted.");
  }
  return <div className="grid gap-10 lg:grid-cols-2">
    <section className="min-w-0"><h2 className="mb-6 font-serif text-2xl">{editing ? "Edit birthday" : "New birthday"}</h2>
      <p className="mb-4 text-sm text-muted-foreground">Birthdays show on the homepage during their month, every year.</p>
      <form onSubmit={save} className="space-y-4">
        <label className="block text-sm">Name<input required maxLength={120} className={`${inputCls} mt-1`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label className="block text-sm">Birthday<input required type="date" className={`${inputCls} mt-1`} value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })}/></label>
        <label className="block text-sm">Message<textarea rows={3} maxLength={400} className={`${inputCls} mt-1`} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Happy birthday from all of us at UDA Lagos!"/></label>
        <label className="block text-sm">Photo URL (optional)<input className={`${inputCls} mt-1`} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}/></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })}/>Show on homepage</label>
        <div className="flex gap-3"><Button type="submit" disabled={busy}><Plus className="size-4"/>{busy ? "Saving…" : editing ? "Save changes" : "Add birthday"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}</div>
      </form>
    </section>
    <section className="min-w-0"><h2 className="mb-6 font-serif text-2xl">Birthdays</h2>
      {isPending && <p>Loading…</p>}{error && <p className="text-destructive">Unable to load birthdays.</p>}{!isPending && !error && !rows.length && <p className="text-muted-foreground">No birthdays yet.</p>}
      <div className="divide-y divide-border">{rows.map(r => <div key={r.id} className="flex items-start justify-between gap-4 py-4"><div className="min-w-0"><p className="text-sm text-muted-foreground">{r.birthday.slice(5)} · {r.published ? "Shown" : "Hidden"}</p><h3 className="break-words font-medium">{r.name}</h3></div><div className="flex shrink-0 gap-1"><Button size="icon" variant="ghost" aria-label={`Edit ${r.name}`} onClick={() => { setEditing(r.id); setForm({ name: r.name, birthday: r.birthday, message: r.message, image_url: r.image_url ?? "", published: r.published }); }}><Pencil className="size-4"/></Button><Button size="icon" variant="ghost" aria-label={`Delete ${r.name}`} onClick={() => remove(r)}><Trash2 className="size-4"/></Button></div></div>)}</div>
    </section>
  </div>;
}
