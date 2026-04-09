"use client";

import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";

const settingsFields = [
  { label: "System Name", type: "input" as const, defaultValue: "Mine Safety IoT" },
  { label: "Data Refresh Rate", type: "select" as const, options: ["Every 5 seconds", "Every 10 seconds", "Every 30 seconds"] },
];

export default function SettingsPage() {
  const { query } = useSearch();
  const filtered = settingsFields.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell title="Settings" subtitle="System configuration and preferences">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">General</h2>
          {filtered.length === 0 ? (
            <p className="text-slate-500">No settings match your search.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((field) => (
                <label key={field.label} className="text-sm">
                  <span className="mb-1 block text-slate-900 font-medium">{field.label}</span>
                  {field.type === "input" ? (
                    <input
                      defaultValue={field.defaultValue}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
                    />
                  ) : (
                    <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900">
                      {field.options?.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  )}
                </label>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
