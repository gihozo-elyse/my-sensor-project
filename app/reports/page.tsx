"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Download, FileText, Grid3x3, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSensorData } from "@/components/useSensorData";
import { useSearch } from "@/components/search-context";
import { METRIC_ICON } from "@/components/metric-card";
import { Button, Card, CardHeader, EmptyState, LevelBadge, Skeleton, cx, levelBg } from "@/components/ui";
import { bucketLevel, buildPeriods, periodReasons, type Period } from "@/lib/periods";
import type { SensorBucket } from "@/lib/sensor-types";
import { LEVEL_LABEL, METRICS, METRIC_KEYS, formatWithUnit, worstLevel, type Level } from "@/lib/thresholds";

const HOUR = 60 * 60_000;

type Day = {
  key: string;
  date: Date;
  hours: (SensorBucket | null)[];
  periods: Period[];
  level: Level | null;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDays(buckets: SensorBucket[]): Day[] {
  const byKey = new Map<string, SensorBucket[]>();
  for (const b of buckets) {
    const k = dayKey(new Date(b.t));
    byKey.set(k, [...(byKey.get(k) ?? []), b]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    const list = byKey.get(dayKey(date)) ?? [];
    const hours: (SensorBucket | null)[] = Array(24).fill(null);
    for (const b of list) hours[new Date(b.t).getHours()] = b;
    return {
      key: dayKey(date),
      date,
      hours,
      periods: buildPeriods(list, HOUR),
      level: list.length ? worstLevel(list.map(bucketLevel)) : null,
    };
  });
}

function fmtDay(d: Date, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric" }) {
  return d.toLocaleDateString("en-US", opts);
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ReportsPage() {
  const { query } = useSearch();
  const { data, loading } = useSensorData("7d", 60_000);
  const [exporting, setExporting] = useState(false);

  const buckets = data.history;
  const days = useMemo(() => buildDays(buckets), [buckets]);

  const stats = useMemo(() => {
    const hoursBy = (lvl: Level) => buckets.filter((b) => bucketLevel(b) === lvl).length;
    const readings = buckets.reduce((s, b) => s + b.count, 0);
    const peaks = Object.fromEntries(
      METRIC_KEYS.map((m) => [m, buckets.length ? Math.max(...buckets.map((b) => b[`${m}Max`])) : null])
    ) as Record<(typeof METRIC_KEYS)[number], number | null>;
    return { readings, hours: buckets.length, warnHours: hoursBy("warning"), critHours: hoursBy("critical"), peaks };
  }, [buckets]);

  const weekRange = `${fmtDay(days[0].date, { month: "short", day: "numeric" })} – ${fmtDay(days[6].date, { month: "short", day: "numeric", year: "numeric" })}`;

  const q = query.trim().toLowerCase();
  const visibleDays = [...days]
    .reverse()
    .filter((d) => d.periods.length > 0)
    .filter(
      (d) =>
        !q ||
        fmtDay(d.date).toLowerCase().includes(q) ||
        d.periods.some((p) => p.level.includes(q) || periodReasons(p).some((r) => r.toLowerCase().includes(q)))
    );

  async function downloadPdf() {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf/dist/jspdf.umd.min.js");
      const pdf = new jsPDF();
      const W = pdf.internal.pageSize.getWidth();
      const COLORS: Record<Level, [number, number, number]> = {
        safe: [16, 185, 129],
        warning: [217, 119, 6],
        critical: [220, 38, 38],
      };

      // Header band
      pdf.setFillColor(18, 21, 27);
      pdf.rect(0, 0, W, 34, "F");
      pdf.setFillColor(245, 158, 11);
      pdf.rect(0, 34, W, 1.5, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text("Coal Mine Safety: Weekly Report", 16, 17);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(180, 186, 196);
      pdf.text(`${weekRange}   ·   Node 01, Shaft A   ·   Generated ${new Date().toLocaleString()}`, 16, 26);

      let y = 48;
      pdf.setTextColor(20, 20, 20);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("Summary", 16, y);
      y += 7;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const summary = [
        `Readings recorded: ${stats.readings.toLocaleString()} across ${stats.hours} hours of data`,
        `Hours with warnings: ${stats.warnHours}    Hours with critical readings: ${stats.critHours}`,
        ...METRIC_KEYS.map((m) => `Peak ${METRICS[m].label.toLowerCase()}: ${formatWithUnit(m, stats.peaks[m])}`),
      ];
      for (const line of summary) {
        pdf.text(line, 16, y);
        y += 5.5;
      }
      y += 6;

      for (const day of [...days].reverse()) {
        if (y > 260) {
          pdf.addPage();
          y = 20;
        }
        pdf.setDrawColor(225, 228, 232);
        pdf.line(16, y - 4, W - 16, y - 4);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(20, 20, 20);
        pdf.text(fmtDay(day.date), 16, y + 1);
        if (day.level) {
          pdf.setTextColor(...COLORS[day.level]);
          pdf.text(LEVEL_LABEL[day.level].toUpperCase(), W - 16, y + 1, { align: "right" });
        } else {
          pdf.setTextColor(150, 150, 150);
          pdf.text("NO DATA", W - 16, y + 1, { align: "right" });
        }
        y += 7;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.5);
        for (const p of day.periods) {
          pdf.setFillColor(...COLORS[p.level]);
          pdf.circle(19, y - 1.2, 1.2, "F");
          pdf.setTextColor(40, 40, 40);
          pdf.text(`${fmtTime(p.from)}–${fmtTime(p.to)}  ${LEVEL_LABEL[p.level]}`, 23, y);
          pdf.setTextColor(110, 110, 110);
          const reasons = pdf.splitTextToSize(periodReasons(p).join("; "), W - 90);
          pdf.text(reasons, 72, y);
          y += 5 * Math.max(1, reasons.length);
          if (y > 280) {
            pdf.addPage();
            y = 20;
          }
        }
        y += 6;
      }

      pdf.save(`mine-safety-report-${days[6].date.toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      title="Reports"
      subtitle={`Weekly safety report · ${weekRange}`}
      actions={
        <Button onClick={downloadPdf} disabled={loading || exporting || buckets.length === 0}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary stats */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Readings this week", value: stats.readings.toLocaleString(), sub: `${stats.hours} h of data` },
            { label: "Hours in warning", value: String(stats.warnHours), sub: "Peak above warning level", tone: stats.warnHours ? "text-warn" : "" },
            { label: "Hours critical", value: String(stats.critHours), sub: "Peak above critical level", tone: stats.critHours ? "text-crit" : "" },
            {
              label: "Peak gas",
              value: formatWithUnit("gas", stats.peaks.gas),
              sub: `Temp ${formatWithUnit("temperature", stats.peaks.temperature)} · RH ${formatWithUnit("humidity", stats.peaks.humidity)}`,
            },
          ].map((s) => (
            <Card key={s.label} className="p-5">
              <p className="text-xs font-medium text-muted">{s.label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-20" />
              ) : (
                <p className={cx("mt-1.5 text-2xl font-semibold tabular-nums text-fg", s.tone)}>{s.value}</p>
              )}
              <p className="mt-1 text-xs text-faint">{s.sub}</p>
            </Card>
          ))}
        </section>

        {/* Heatmap */}
        <Card>
          <CardHeader
            icon={<Grid3x3 className="h-4 w-4" />}
            title="Hourly safety map"
            description="Each cell is one hour, coloured by its worst reading"
            action={
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                {(["safe", "warning", "critical"] as Level[]).map((l) => (
                  <span key={l} className="inline-flex items-center gap-1.5">
                    <span className={cx("h-2.5 w-2.5 rounded-sm", l === "safe" ? "bg-safe/30" : levelBg[l])} />
                    {LEVEL_LABEL[l]}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-raised ring-1 ring-line" />
                  No data
                </span>
              </div>
            }
          />
          <div className="overflow-x-auto p-5">
            <div className="min-w-[640px]">
              {days.map((day) => (
                <div key={day.key} className="mb-1.5 flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted">{fmtDay(day.date, { weekday: "short", day: "numeric" })}</span>
                  <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                    {day.hours.map((b, h) => {
                      const lvl = b ? bucketLevel(b) : null;
                      return (
                        <div
                          key={h}
                          title={
                            b
                              ? `${fmtDay(day.date, { weekday: "short" })} ${String(h).padStart(2, "0")}:00 · ${LEVEL_LABEL[lvl!]}\n` +
                                METRIC_KEYS.map((m) => `${METRICS[m].label}: peak ${formatWithUnit(m, b[`${m}Max`])}`).join("\n")
                              : `${String(h).padStart(2, "0")}:00 · no data`
                          }
                          className={cx(
                            "h-6 rounded-[4px] transition hover:scale-110",
                            lvl === "safe" ? "bg-safe/30" : lvl ? levelBg[lvl] : "bg-raised ring-1 ring-inset ring-line"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <span className="w-20 shrink-0" />
                <div className="grid flex-1 text-[10px] text-faint" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {Array.from({ length: 24 }, (_, h) => (
                    <span key={h} className="text-center">
                      {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily breakdown */}
        <Card>
          <CardHeader icon={<CalendarDays className="h-4 w-4" />} title="Daily breakdown" description="Condition periods per day, newest first" />
          {loading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : visibleDays.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-5 w-5" />}
              title={q ? "Nothing matches your search" : "No data this week"}
              description={q ? `No days or periods match “${query}”.` : "Readings will appear here once the sensor node starts uploading."}
            />
          ) : (
            <div className="divide-y divide-line">
              {visibleDays.map((day) => (
                <article key={day.key} className="p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-semibold text-fg">{fmtDay(day.date)}</h3>
                    {day.level ? <LevelBadge level={day.level} label={day.level === "safe" ? "All normal" : undefined} /> : null}
                  </div>
                  <div className="space-y-2">
                    {day.periods.map((p, i) => (
                      <div key={i} className="flex flex-col gap-1 rounded-xl bg-canvas/50 px-4 py-3 ring-1 ring-line sm:flex-row sm:items-center sm:gap-4">
                        <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-fg sm:w-48">
                          <span className={cx("h-2 w-2 rounded-full", levelBg[p.level])} />
                          {fmtTime(p.from)} – {fmtTime(p.to)}
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                          {p.level === "safe" ? (
                            <span>All readings within safe range</span>
                          ) : (
                            periodReasons(p).map((r) => {
                              const m = METRIC_KEYS.find((k) => r.startsWith(METRICS[k].label))!;
                              const Icon = METRIC_ICON[m];
                              return (
                                <span key={r} className="inline-flex items-center gap-1.5">
                                  <Icon className="h-3.5 w-3.5" />
                                  {r}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
