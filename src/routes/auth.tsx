import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ASSOCIATION, memberLoginEmail } from "@/lib/members";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UDA Lagos Member Portal" },
      { name: "description", content: "Sign in with your member number, email or Google account." },
      { property: "og:title", content: "Sign in — UDA Lagos Member Portal" },
      { property: "og:description", content: "Sign in to the UDA Lagos member portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "member" | "email" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("member");
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/portal" }));
    const { data } = supabase.auth.onAuthStateChange((e) => e === "SIGNED_IN" && navigate({ to: "/portal" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "member") {
        const { error } = await supabase.auth.signInWithPassword({ email: memberLoginEmail(id), password });
        if (error) throw new Error("Member number or password is incorrect. Ask an officer to set up your login.");
      } else if (mode === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/portal" } });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  const input = "w-full rounded-md border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{ASSOCIATION}</Link>
        <h1 className="mt-2 font-serif text-3xl">
          {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}
        </h1>

        {(mode === "member" || mode === "email") && (
          <div className="mt-6 grid grid-cols-2 rounded-md bg-muted p-1 text-sm">
            {(["member", "email"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`rounded py-2 ${mode === m ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {m === "member" ? "Member number" : "Email"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "member" ? (
            <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Member number e.g. UDAL004" className={input} />
          ) : (
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className={input} />
          )}
          {mode !== "forgot" && (
            <input required type="password" minLength={mode === "signup" ? 8 : undefined} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={input} />
          )}
          <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <button onClick={google} className="w-full rounded-md border border-input py-3 text-sm font-medium hover:bg-accent">
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
          {mode === "email" && <button onClick={() => setMode("forgot")} className="underline">Forgot password?</button>}
          {mode !== "signup" ? (
            <p>New here? <button onClick={() => setMode("signup")} className="underline">Create an account with email</button></p>
          ) : (
            <p>Have an account? <button onClick={() => setMode("email")} className="underline">Sign in</button></p>
          )}
          {mode === "forgot" && <button onClick={() => setMode("email")} className="underline">Back to sign in</button>}
          <p className="pt-2 text-xs">Email and Google accounts link to your member record when the email matches the one the association has on file.</p>
        </div>
      </div>
    </div>
  );
}
