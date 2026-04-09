"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Bell, Home } from "lucide-react";
import {
  LayoutDashboard,
  Cpu,
  FileText,
  AlertTriangle,
  MessageSquare,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useSearch } from "@/components/search-context";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sensors", label: "Sensors", icon: Cpu },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/help-center", label: "Help Center", icon: LifeBuoy },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { query, setQuery } = useSearch();
  const { email, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = email ? email.slice(0, 2).toUpperCase() : "MO";

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-950 p-4 text-slate-200 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-2 px-2">
          <Home className="h-5 w-5 text-amber-500" />
          <span className="text-xl font-semibold tracking-wide text-white">
            MINE SAFE
          </span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-amber-500 text-slate-950 font-medium"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button onClick={handleLogout} className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-950">
          <LogOut className="h-4 w-4" />
          LOGOUT
        </button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center gap-3 p-4">
            <button
              className="rounded-lg border border-slate-200 p-2 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex max-w-lg flex-1 items-center gap-2 rounded-full border border-amber-400 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search sensors, reports, messages, settings…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Bell className="h-5 w-5 text-slate-500" />
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-xs text-slate-600 truncate max-w-[140px]">{email}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-xs font-semibold text-slate-950">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="text-slate-700">{subtitle}</p> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
