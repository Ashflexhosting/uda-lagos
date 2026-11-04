import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ASSOCIATION, memberLoginEmail, phoneLoginEmail } from "@/lib/members";
import { checkNewEmail, signUpWithPhone } from "@/lib/signup.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UDA Lagos Member Portal" },
      { name: "description", content: "Existing members sign in with their membership number; new members join with email or phone." },
      { property: "og:title", content: "Sign in — UDA Lagos Member Portal" },
      { property: "og:description", content: "Sign in to the UDA Lagos member portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "member" | "email" | "phone" | "signup" | "forgot";
type Via = "email" | "phone";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("member");
  const [via, setVia] = useState<Via>("email");
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
        if (error) throw new Error("Membership number or password is incorrect. Ask an officer to set up your login.");
      } else if (mode === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "phone") {
        const { error } = await supabase.auth.signInWithPassword({ email: phoneLoginEmail(phone), password });
        if (error) throw new Error("Phone number or password is incorrect.");
      } else if (mode === "signup") {
        if (via === "phone") {
          await signUpWithPhone({ data: { phone, password } });
          const { error } = await supabase.auth.signInWithPassword({ email: phoneLoginEmail(phone), password });
          if (error) throw error;
        } else {
          await checkNewEmail({ data: { email } });
          const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/portal" } });
          if (error) throw error;
          toast.success("Check your email to confirm your account.");
        }
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
  const tab = (active: boolean) => `rounded py-2 ${active ? "bg-card shadow-sm" : "text-muted-foreground"}`;
  const usesPhone = mode === "phone" || (mode === "signup" && via === "phone");

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{ASSOCIATION}</Link>
        <h1 className="mt-2 font-serif text-3xl">
          {mode === "signup" ? "Join as a new member" : mode === "forgot" ? "Reset password" : "Sign in"}
        </h1>

        {(mode === "member" || mode === "email" || mode === "phone") && (
          <div className="mt-6 grid grid-cols-3 rounded-md bg-muted p-1 text-sm">
            {(["member", "email", "phone"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={tab(mode === m)}>
                {m === "member" ? "Member no." : m === "email" ? "Email" : "Phone"}
              </button>
            ))}
          </div>
        )}
        {mode === "member" && (
          <p className="mt-3 text-sm text-muted-foreground">Already on the association's register? Sign in with your membership number.</p>
        )}

        {mode === "signup" && (
          <>
            <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Only for people not yet on the register. Existing members should{" "}
              <button type="button" onClick={() => setMode("member")} className="underline">sign in with their membership number</button>.
            </p>
            <div className="mt-4 grid grid-cols-2 rounded-md bg-muted p-1 text-sm">
              {(["email", "phone"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVia(v)} className={tab(via === v)}>
                  {v === "email" ? "With email" : "With phone"}
                </button>
              ))}
            </div>
          </>
        )}

        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "member" ? (
            <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Membership number e.g. UDAL004" className={input} />
          ) : usesPhone ? (
            <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number e.g. 0803 000 0000" className={input} />
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

        {mode !== "forgot" && mode !== "member" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            <button onClick={google} className="w-full rounded-md border border-input py-3 text-sm font-medium hover:bg-accent">
              Continue with Google
            </button>
          </>
        )}

        <div className="mt-6 space-y-1 text-center text-sm text-muted-foreground">
          {mode === "email" && <button onClick={() => setMode("forgot")} className="underline">Forgot password?</button>}
          {mode === "phone" && <p className="text-xs">Forgot your password? Ask an officer to reset it.</p>}
          {mode !== "signup" ? (
            <p>Not yet a member? <button onClick={() => setMode("signup")} className="underline">Create a new account</button></p>
          ) : (
            <p>Have an account? <button onClick={() => setMode("member")} className="underline">Sign in</button></p>
          )}
          {mode === "forgot" && <button onClick={() => setMode("email")} className="underline">Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}
