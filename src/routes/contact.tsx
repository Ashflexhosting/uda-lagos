import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — UDA Lagos Branch" },
      { name: "description", content: "Get in touch with the Uzuakoli Development Association, Lagos Branch — join, ask about dues, or attend a meeting." },
      { property: "og:title", content: "Contact UDA Lagos" },
      { property: "og:description", content: "Join the association, ask about dues, or attend a meeting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

const input = "w-full rounded-md border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

function Contact() {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() || null, message: f.message.trim(),
    });
    setBusy(false);
    if (error) { toast.error("Couldn't send your message. Please try again."); return; }
    setSent(true);
  }

  return (
    <SiteLayout>
      <section className="overflow-hidden bg-meetings text-meetings-foreground">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-12 md:px-6 md:pb-12 md:pt-16">
          <div className="flex items-center gap-3 text-sm font-semibold text-gold-bright"><span className="h-px w-8 bg-gold-bright" aria-hidden="true" />UDA Lagos Branch</div>
          <div className="mt-5 flex items-center justify-between gap-6">
            <h1 className="font-serif text-4xl leading-tight sm:text-5xl md:text-6xl">We'd love to <span className="text-gold-bright">hear</span> from you</h1>
            <img src={emblem.url} alt="Uzuakoli Development Association emblem" width={112} height={112} className="hidden size-28 shrink-0 object-contain sm:block" />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-meetings-foreground/20 pt-5">
            <p className="text-sm text-meetings-foreground/80">Uzuakoli Development Association, Lagos Branch</p>
            <span className="flex items-center gap-2 text-sm font-medium text-gold-bright"><Mail className="size-4" />Get in touch</span>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-serif text-2xl">Reach the secretariat</h2>
            <p className="mt-2 text-muted-foreground">Send a message and an officer of the association will get back to you.</p>
          </div>
          <dl className="space-y-4 text-sm">
            <div><dt className="font-semibold">Phone</dt><dd><a className="text-muted-foreground hover:text-foreground" href="tel:+2348033208027">+234 803 320 8027</a></dd></div>
            <div><dt className="font-semibold">Email</dt><dd><a className="text-muted-foreground hover:text-foreground" href="mailto:info@udalagos.com.ng">info@udalagos.com.ng</a></dd></div>
            <div><dt className="font-semibold">Office</dt><dd className="text-muted-foreground">Spinal Cord Association Center, Ijesha, Lagos (via Lord Chosen)</dd></div>
            <div><dt className="font-semibold">Meetings</dt><dd className="text-muted-foreground">First Sunday of the month, 3pm at Spinal Cord Association Center, Ijesha, Lagos (via Lord Chosen)</dd></div>
            <div><dt className="font-semibold">Already a member?</dt><dd className="text-muted-foreground">Sign in to the member portal to check your balance</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {sent ? (
            <div className="py-10 text-center">
              <h2 className="font-serif text-3xl">Thank you</h2>
              <p className="mt-3 text-muted-foreground">Your message has been received. We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input required maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name" className={input} />
              <div className="grid gap-4 sm:grid-cols-2">
                <input required type="email" maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={input} />
                <input maxLength={40} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone (optional)" className={input} />
              </div>
              <textarea required maxLength={3000} rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} placeholder="How can we help?" className={input} />
              <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">{busy ? "Sending…" : "Send message"}</button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
