import { AppShell } from "@/components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="System configuration and preferences">
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold">General</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">System Name</span>
              <input
                defaultValue="Mine Safety IoT"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Data Refresh Rate</span>
              <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <option>Every 5 seconds</option>
                <option>Every 10 seconds</option>
                <option>Every 30 seconds</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
