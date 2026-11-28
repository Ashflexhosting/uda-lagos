import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LoaderCircle, MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputCls } from "@/components/portal-ui";
import { askAccountQuestion } from "@/lib/account-question.functions";
import type { AccountAnswer } from "@/lib/account-question";

export function AccountAssistant() {
  const ask = useServerFn(askAccountQuestion);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [result, setResult] = useState<AccountAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !question.trim()) return;
    setBusy(true);
    setAsked(question.trim());
    setResult(null);
    try {
      setResult(await ask({ data: { question: question.trim() } }));
    } catch {
      setResult({ answer: null, asOf: null, error: "Unable to answer right now. Check your connection and sign-in, then try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="account-assistant-title" className="border-t border-border pt-8 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <h2 id="account-assistant-title" className="flex items-center gap-2 font-serif text-xl"><MessageCircle className="size-5 text-primary" />Ask about my statement</h2>
        {(result || asked) && <Button variant="ghost" size="icon" title="Clear question and answer" aria-label="Clear question and answer" disabled={busy} onClick={() => { setQuestion(""); setAsked(""); setResult(null); }}><Trash2 /></Button>}
      </div>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <label htmlFor="account-question" className="text-sm font-medium">Your question</label>
        <textarea id="account-question" value={question} onChange={event => setQuestion(event.target.value)} required maxLength={1000} rows={3} placeholder="Why do I owe this amount?" className={`${inputCls} mt-2 resize-y`} disabled={busy} />
        <Button type="submit" disabled={busy || !question.trim()}>{busy ? <LoaderCircle className="animate-spin" /> : <Send />}{busy ? "Checking your statement…" : "Ask question"}</Button>
      </form>
      <div aria-live="polite" aria-busy={busy} className="mt-4">
        {result?.error && <p role="alert" className="text-sm text-destructive">{result.error}</p>}
        {result?.answer && <div className="border-l-2 border-primary pl-4"><p className="break-words text-sm font-semibold">{asked}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed">{result.answer}</p><p className="mt-3 text-xs text-muted-foreground">Account checked {new Date(result.asOf).toLocaleString("en-NG")}</p></div>}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">AI-generated answers may contain mistakes. Confirm disputed amounts with an officer.</p>
    </section>
  );
}