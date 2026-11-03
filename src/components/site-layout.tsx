import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import emblem from "@/assets/uda-emblem.png.asset.json";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/news", label: "News & Events" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 sm:flex sm:max-w-6xl sm:justify-between sm:gap-4 sm:px-6 sm:mx-auto">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={emblem.url} alt="Uzuakoli Development Association emblem" width={88} height={88} className="h-14 w-14 shrink-0 sm:h-22 sm:w-22" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-serif text-base sm:text-lg">UDA Lagos</span>
              <span className="block truncate text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Uzuakoli Development Association</span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="hidden rounded-md px-3 py-2 text-muted-foreground hover:text-foreground sm:block"
                activeOptions={{ exact: true }} activeProps={{ className: "text-foreground font-medium" }}>
                {n.label}
              </Link>
            ))}
            <Link to="/auth" className="ml-2 whitespace-nowrap rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 sm:px-4"><span className="hidden sm:inline">Member </span>Sign in</Link>
          </nav>
        </div>
        <nav className="flex justify-center gap-4 border-t border-border py-2 text-sm sm:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} activeOptions={{ exact: true }} activeProps={{ className: "font-medium text-primary" }}>{n.label}</Link>)}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3">
          <div>
            <img src={emblem.url} alt="Uzuakoli Development Association emblem" width={48} height={48} className="mb-4 h-12 w-12" />
            <p className="font-serif text-xl">Uzuakoli Development Association</p>
            <p className="mt-1 text-sm opacity-75">Lagos Branch</p>
            <p className="mt-4 text-sm opacity-75">Sons and daughters of Uzuakoli in Lagos, working together for our people at home and here.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 opacity-80">
              {nav.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
              <li><Link to="/auth">Member portal</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Contact</p>
            <ul className="mt-3 space-y-2 opacity-80">
              <li><a className="hover:underline" href="tel:+2348033208027">+234 803 320 8027</a></li>
              <li><a className="hover:underline" href="mailto:info@udalagos.com.ng">info@udalagos.com.ng</a></li>
              <li>Spinal Cord Association Center, Ijesha, Lagos (via Lord Chosen)</li>
              <li>Monthly general meeting · Lagos</li>
            </ul>
            <p className="mt-6 text-xs opacity-60">© {2026} UDA Lagos Branch</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
