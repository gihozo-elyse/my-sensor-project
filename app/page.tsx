"use client";

import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/dashboard-view";

export default function Home() {
  return (
    <AppShell title="Dashboard" subtitle="Real-time conditions underground" searchable={false}>
      <DashboardView />
    </AppShell>
  );
}
