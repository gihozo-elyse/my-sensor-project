"use client";

import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";

const messages = [
  "Please review the latest gas readings from Shaft B.",
  "Sensor S006 has been replaced and is now online.",
  "Calibration for MQ-2 sensors completed in Zone A.",
];

export default function MessagesPage() {
  const { query } = useSearch();
  const filtered = messages.filter((m) => m.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell title="Messages" subtitle="Static communication feed for UI demo">
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-slate-500">No messages match your search.</p>
        ) : (
          filtered.map((message) => (
            <article key={message} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-slate-800">{message}</p>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
