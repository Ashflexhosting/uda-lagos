/** Name matches are suggestions for officers, never proof of identity. */
export function validateRegistrationName(raw: string) {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 150) throw new Error("Enter your full name (3–150 characters).");
  return name;
}

export function nameTokens(raw: string) {
  return raw.toUpperCase().replace(/\([^)]*\)/g, " ").replace(/[^A-Z0-9 ]/g, " ").split(/\s+/)
    .filter((token) => token && !["CHIEF", "ENGR", "ELDER", "DR", "MR", "MRS", "MS", "SIR", "LADY", "PASTOR", "REV", "PROF"].includes(token));
}

export function rankNameMatches<T extends { id: string; name: string }>(fullName: string, members: T[]) {
  const wanted = new Set(nameTokens(fullName));
  if (wanted.size < 2) return [];
  return members.map((member) => {
    const tokens = new Set(nameTokens(member.name));
    const common = [...wanted].filter((token) => tokens.has(token)).length;
    return { member, score: common < 2 ? 0 : common / new Set([...wanted, ...tokens]).size };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.member.id.localeCompare(b.member.id)).map(({ member }) => member);
}