"use client";

import { useSensorData } from "@/components/useSensorData";
import { useSearch } from "@/components/search-context";

type SensorRow = {
  id: string;
  name: string;
  type: string;
  zone: string;
  status: "Active" | "Inactive";
  reading: string;
  level: "safe" | "warning" | "critical";
};

function getLevel(gas: number): SensorRow["level"] {
  if (gas > 800) return "critical";
  if (gas > 400) return "warning";
  return "safe";
}

const levelStyles: Record<SensorRow["level"], string> = {
  safe: "text-emerald-600",
  warning: "text-amber-600",
  critical: "text-red-600",
};

const statusStyles: Record<SensorRow["status"], string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-slate-100 text-slate-600",
};

export function SensorsTable() {
  const { data } = useSensorData();
  const { query } = useSearch();
  const latest = data.latest;
  const gas = latest?.gas ?? 0;
  const level = getLevel(gas);

  const rows: SensorRow[] = [
    { id: "S001", name: "MQ-2 Gas Sensor", type: "Gas Detection", zone: "Shaft A", status: "Active", reading: `${gas} PPM`, level },
    {
      id: "S002",
      name: "DHT22 Temp Sensor",
      type: "Temperature",
      zone: "Shaft A",
      status: "Active",
      reading: `${latest?.temperature ?? 0}°C`,
      level: "safe",
    },
    {
      id: "S003",
      name: "DHT22 Humidity",
      type: "Humidity",
      zone: "Shaft A",
      status: "Active",
      reading: `${latest?.humidity ?? 0}%`,
      level: "safe",
    },
    {
      id: "S004",
      name: "Air Flow Sensor",
      type: "Ventilation",
      zone: "Shaft C",
      status: "Inactive",
      reading: "N/A",
      level: "safe",
    },
  ];

  const filtered = rows.filter((row) => {
    const q = query.toLowerCase();
    return (
      row.id.toLowerCase().includes(q) ||
      row.name.toLowerCase().includes(q) ||
      row.type.toLowerCase().includes(q) ||
      row.zone.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q) ||
      row.reading.toLowerCase().includes(q)
    );
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-200 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Sensor Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Zone</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reading</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">No sensors match your search.</td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-900">{row.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                  <td className="px-4 py-3 text-slate-900">{row.type}</td>
                  <td className="px-4 py-3 text-slate-900">{row.zone}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs ${statusStyles[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-semibold ${levelStyles[row.level]}`}>{row.reading}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
