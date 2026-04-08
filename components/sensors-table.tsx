"use client";

import { useSensorData } from "@/components/useSensorData";

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

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Sensor Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reading</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.type}</td>
                <td className="px-4 py-3 text-slate-600">{row.zone}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${statusStyles[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td className={`px-4 py-3 font-semibold ${levelStyles[row.level]}`}>{row.reading}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
