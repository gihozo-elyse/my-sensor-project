"use client";

import { Activity, Thermometer, Droplets } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSensorData } from "@/components/useSensorData";

function trendLabel(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}% since last hour`;
}

const DISTRIBUTION_COLORS = ["#f59e0b", "#0f172a", "#3b82f6"];

export function DashboardView() {
  const { data, loading, error } = useSensorData();
  const latest = data.latest;

  const cards = [
    {
      title: "Gas Level (PPM)",
      value: latest?.gas ?? 0,
      trend: data.trend.gas,
      icon: Activity,
    },
    {
      title: "Temperature (°C)",
      value: latest?.temperature ?? 0,
      trend: data.trend.temperature,
      icon: Thermometer,
    },
    {
      title: "Humidity (%)",
      value: latest?.humidity ?? 0,
      trend: data.trend.humidity,
      icon: Droplets,
    },
  ];

  const chartData = data.history.map((item) => ({
    time: item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--",
    gas: item.gas,
    temperature: item.temperature,
    humidity: item.humidity,
  }));

  const distributionData = [
    { name: "Gas Sensors", value: data.history.length || 1 },
    { name: "Temperature", value: data.history.length || 1 },
    { name: "Humidity", value: data.history.length || 1 },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2 text-slate-800">
                <Icon className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">{card.title}</span>
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                {loading ? "--" : card.value.toFixed(1)}
              </p>
              <p className={`mt-1 text-sm ${card.trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {trendLabel(card.trend)}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Sensor Readings (24h)</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: "#1e293b" }} />
                <YAxis tick={{ fontSize: 12, fill: "#1e293b" }} />
                <Tooltip />
                <Line type="monotone" dataKey="gas" stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="temperature" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Sensor Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  );
}
