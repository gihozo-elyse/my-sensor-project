import Image from "next/image";
import type { Level } from "@/lib/thresholds";
import { LEVEL_LABEL } from "@/lib/thresholds";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const levelText: Record<Level, string> = {
  safe: "text-safe",
  warning: "text-warn",
  critical: "text-crit",
};

export const levelBg: Record<Level, string> = {
  safe: "bg-safe",
  warning: "bg-warn",
  critical: "bg-crit",
};

export const levelSoft: Record<Level, string> = {
  safe: "bg-safe/10 text-safe ring-safe/25",
  warning: "bg-warn/10 text-warn ring-warn/25",
  critical: "bg-crit/10 text-crit ring-crit/30",
};

export function Card({
  children,
  className,
  as: Tag = "section",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
  id?: string;
}) {
  return (
    <Tag id={id} className={cx("rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.05)] dark:shadow-[0_1px_0_0_rgb(255_255_255/0.03)_inset]", className)}>
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-raised text-brand ring-1 ring-line">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function LevelBadge({ level, label, className }: { level: Level; label?: string; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        levelSoft[level],
        className
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", levelBg[level])} />
      {label ?? LEVEL_LABEL[level]}
    </span>
  );
}

export function LiveDot({ online, className }: { online: boolean; className?: string }) {
  return (
    <span className={cx("relative inline-flex h-2 w-2", online ? "text-safe" : "text-faint", className)}>
      <span className={cx("relative inline-flex h-2 w-2 rounded-full bg-current", online && "pulse-ring")} />
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-raised text-muted ring-1 ring-line">
        {icon}
      </span>
      <p className="font-medium text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-md bg-raised", className)} />;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-canvas p-0.5 ring-1 ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-md px-2.5 py-1 text-xs font-medium transition",
            value === o.value ? "bg-raised text-fg shadow ring-1 ring-line-strong" : "text-muted hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-brand text-slate-950 hover:bg-amber-400",
        variant === "secondary" && "bg-raised text-fg ring-1 ring-line-strong hover:bg-line",
        variant === "ghost" && "text-muted hover:bg-raised hover:text-fg",
        className
      )}
    />
  );
}

/** The logo is a square JPEG with a light background; this crops to the emblem for small sizes. */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx("relative inline-block shrink-0 overflow-hidden rounded-xl bg-[#f7f7f7] ring-1 ring-white/10", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logg.jpeg"
        alt="Coal Mine Safety"
        fill
        sizes={`${size * 2}px`}
        className="scale-[2.1] object-cover"
        style={{ objectPosition: "50% 41%", transformOrigin: "50% 41%" }}
        priority
      />
    </span>
  );
}

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
