"use client";

import { AppShell } from "@/components/app-shell";
import { SensorsTable } from "@/components/sensors-table";

export default function SensorsPage() {
  return (
    <AppShell title="Sensors" subtitle="Deployed hardware and live channel readings">
      <SensorsTable />
    </AppShell>
  );
}
