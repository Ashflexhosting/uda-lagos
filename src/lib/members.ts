export const ASSOCIATION = "Uzuakoli Development Association · Lagos Branch";

/** Member-number logins use a private, non-deliverable email under this domain. */
export const MEMBER_EMAIL_DOMAIN = "members.udalagos.app";

export function normalizeMemberNo(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function memberLoginEmail(memberNo: string) {
  return `${normalizeMemberNo(memberNo).toLowerCase()}@${MEMBER_EMAIL_DOMAIN}`;
}

export function computeBalance(m: { opening: number; dues: number; welfare: number; dev_levy: number }, paid: number) {
  return Number(m.opening) + Number(m.dues) + Number(m.welfare) + Number(m.dev_levy) - paid;
}

export const naira = (v: number) => "₦" + Math.abs(Number(v)).toLocaleString("en-NG", { maximumFractionDigits: 0 });

export type BalanceStatus = "owing" | "credit" | "clear";
export const statusOf = (b: number): BalanceStatus => (b > 0 ? "owing" : b < 0 ? "credit" : "clear");

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
