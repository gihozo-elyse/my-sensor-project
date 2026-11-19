"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Cpu,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  X,
} from "lucide-react";
import { useSearch } from "@/components/search-context";
import { useAuth } from "@/components/auth-context";
import { useLiveSensor } from "@/components/live-sensor";
import { LiveDot, LogoMark, cx, levelBg, timeAgo } from "@/components/ui";
import { METRIC_KEYS, levelFor, worstLevel } from "@/lib/thresholds";

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Hide the header search box on pages that don't filter anything. */
  searchable?: boolean;
  children: React.ReactNode;
};

const navGroups = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/sensors", label: "Sensors", icon: Cpu },
      { href: "/alerts", label: "Alerts", icon: AlertTriangle },
      { href: "/reports", label: "Reports", icon: FileText },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/messages", label: "Messages", icon: MessageSquare },
      { href: "/help-center", label: "Help Center", icon: LifeBuoy },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function AppShell({ title, subtitle, actions, searchable = true, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { query, setQuery } = useSearch();
  const { email, logout } = useAuth();
  const { data } = useLiveSensor();
  const now = useNow();

  // Clear the search when navigating between pages.
  useEffect(() => setQuery(""), [pathname, setQuery]);

  const latest = data.latest;
  const overall = latest ? worstLevel(METRIC_KEYS.map((m) => levelFor(m, latest[m]))) : "safe";
  const hasAlert = !!latest && overall !== "safe";

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : "··";

  return (
    <div className="min-h-screen bg-canvas">
      {/* Mobile backdrop */}
      <div
        className={cx("fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-5 pb-6 pt-5">
          <LogoMark size={38} />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold tracking-tight text-fg">Coal Mine Safety</p>
            <p className="text-xs text-muted">Monitoring system</p>
          </div>
          <button className="ml-auto rounded-lg p-1.5 text-muted hover:bg-raised lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-faint">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        active ? "bg-brand/10 font-medium text-brand" : "text-muted hover:bg-raised hover:text-fg"
                      )}
                    >
                      {active ? <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" /> : null}
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {item.href === "/alerts" && hasAlert ? (
                        <span className={cx("ml-auto h-2 w-2 rounded-full", levelBg[overall])} />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Device status */}
        <div className="m-3 rounded-xl border border-line bg-raised/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-fg">
            <LiveDot online={data.online} />
            {data.online ? "Sensor node online" : latest ? "Sensor node offline" : "Waiting for data"}
          </div>
          <p className="mt-1 text-xs text-muted">Last reading {timeAgo(latest?.timestamp, now)}</p>
        </div>

        <div className="flex items-center gap-3 border-t border-line p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-xs font-bold text-canvas">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{email}</p>
            <p className="text-xs text-muted">Signed in</p>
          </div>
          <button onClick={handleLogout} className="rounded-lg p-2 text-muted transition hover:bg-raised hover:text-crit" title="Sign out" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-canvas/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <button className="rounded-lg p-2 text-muted ring-1 ring-line hover:text-fg lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>

            {searchable ? (
              <label className="group flex h-10 max-w-md flex-1 items-center gap-2 rounded-xl bg-surface px-3 ring-1 ring-line transition focus-within:ring-brand/60">
                <Search className="h-4 w-4 text-faint group-focus-within:text-brand" />
                <input
                  className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
                  placeholder={`Search ${title.toLowerCase()}…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query ? (
                  <button onClick={() => setQuery("")} className="text-faint hover:text-fg" aria-label="Clear search">
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            ) : (
              <div className="flex-1" />
            )}

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-muted ring-1 ring-line sm:inline-flex">
                <LiveDot online={data.online} />
                {data.online ? "Live" : "Offline"}
              </span>
              <Link
                href="/alerts"
                className="relative rounded-xl p-2.5 text-muted ring-1 ring-line transition hover:bg-surface hover:text-fg"
                aria-label={hasAlert ? "Active alerts" : "Alerts"}
              >
                <Bell className="h-4 w-4" />
                {hasAlert ? <span className={cx("absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-canvas", levelBg[overall])} /> : null}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg md:text-[28px]">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </div>
            {actions}
          </div>
          <div className="fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
