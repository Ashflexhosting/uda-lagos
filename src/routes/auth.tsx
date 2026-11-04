import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { memberLoginEmail, phoneLoginEmail } from "@/lib/members";
import { ArrowLeft, Eye, EyeOff, IdCard, Lock, LogIn, Mail, Phone, Sparkles } from "lucide-react";
import hero from "@/assets/hero-gathering.jpg";
import emblem from "@/assets/uda-emblem.png.asset.json";
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

  const [showPw, setShowPw] = useState(false);
  const input = "w-full rounded-lg border border-transparent bg-muted py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-background";
  const label = "mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground";
  const tab = (active: boolean) => `rounded-md py-2 text-xs font-medium uppercase tracking-wider transition ${active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`;
  const usesPhone = mode === "phone" || (mode === "signup" && via === "phone");
  const FieldIcon = mode === "member" ? IdCard : usesPhone ? Phone : Mail;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Photo panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative flex h-full flex-col justify-between p-16 text-primary-foreground">
          <Link to="/" className="flex items-center gap-3">
            <img src={emblem.url} alt="UDA emblem" width={56} height={56} className="h-14 w-14 rounded-xl bg-background/10 p-1" />
            <span>
              <span className="block text-lg font-bold leading-tight">UDA LAGOS</span>
              <span className="block text-[11px] uppercase tracking-[0.2em] text-gold">Uzuakoli Development Association</span>
            </span>
          </Link>
          <div className="max-w-md">
            <h2 className="text-6xl font-bold leading-[1.05]">Serving Uzuakoli with <span className="text-gold">unity</span>.</h2>
            <p className="mt-6 text-base leading-relaxed opacity-85">Sign in to see your dues and levies, upload proof of payment, and keep your member record up to date.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 border-t border-primary-foreground/20 pt-8 text-xs">
            <div><p className="font-semibold uppercase tracking-[0.2em] text-gold">Accountable</p><p className="mt-2 opacity-80">Every payment recorded against your member number.</p></div>
            <div><p className="font-semibold uppercase tracking-[0.2em] text-gold">Transparent</p><p className="mt-2 opacity-80">Your full statement and balance, any time.</p></div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between px-6 py-6 sm:px-12">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img src={emblem.url} alt="UDA emblem" width={40} height={40} className="h-10 w-10" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              <span className="h-px w-10 bg-primary" />
              {mode === "signup" ? "New member" : mode === "forgot" ? "Account recovery" : "Member access"}
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              {mode === "signup" ? "Join the association" : mode === "forgot" ? "Reset password" : "CHO CHO CHO OZU NMA!!!"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signup" ? "Only for people not yet on the register." : mode === "forgot" ? "We'll email you a link to set a new password." : mode === "member" ? "Already on the register? Use your membership number." : "Sign in to your UDA Lagos account."}
            </p>

            {(mode === "member" || mode === "email" || mode === "phone") && (
              <div className="mt-8 grid grid-cols-3 rounded-lg bg-muted p-1">
                {(["member", "email", "phone"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={tab(mode === m)}>
                    {m === "member" ? "Member no." : m === "email" ? "Email" : "Phone"}
                  </button>
                ))}
              </div>
            )}

            {mode === "signup" && (
              <>
                <p className="mt-6 rounded-lg border border-border p-3 text-sm text-muted-foreground">
                  Existing members should{" "}
                  <button type="button" onClick={() => setMode("member")} className="font-medium text-primary underline">sign in with their membership number</button>.
                </p>
                <div className="mt-4 grid grid-cols-2 rounded-lg bg-muted p-1">
                  {(["email", "phone"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setVia(v)} className={tab(via === v)}>
                      {v === "email" ? "With email" : "With phone"}
                    </button>
                  ))}
                </div>
              </>
            )}

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label className={label}>{mode === "member" ? "Membership number" : usesPhone ? "Phone number" : "Email address"}</label>
                <div className="relative">
                  <FieldIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  {mode === "member" ? (
                    <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. UDAL004" className={input} />
                  ) : usesPhone ? (
                    <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" className={input} />
                  ) : (
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={input} />
                  )}
                </div>
              </div>
              {mode !== "forgot" && (
                <div>
                  <label className={label}>Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input required type={showPw ? "text" : "password"} minLength={mode === "signup" ? 8 : undefined} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${input} pr-11`} />
                    <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              {mode === "email" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("forgot")} className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Forgot?</button>
                </div>
              )}
              {mode === "phone" && <p className="text-xs text-muted-foreground">Forgot your password? Ask an officer to reset it.</p>}
              <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground py-4 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60">
                <LogIn className="h-4 w-4" />
                {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
              </button>
            </form>

            {mode !== "forgot" && mode !== "member" && (
              <>
                <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
                <button onClick={google} className="w-full rounded-lg border border-border py-3.5 text-sm font-medium hover:bg-muted">Continue with Google</button>
              </>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "forgot" ? (
                <button onClick={() => setMode("email")} className="font-semibold text-primary underline underline-offset-4">Back to sign in</button>
              ) : mode !== "signup" ? (
                <>
                  <p>Not yet a member?</p>
                  <button onClick={() => setMode("signup")} className="mt-1 inline-flex items-center gap-1.5 border-b border-primary font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" /> Begin registration</button>
                </>
              ) : (
                <p>Have an account? <button onClick={() => setMode("member")} className="font-semibold text-primary underline underline-offset-4">Sign in</button></p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between border-t border-border px-6 py-5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground sm:px-12">
          <span>© {new Date().getFullYear()} UDA Lagos</span>
          <Link to="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </main>
    </div>
  );
}
