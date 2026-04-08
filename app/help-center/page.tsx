import { AppShell } from "@/components/app-shell";

const guides = [
  "ESP8266 Setup Guide",
  "Understanding Alert Levels",
  "Sensor Calibration",
  "Network Troubleshooting",
  "Reading Sensor Data",
  "FAQ",
];

export default function HelpCenterPage() {
  return (
    <AppShell title="Help Center" subtitle="Guides and documentation for the Mine Safety Monitoring System">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <article key={guide} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-medium text-slate-800">{guide}</p>
            <p className="text-sm text-slate-500">Reference documentation</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
