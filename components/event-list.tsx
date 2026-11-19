import { CheckCircle2 } from "lucide-react";
import { EmptyState, LevelBadge, cx, levelBg } from "@/components/ui";
import { periodReasons, type Period } from "@/lib/periods";

function fmtTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(ms: number) {
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Vertical timeline of warning / critical periods, newest first. */
export function EventList({ periods, emptyText = "No warnings or critical readings in this period." }: { periods: Period[]; emptyText?: string }) {
  const events = periods.filter((p) => p.level !== "safe").reverse();

  if (events.length === 0) {
    return <EmptyState icon={<CheckCircle2 className="h-5 w-5 text-safe" />} title="No incidents" description={emptyText} />;
  }

  return (
    <ol className="relative space-y-1 p-3">
      {events.map((p, i) => (
        <li key={`${p.from.toISOString()}-${i}`} className="relative flex gap-3 rounded-xl px-2 py-2.5 hover:bg-raised/60">
          <div className="flex flex-col items-center pt-1">
            <span className={cx("h-2.5 w-2.5 rounded-full ring-4 ring-surface", levelBg[p.level])} />
            {i < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={p.level} />
              <span className="text-xs text-muted">
                {p.from.toLocaleDateString([], { month: "short", day: "numeric" })} · {fmtTime(p.from)}–{fmtTime(p.to)}
              </span>
              <span className="text-xs text-faint">({fmtDuration(p.to.getTime() - p.from.getTime())})</span>
            </div>
            <ul className="mt-1 space-y-0.5 text-sm text-fg/90">
              {periodReasons(p).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
