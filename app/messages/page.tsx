"use client";

import { Inbox, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";
import { Card, CardHeader, EmptyState } from "@/components/ui";

// Sample team notes (not stored in the database yet).
const messages = [
  {
    from: "Shift Supervisor",
    initials: "SS",
    time: "08:12",
    text: "Please review the latest gas readings from Shaft A before the morning shift goes down.",
  },
  {
    from: "Maintenance",
    initials: "MT",
    time: "Yesterday",
    text: "DHT22 on Node 01 has been re-seated and is reporting normally again.",
  },
  {
    from: "Safety Officer",
    initials: "SO",
    time: "Mon",
    text: "MQ135 baseline check completed in clean air. Readings are consistent with last month.",
  },
];

export default function MessagesPage() {
  const { query } = useSearch();
  const q = query.trim().toLowerCase();
  const filtered = messages.filter((m) => !q || `${m.from} ${m.text}`.toLowerCase().includes(q));

  return (
    <AppShell title="Messages" subtitle="Team notes and shift handovers">
      <Card className="mx-auto max-w-3xl">
        <CardHeader icon={<MessageSquare className="h-4 w-4" />} title="Team feed" description="Sample messages for the demo; not saved yet" />
        {filtered.length === 0 ? (
          <EmptyState icon={<Inbox className="h-5 w-5" />} title="No messages match your search" description={`Nothing found for “${query}”.`} />
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((m) => (
              <li key={m.text} className="flex gap-4 p-5 transition hover:bg-raised/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-brand ring-1 ring-line">
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-fg">{m.from}</p>
                    <span className="shrink-0 text-xs text-faint">{m.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{m.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
