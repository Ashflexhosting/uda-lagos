import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Cake } from "lucide-react";
import { listMonthBirthdays } from "@/lib/birthdays.functions";

export const birthdaysQuery = queryOptions({
  queryKey: ["birthdays", "homepage"],
  queryFn: async () => { try { return await listMonthBirthdays(); } catch { return { today: "", birthdays: [] }; } },
  staleTime: 0,
});

const day = (d: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

export function BirthdayAnnouncements() {
  const { data } = useSuspenseQuery(birthdaysQuery);
  if (!data.birthdays.length) return null;
  const month = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(`${data.today}T00:00:00Z`));
  return <section aria-labelledby="birthdays-heading" className="bg-secondary">
    <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary"><Cake className="size-5" />Celebrations</p>
      <h2 id="birthdays-heading" className="mt-3 font-serif text-3xl md:text-4xl">{month} birthdays</h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.birthdays.map((b) => {
          const isToday = b.birthday.slice(5) === data.today.slice(5);
          return <article key={b.id} className={`flex min-w-0 gap-4 rounded-lg border-t-4 bg-card p-6 text-card-foreground shadow-sm ${isToday ? "border-feature" : "border-gold"}`}>
            {b.image_url ? <img src={b.image_url} alt={b.name} width={72} height={72} loading="lazy" className="size-18 shrink-0 rounded-full object-cover" /> : <span className="grid size-18 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Cake className="size-7" /></span>}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">{isToday ? "Today 🎉" : day(b.birthday)}</p>
              <h3 className="break-words font-serif text-xl">{b.name}</h3>
              {b.message && <p className="mt-2 break-words text-sm text-muted-foreground">{b.message}</p>}
            </div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
