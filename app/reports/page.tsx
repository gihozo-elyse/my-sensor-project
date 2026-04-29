"use client";

import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";
import { useSensorData } from "@/components/useSensorData";
import { SensorReading } from "@/lib/sensor-types";

type ConditionPeriod = {
  status: "Normal" | "Warning" | "Critical";
  from: string;
  to: string;
  reason: string;
};

type DayReport = {
  day: string;
  date: string;
  periods: ConditionPeriod[];
  hasIssues: boolean;
};

function getStatus(r: SensorReading): { status: "Normal" | "Warning" | "Critical"; reason: string } {
  if (r.gas > 800 || r.temperature > 40 || r.humidity > 90)
    return {
      status: "Critical",
      reason: [
        r.gas > 800 ? `Gas ${r.gas.toFixed(1)} PPM` : "",
        r.temperature > 40 ? `Temp ${r.temperature.toFixed(1)}°C` : "",
        r.humidity > 90 ? `Humidity ${r.humidity.toFixed(1)}%` : "",
      ]
        .filter(Boolean)
        .join(", "),
    };
  if (r.gas > 400 || r.temperature > 35 || r.humidity > 70)
    return {
      status: "Warning",
      reason: [
        r.gas > 400 ? `Gas ${r.gas.toFixed(1)} PPM` : "",
        r.temperature > 35 ? `Temp ${r.temperature.toFixed(1)}°C` : "",
        r.humidity > 70 ? `Humidity ${r.humidity.toFixed(1)}%` : "",
      ]
        .filter(Boolean)
        .join(", "),
    };
  return { status: "Normal", reason: "All sensors within safe range" };
}

function fmt(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildWeeklyReport(history: SensorReading[]): DayReport[] {
  if (history.length === 0) return [];

  // Group readings by day
  const byDay: Record<string, SensorReading[]> = {};
  history.forEach((r) => {
    if (!r.timestamp) return;
    const day = new Date(r.timestamp).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(r);
  });

  return Object.entries(byDay).map(([dayLabel, readings]) => {
    const periods: ConditionPeriod[] = [];
    let i = 0;

    while (i < readings.length) {
      const { status, reason } = getStatus(readings[i]);
      const from = readings[i].timestamp!;
      let j = i + 1;
      while (j < readings.length && getStatus(readings[j]).status === status) j++;
      const to = readings[j - 1].timestamp!;
      periods.push({ status, from: fmt(from), to: fmt(to), reason });
      i = j;
    }

    return {
      day: dayLabel.split(",")[0],
      date: dayLabel,
      periods,
      hasIssues: periods.some((p) => p.status !== "Normal"),
    };
  });
}

function statusStyle(status: string) {
  if (status === "Critical") return "bg-red-100 text-red-700 border-red-200";
  if (status === "Warning") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function statusDot(status: string) {
  if (status === "Critical") return "bg-red-500";
  if (status === "Warning") return "bg-amber-500";
  return "bg-emerald-500";
}

export default function ReportsPage() {
  const { query } = useSearch();
  const { data, loading } = useSensorData();

  const weekReport = buildWeeklyReport(data.history);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  const weekRange = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const filtered = weekReport.filter((d) =>
    query === "" ||
    d.date.toLowerCase().includes(query.toLowerCase()) ||
    d.periods.some((p) => p.status.toLowerCase().includes(query.toLowerCase()) || p.reason.toLowerCase().includes(query.toLowerCase()))
  );

  const downloadPdf = () => {
    void (async () => {
      const { jsPDF } = await import("jspdf/dist/jspdf.umd.min.js");
      const pdf = new jsPDF();
      let y = 20;

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Mine Safety — Weekly Report", 20, y); y += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Week: ${weekRange}`, 20, y); y += 6;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, y); y += 12;

      weekReport.forEach((day) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(day.date, 20, y); y += 7;

        day.periods.forEach((p) => {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          const line = `  [${p.status}] ${p.from} – ${p.to}  |  ${p.reason}`;
          pdf.text(line, 20, y); y += 6;
          if (y > 270) { pdf.addPage(); y = 20; }
        });
        y += 4;
      });

      pdf.save("mine-safety-weekly-report.pdf");
    })();
  };

  return (
    <AppShell title="Reports" subtitle="Weekly mine safety condition report">
      <div className="space-y-4">
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Weekly Safety Report</h2>
              <p className="text-sm text-slate-600">Week: {weekRange}</p>
            </div>
            <button
              onClick={downloadPdf}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
            >
              Download PDF
            </button>
          </div>

          {/* Summary badges */}
          <div className="mt-4 flex gap-3 flex-wrap">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              ✅ Normal days: {weekReport.filter((d) => !d.hasIssues).length}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
              ⚠️ Days with warnings: {weekReport.filter((d) => d.periods.some((p) => p.status === "Warning")).length}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              🚨 Days with critical: {weekReport.filter((d) => d.periods.some((p) => p.status === "Critical")).length}
            </span>
          </div>
        </div>

        {/* Daily breakdown */}
        {loading ? (
          <p className="text-slate-500 text-sm">Loading sensor data…</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-500 text-sm">No report data matches your search.</p>
        ) : (
          filtered.map((day) => (
            <article key={day.date} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${day.hasIssues ? "bg-red-500" : "bg-emerald-500"}`} />
                <h3 className="font-semibold text-slate-900">{day.date}</h3>
                {!day.hasIssues && (
                  <span className="ml-auto text-xs text-emerald-600 font-medium">All normal conditions</span>
                )}
              </div>

              <div className="space-y-2">
                {day.periods.map((p, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${statusStyle(p.status)}`}>
                    <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${statusDot(p.status)}`} />
                    <div>
                      <span className="font-semibold">{p.status} condition</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="font-medium">{p.from} – {p.to}</span>
                      <p className="mt-0.5 opacity-80">{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
