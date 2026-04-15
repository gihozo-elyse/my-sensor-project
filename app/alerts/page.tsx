"use client";

import { AppShell } from "@/components/app-shell";
import { useSensorData } from "@/components/useSensorData";

export default function AlertsPage() {
  const { data } = useSensorData();
  const gas = data.latest?.gas ?? 0;
  const temp = data.latest?.temperature ?? 0;
  const humidity = data.latest?.humidity ?? 0;

  const items = [
    {
      text: `Gas level detected: ${gas.toFixed(1)} PPM — ${gas > 800 ? "Be careful! Evacuate immediately." : gas > 400 ? "Rising gas detected, be careful!" : "Gas level is safe."}`,
      severity: gas > 800 ? "Critical" : gas > 400 ? "Warning" : "Safe",
    },
    {
      text: `Temperature detected: ${temp.toFixed(1)}°C — ${temp > 40 ? "Be careful! Dangerously hot." : temp > 35 ? "Temperature rising, be careful!" : "Temperature is normal."}`,
      severity: temp > 40 ? "Critical" : temp > 35 ? "Warning" : "Safe",
    },
    {
      text: `Humidity detected: ${humidity.toFixed(1)}% — ${humidity > 90 ? "Be careful! Extremely humid." : humidity > 70 ? "Humidity rising, be careful!" : "Humidity is normal."}`,
      severity: humidity > 90 ? "Critical" : humidity > 70 ? "Warning" : "Safe",
    },
  ];

  const badgeStyle = (severity: string) => {
    if (severity === "Critical") return "bg-red-100 text-red-700";
    if (severity === "Warning") return "bg-amber-100 text-amber-700";
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <AppShell title="Alerts" subtitle="Real-time safety alerts from mining zones">
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.text} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium text-slate-800">{item.text}</p>
              <span className={`rounded-full px-3 py-1 text-xs ${badgeStyle(item.severity)}`}>
                {item.severity}
              </span>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
