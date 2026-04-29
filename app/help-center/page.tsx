"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChevronDown, ChevronUp } from "lucide-react";

type Step = { title: string; content: string[] };
type Guide = { title: string; icon: string; steps: Step[] };

const guides: Guide[] = [
  {
    title: "ESP8266 Setup Guide",
    icon: "🔌",
    steps: [
      {
        title: "What You Need",
        content: [
          "ESP8266 NodeMCU board",
          "MQ-2 Gas Sensor",
          "DHT22 Temperature & Humidity Sensor",
          "USB cable (Micro-USB)",
          "Stable Wi-Fi connection",
        ],
      },
      {
        title: "Wiring the Sensors",
        content: [
          "MQ-2 Gas Sensor: VCC → 3.3V, GND → GND, AO → A0 pin on ESP8266",
          "DHT22 Sensor: VCC → 3.3V, GND → GND, DATA → D4 pin on ESP8266",
          "Double-check all connections before powering on",
          "Use a breadboard for easier connections",
        ],
      },
      {
        title: "Connecting to the Dashboard",
        content: [
          "Power on the ESP8266 and wait 30 seconds for it to connect to Wi-Fi",
          "Open your dashboard at http://localhost:3000 or your deployed URL",
          "You should see live readings updating automatically every 5 seconds",
          "If no data appears, make sure the ESP8266 power light is on and it is within Wi-Fi range",
        ],
      },
    ],
  },
  {
    title: "Understanding Alert Levels",
    icon: "⚠️",
    steps: [
      {
        title: "Gas Level (PPM) Thresholds",
        content: [
          "✅ Safe: 0 – 400 PPM — Normal mining conditions, no action needed",
          "⚠️ Warning: 401 – 800 PPM — Elevated gas detected, increase ventilation and monitor closely",
          "🚨 Critical: Above 800 PPM — Dangerous levels, evacuate the area immediately and alert safety team",
        ],
      },
      {
        title: "Temperature (°C) Thresholds",
        content: [
          "✅ Safe: Below 35°C — Normal operating temperature",
          "⚠️ Warning: 35°C – 40°C — High temperature, check ventilation systems",
          "🚨 Critical: Above 40°C — Dangerously hot, stop operations and evacuate",
        ],
      },
      {
        title: "Humidity (%) Thresholds",
        content: [
          "✅ Safe: Below 70% — Normal humidity levels",
          "⚠️ Warning: 70% – 90% — High humidity, monitor equipment for moisture damage",
          "🚨 Critical: Above 90% — Extremely humid, risk of equipment failure and health hazards",
        ],
      },
      {
        title: "What To Do When Alerts Fire",
        content: [
          "Warning alert: Notify the shift supervisor and increase ventilation",
          "Critical alert: Immediately evacuate all personnel from the affected zone",
          "Contact the safety officer and document the incident",
          "Do not re-enter until sensors confirm safe levels",
          "Check the Reports page for a full timeline of the incident",
        ],
      },
    ],
  },
  {
    title: "Sensor Calibration",
    icon: "🔧",
    steps: [
      {
        title: "When to Calibrate",
        content: [
          "Calibrate sensors every 3 months for accurate readings",
          "Recalibrate after any physical damage or replacement",
          "Calibrate when readings seem inconsistent with actual conditions",
          "Always calibrate in a known clean-air environment",
        ],
      },
      {
        title: "Calibrating the MQ-2 Gas Sensor",
        content: [
          "Power on the sensor and let it warm up for at least 24 hours before first use",
          "In clean air, the sensor should read close to 0 PPM",
          "Adjust the potentiometer on the sensor board if baseline is too high",
          "Use a known gas concentration source to verify accuracy",
          "Contact your system administrator if readings remain inaccurate",
        ],
      },
      {
        title: "Calibrating the DHT22 Sensor",
        content: [
          "DHT22 is factory calibrated and generally accurate to ±0.5°C and ±2% humidity",
          "Compare readings with a trusted thermometer/hygrometer",
          "Avoid placing the sensor near heat sources or direct airflow",
          "Contact your system administrator if a correction offset is needed",
          "Replace the sensor if readings are consistently off by more than 3°C",
        ],
      },
    ],
  },
  {
    title: "Network Troubleshooting",
    icon: "🌐",
    steps: [
      {
        title: "ESP8266 Not Connecting to Wi-Fi",
        content: [
          "Make sure your router is on 2.4GHz — ESP8266 does not support 5GHz",
          "Move the ESP8266 closer to the router to improve signal strength",
          "Try restarting both the router and the ESP8266",
          "Contact your system administrator if the issue persists",
        ],
      },
      {
        title: "Dashboard Not Receiving Data",
        content: [
          "Confirm the ESP8266 power light is on and it is connected to Wi-Fi",
          "Ensure the dashboard server is running and accessible",
          "Check that your firewall is not blocking port 3000",
          "Try accessing /api/sensor directly in your browser to test the endpoint",
          "Contact your system administrator if the issue persists",
        ],
      },
      {
        title: "Data Showing as 0 or Incorrect",
        content: [
          "Check all sensor wiring connections are secure",
          "Make sure the sensor has enough warm-up time (MQ-2 needs 24h first use)",
          "Replace the sensor if values remain at 0 after checking all connections",
          "Contact your system administrator for further assistance",
        ],
      },
    ],
  },
  {
    title: "Reading Sensor Data",
    icon: "📊",
    steps: [
      {
        title: "Dashboard Overview",
        content: [
          "The dashboard shows the 3 latest sensor readings: Gas (PPM), Temperature (°C), Humidity (%)",
          "Values update automatically every 5 seconds",
          "The trend percentage shows change compared to the previous reading",
          "Green trend = improving, Red trend = worsening conditions",
        ],
      },
      {
        title: "Understanding the Charts",
        content: [
          "Sensor Readings (24h) chart shows the last 24 data points over time",
          "Amber line = Gas level, Dark line = Temperature, Blue line = Humidity",
          "Hover over any point on the chart to see exact values at that time",
          "Sensor Distribution pie chart shows equal weight of all 3 sensor types",
        ],
      },
      {
        title: "Sensors Page",
        content: [
          "Shows all connected sensors with their current status and readings",
          "Active = sensor is online and sending data",
          "Inactive = sensor is offline or not responding",
          "Reading column shows the latest value with color: green = safe, amber = warning, red = critical",
        ],
      },
      {
        title: "Reports Page",
        content: [
          "Weekly report groups sensor data by day and shows condition periods",
          "Each period shows the status (Normal/Warning/Critical), time range, and reason",
          "Download PDF to save or share the weekly report",
          "Use the search bar to filter by day name or condition type",
        ],
      },
    ],
  },
  {
    title: "FAQ",
    icon: "❓",
    steps: [
      {
        title: "How often does the dashboard update?",
        content: [
          "The dashboard polls the sensor API every 5 seconds automatically",
          "No manual refresh is needed — data updates in real time",
        ],
      },
      {
        title: "Can multiple users log in at the same time?",
        content: [
          "Yes, multiple users can create accounts and log in simultaneously",
          "All users see the same live sensor data",
          "Push notifications are sent to all logged-in devices",
        ],
      },
      {
        title: "What happens if the ESP8266 loses connection?",
        content: [
          "The dashboard will continue showing the last received data",
          "No new data points will be added to the history",
          "The ESP8266 will automatically try to reconnect to Wi-Fi",
          "Once reconnected, data will resume flowing to the dashboard",
        ],
      },
      {
        title: "How do I receive push notifications on my phone?",
        content: [
          "Open the dashboard on your phone's browser",
          "Log in with your account",
          "When prompted, tap 'Allow' for notifications",
          "You will now receive alerts even when the browser is closed",
          "Supported on Chrome, Edge, and Firefox on Android and desktop",
        ],
      },
      {
        title: "Where is the sensor data stored?",
        content: [
          "All sensor readings are stored in MongoDB Atlas cloud database",
          "Data is retained and accessible from the Reports and Dashboard pages",
          "User accounts are also stored securely in the same database",
        ],
      },
    ],
  },
];

