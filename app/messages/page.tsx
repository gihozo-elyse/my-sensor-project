import { AppShell } from "@/components/app-shell";

const messages = [
  "Please review the latest gas readings from Shaft B.",
  "Sensor S006 has been replaced and is now online.",
  "Calibration for MQ-2 sensors completed in Zone A.",
];

export default function MessagesPage() {
  return (
    <AppShell title="Messages" subtitle="Static communication feed for UI demo">
      <div className="space-y-3">
        {messages.map((message) => (
          <article key={message} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-slate-800">{message}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
