import { AppShell } from "@/components/app-shell";
import { SensorsTable } from "@/components/sensors-table";

export default function SensorsPage() {
  return (
    <AppShell title="Sensor Management" subtitle="Monitor all deployed sensors across mining zones">
      <SensorsTable />
    </AppShell>
  );
}