export default function HelpCenterPage() {
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<string | null>(null);

  return (
    <AppShell title="Help Center" subtitle="Guides and documentation for the Mine Safety Monitoring System">
      <div className="space-y-4">
        {guides.map((guide) => {
          const isGuideOpen = openGuide === guide.title;
          return (
            <article key={guide.title} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Guide header */}
              <button
                onClick={() => {
                  setOpenGuide(isGuideOpen ? null : guide.title);
                  setOpenStep(null);
                }}
                className="flex w-full items-center justify-between p-5 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{guide.icon}</span>
                  <span className="font-semibold text-slate-900">{guide.title}</span>
                </div>
                {isGuideOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {/* Guide content */}
              {isGuideOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3 space-y-2">
                  {guide.steps.map((step) => {
                    const stepKey = `${guide.title}-${step.title}`;
                    const isStepOpen = openStep === stepKey;
                    return (
                      <div key={step.title} className="rounded-xl border border-slate-100 overflow-hidden">
                        <button
                          onClick={() => setOpenStep(isStepOpen ? null : stepKey)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition"
                        >
                          <span className="text-sm font-medium text-slate-800">{step.title}</span>
                          {isStepOpen ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        {isStepOpen && (
                          <ul className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-2">
                            {step.content.map((line, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
