"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, BellOff, Check, Copy, Gauge, LogOut, Router, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-context";
import { useSearch } from "@/components/search-context";
import { disablePush, ensurePushSubscription, isSubscribed, pushSupport, type PushSupport } from "@/components/push";
import { Button, Card, CardHeader, LevelBadge, cx } from "@/components/ui";
import { METRICS, METRIC_KEYS } from "@/lib/thresholds";
import { METRIC_ICON } from "@/components/metric-card";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 ring-1 ring-line">
        <code className="flex-1 truncate font-mono text-xs text-fg">{value}</code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="rounded-md p-1 text-muted hover:bg-raised hover:text-fg"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-safe" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function NotificationsCard() {
  const [support, setSupport] = useState<PushSupport>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupport(pushSupport());
    isSubscribed().then(setSubscribed).catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const ok = await ensurePushSubscription();
      setSupport(pushSupport());
      setSubscribed(ok);
      if (ok) toast.success("Push alerts enabled on this device");
      else if (Notification.permission === "denied") toast.error("Notifications are blocked. Allow them in your browser's site settings.");
    } catch {
      toast.error("Couldn't enable push alerts.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    await disablePush().catch(() => {});
    setSubscribed(false);
    setBusy(false);
    toast("Push alerts turned off for this device");
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push-notify", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) toast.success(`Test sent to ${data.sent} device${data.sent === 1 ? "" : "s"}`);
    else toast.error(data.error ?? "Test failed");
  }

  const status =
    support === "unsupported"
      ? { text: "This browser doesn't support push notifications.", tone: "text-faint" }
      : support === "unconfigured"
        ? { text: "Push isn't configured on the server (missing VAPID keys).", tone: "text-warn" }
        : support === "denied"
          ? { text: "Notifications are blocked for this site in your browser settings.", tone: "text-crit" }
          : subscribed
            ? { text: "This device will receive alerts even when the dashboard is closed.", tone: "text-safe" }
            : { text: "Turn on to get warning and critical alerts on this device.", tone: "text-muted" };

  const canUse = support === "default" || support === "granted";

  return (
    <Card id="notifications">
      <CardHeader icon={<Bell className="h-4 w-4" />} title="Push notifications" description="Alerts are sent by the server whenever a level changes" />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3">
          <span
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-line",
              subscribed ? "bg-safe/10 text-safe" : "bg-raised text-muted"
            )}
          >
            {subscribed ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-medium text-fg">{subscribed ? "Enabled on this device" : "Not enabled"}</p>
            <p className={cx("text-xs", status.tone)}>{status.text}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {subscribed ? (
            <>
              <Button variant="secondary" onClick={test} disabled={busy}>
                Send test
              </Button>
              <Button variant="ghost" onClick={disable} disabled={busy}>
                Turn off
              </Button>
            </>
          ) : (
            <Button onClick={enable} disabled={busy || !canUse}>
              Enable alerts
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const { email, logout } = useAuth();
  const router = useRouter();
  const { query } = useSearch();
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );

  const q = query.trim().toLowerCase();
  const show = (...words: string[]) => !q || words.some((w) => w.toLowerCase().includes(q));

  return (
    <AppShell title="Settings" subtitle="Account, notifications and device setup">
      <div className="grid gap-6 lg:grid-cols-2">
        {show("account", "email", "sign out", "logout", "profile") ? (
          <Card>
            <CardHeader icon={<UserRound className="h-4 w-4" />} title="Account" description="You're signed in with this email" />
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-strong text-sm font-bold text-slate-950">
                {email?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">{email}</p>
                <p className="text-xs text-muted">Sessions last 7 days on each device</p>
              </div>
              <Button
                variant="secondary"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </Card>
        ) : null}

        {show("notifications", "push", "alerts", "bell") ? <NotificationsCard /> : null}

        {show("device", "esp8266", "api", "key", "endpoint", "node") ? (
          <Card>
            <CardHeader icon={<Router className="h-4 w-4" />} title="Device connection" description="Values to put in firmware/mine_safety/secrets.h" />
            <div className="space-y-4 p-5">
              <CopyField label="SERVER_URL" value={origin ? `${origin}/api/sensor` : "…"} />
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">API_KEY</p>
                <p className="rounded-xl bg-canvas px-3 py-2 text-xs text-muted ring-1 ring-line">
                  Use the same value as <code className="font-mono text-fg">SENSOR_API_KEY</code> in the server&apos;s{" "}
                  <code className="font-mono text-fg">.env.local</code>. It is sent as the <code className="font-mono text-fg">X-API-Key</code> header.
                </p>
              </div>
              <p className="text-xs text-faint">
                The ESP8266 must reach this address over the network. <code>localhost</code> won&apos;t work from the device, so use your
                computer&apos;s LAN IP (e.g. http://192.168.1.66:3000/api/sensor).
              </p>
            </div>
          </Card>
        ) : null}

        {show("thresholds", "gas", "temperature", "humidity", "levels") ? (
          <Card>
            <CardHeader icon={<Gauge className="h-4 w-4" />} title="Alert thresholds" description="Defined in lib/thresholds.ts and mirrored in the firmware" />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-medium">Metric</th>
                  <th className="px-5 py-3 font-medium">
                    <LevelBadge level="warning" label="Warning above" />
                  </th>
                  <th className="px-5 py-3 font-medium">
                    <LevelBadge level="critical" label="Critical above" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {METRIC_KEYS.map((m) => {
                  const Icon = METRIC_ICON[m];
                  const unit = METRICS[m].unit === "ADC" ? " ADC" : METRICS[m].unit;
                  return (
                    <tr key={m} className="border-t border-line">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-2 text-fg">
                          <Icon className="h-4 w-4 text-muted" />
                          {METRICS[m].label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-warn">
                        {METRICS[m].warning}
                        {unit}
                      </td>
                      <td className="px-5 py-3 font-mono text-crit">
                        {METRICS[m].critical}
                        {unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
