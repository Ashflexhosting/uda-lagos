import { BANK_ACCOUNTS } from "@/lib/members";

export function BankAccounts({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold">Pay by bank transfer</h3>
      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
        {BANK_ACCOUNTS.map((a) => (
          <li key={a.number}>
            <span className="font-medium text-foreground">{a.label}</span> — {a.bank} · <span className="font-mono text-foreground">{a.number}</span>
            <span className="block text-xs">Account name: {a.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
