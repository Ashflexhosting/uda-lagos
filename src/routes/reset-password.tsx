import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — UDA Lagos" },
      { name: "description", content: "Choose a new password for your UDA Lagos member portal account." },
      { property: "og:title", content: "Set a new password — UDA Lagos" },
      { property: "og:description", content: "Reset your member portal password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/portal" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8">
        <h1 className="font-serif text-3xl">Set a new password</h1>
        <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (8+ characters)"
          className="w-full rounded-md border border-input bg-background px-4 py-3" />
        <button className="w-full rounded-md bg-primary py-3 text-primary-foreground">Save password</button>
      </form>
    </div>
  );
}
