import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const input = "w-full rounded-md border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

export function NewsletterSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!address) return;
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: address,
      name: name.trim() || null,
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") { setDone(true); return; }
      toast.error("Couldn't sign you up. Please try again.");
      return;
    }
    setDone(true);
  }

  return (
    <section className="border-t border-border bg-secondary">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">Stay in the loop</p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">Get news and event updates by email</h2>
          <p className="mt-3 text-muted-foreground">
            Leave your email and we'll let you know when the association publishes news or announces an event.
          </p>
        </div>
        {done ? (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
            <MailCheck className="size-8 shrink-0 text-primary" />
            <div>
              <p className="font-serif text-xl">You're on the list</p>
              <p className="mt-1 text-sm text-muted-foreground">We'll email you when there's news or a new event.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
            <input maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className={input} />
            <input required type="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className={input} />
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing you up…" : "Sign me up"}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
