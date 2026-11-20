export type BirthdayLike = { birthday: string };
/** Birthdays falling in the same month as `today` (YYYY-MM-DD), ordered by day; the year is ignored. */
export function birthdaysThisMonth<T extends BirthdayLike>(items: T[], today: string): T[] {
  const month = today.slice(5, 7);
  return items.filter((b) => b.birthday.slice(5, 7) === month).sort((a, b) => a.birthday.slice(8, 10).localeCompare(b.birthday.slice(8, 10)));
}
