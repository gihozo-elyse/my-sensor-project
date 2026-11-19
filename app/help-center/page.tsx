"use client";

import { useState } from "react";
import { BarChart3, ChevronDown, CircleHelp, Plug, Search, ShieldAlert, Wifi, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useSearch } from "@/components/search-context";
import { Card, EmptyState, cx } from "@/components/ui";
import { METRICS } from "@/lib/thresholds";

type Topic = { title: string; content: string[] };
type Guide = { id: string; title: string; summary: string; icon: typeof Plug; topics: Topic[] };

const g = METRICS.gas;
const t = METRICS.temperature;
const h = METRICS.humidity;

const guides: Guide[] = [
  {
    id: "setup",
    title: "Hardware setup",
    summary: "Parts, wiring and flashing the ESP8266",
    icon: Plug,
    topics: [
      {
        title: "What you need",
        content: [
          "ESP8266 NodeMCU board",
          "MQ135 gas sensor module (analog output)",
          "DHT22 temperature & humidity sensor",
          "16×2 LCD with I²C backpack (address 0x27)",
          "Buzzer, red LED, green LED (with 220 Ω resistors)",
          "Micro-USB cable and a 2.4 GHz Wi-Fi network",
        ],
      },
      {
        title: "Wiring",
        content: [
          "MQ135: VCC → VIN (5 V), GND → GND, AO → A0",
          "DHT22: VCC → 3V3, GND → GND, DATA → D4 (GPIO2), with a 10 kΩ pull-up to 3V3",
          "LCD (I²C): SDA → D2, SCL → D1, VCC → VIN, GND → GND",
          "Buzzer → D5 (GPIO14) · Green LED → D7 (GPIO13) · Red LED → pin set by RED_LED_PIN in the sketch",
          "Note: the NodeMCU A0 pin accepts up to 3.3 V. Most MQ135 boards are fine, but check yours has a divider.",
        ],
      },
      {
        title: "Flashing the firmware",
        content: [
          "Open firmware/mine_safety/mine_safety.ino in the Arduino IDE",
          "Copy secrets.example.h to secrets.h and fill in Wi-Fi name, password, SERVER_URL and API_KEY",
          "Install libraries: DHT sensor library (Adafruit), LiquidCrystal I2C",
          "Select board “NodeMCU 1.0 (ESP-12E Module)” and upload",
          "The LCD shows the IP address once Wi-Fi connects; readings upload every 10 seconds",
        ],
      },
    ],
  },
  {
    id: "alerts",
    title: "Alert levels",
    summary: "What each level means and what to do",
    icon: ShieldAlert,
    topics: [
      {
        title: "Gas (MQ135)",
        content: [
          `Safe: up to ${g.warning} ADC: normal conditions`,
          `Warning: ${g.warning}–${g.critical} ADC: elevated gas, increase ventilation and monitor`,
          `Critical: above ${g.critical} ADC: evacuate the area and alert the safety team`,
          "Values are the raw 0–1023 analog reading, not calibrated PPM",
        ],
      },
      {
        title: "Temperature (DHT22)",
        content: [
          `Safe: up to ${t.warning} °C`,
          `Warning: ${t.warning}–${t.critical} °C: check ventilation`,
          `Critical: above ${t.critical} °C: stop work and evacuate`,
        ],
      },
      {
        title: "Humidity (DHT22)",
        content: [
          `Safe: up to ${h.warning} %`,
          `Warning: ${h.warning}–${h.critical} %: watch equipment for moisture`,
          `Critical: above ${h.critical} %: risk of equipment failure and heat stress`,
        ],
      },
      {
        title: "When an alert fires",
        content: [
          "Warning: notify the shift supervisor and increase ventilation",
          "Critical: evacuate all personnel from the zone immediately",
          "Contact the safety officer and document the incident",
          "Don't re-enter until all channels are back to Safe",
          "Review the timeline on the Alerts and Reports pages",
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Using the dashboard",
    summary: "Charts, trends, reports and notifications",
    icon: BarChart3,
    topics: [
      {
        title: "Dashboard",
        content: [
          "The banner at the top shows the overall status: All clear, Warning or Critical",
          "Each card shows the live value, its level, and the change vs. one hour ago",
          "The bar under each value shows the safe / warning / critical zones",
          "Click a card to chart that metric; switch the range between 1H, 6H, 24H and 7D",
          "Dashed lines on the chart mark the warning and critical thresholds",
        ],
      },
      {
        title: "Reports",
        content: [
          "The hourly safety map colours each hour of the last 7 days by its worst reading",
          "Daily breakdown groups hours into normal, warning and critical periods",
          "Download PDF exports the full weekly report",
        ],
      },
      {
        title: "Push notifications",
        content: [
          "Go to Settings → Push notifications and press Enable alerts",
          "Allow notifications when your browser asks",
          "Alerts are sent by the server, so they arrive even with the dashboard closed",
          "Use “Send test” to check a device is receiving them",
          "On iPhone, add the site to your Home Screen first (iOS 16.4+)",
        ],
      },
    ],
  },
  {
    id: "calibration",
    title: "Calibration & maintenance",
    summary: "Keeping readings accurate",
    icon: Wrench,
    topics: [
      {
        title: "MQ135 gas sensor",
        content: [
          "Let a new sensor burn in for 24–48 hours before trusting readings",
          "After power-on, allow a few minutes of warm-up each time",
          "Record the clean-air baseline value and compare monthly",
          "Adjust thresholds in lib/thresholds.ts and the firmware if your baseline differs",
        ],
      },
      {
        title: "DHT22 sensor",
        content: [
          "Factory calibrated: about ±0.5 °C and ±2–5 % RH",
          "Compare against a trusted thermometer/hygrometer every few months",
          "Keep it away from heat sources and direct airflow",
          "“Sensor Error / Check DHT22” on the LCD means a failed read; check the wiring and pull-up",
        ],
      },
    ],
  },
  {
    id: "network",
    title: "Troubleshooting",
    summary: "Wi-Fi, uploads and missing data",
    icon: Wifi,
    topics: [
      {
        title: "Node won't connect to Wi-Fi",
        content: [
          "The ESP8266 only supports 2.4 GHz networks",
          "Double-check WIFI_SSID and WIFI_PASSWORD in secrets.h",
          "The node keeps alarming locally while offline and retries Wi-Fi every 15 seconds",
        ],
      },
      {
        title: "LCD shows “Upload failed”",
        content: [
          "HTTP 401: API_KEY in secrets.h doesn't match SENSOR_API_KEY on the server",
          "HTTP 400: a reading was out of range; check the sensor wiring",
          "HTTP 503: SENSOR_API_KEY isn't set in the server's .env.local",
          "Negative code: the server can't be reached; check SERVER_URL uses your computer's LAN IP, not localhost",
          "Make sure the firewall allows incoming connections on port 3000",
        ],
      },
      {
        title: "Dashboard shows “Offline”",
        content: [
          "No reading has arrived in the last 60 seconds",
          "Check the node has power and look at the LCD for errors",
          "Open the Serial Monitor at 115200 baud to see detailed logs",
        ],
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Common questions",
    icon: CircleHelp,
    topics: [
      {
        title: "How often does data update?",
        content: ["The node uploads every 10 seconds; the dashboard refreshes every 5 seconds."],
      },
      {
        title: "Can several people use it at once?",
        content: ["Yes. Each person creates an account; everyone sees the same live data and can enable push alerts on their own devices."],
      },
      {
        title: "Where is the data stored?",
        content: [
          "Readings, accounts and push subscriptions are stored in MongoDB",
          "Passwords are stored hashed (scrypt), never in plain text",
        ],
      },
    ],
  },
];

export default function HelpCenterPage() {
  const { query } = useSearch();
  const [openTopic, setOpenTopic] = useState<string | null>("setup:What you need");
  const [activeGuide, setActiveGuide] = useState<string>("setup");

  const q = query.trim().toLowerCase();
  const matches = (topic: Topic) => !q || topic.title.toLowerCase().includes(q) || topic.content.some((c) => c.toLowerCase().includes(q));

  const visibleGuides = q
    ? guides.map((gd) => ({ ...gd, topics: gd.topics.filter(matches) })).filter((gd) => gd.topics.length)
    : guides.filter((gd) => gd.id === activeGuide);

  return (
    <AppShell title="Help Center" subtitle="Guides for setting up and running the monitoring system">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Guide picker */}
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:content-start">
          {guides.map((gd) => {
            const active = !q && activeGuide === gd.id;
            return (
              <button
                key={gd.id}
                onClick={() => {
                  setActiveGuide(gd.id);
                  setOpenTopic(`${gd.id}:${gd.topics[0].title}`);
                }}
                className={cx(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                  active ? "border-brand/40 bg-brand/10" : "border-line bg-surface hover:border-line-strong"
                )}
              >
                <span className={cx("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-line", active ? "bg-brand/15 text-brand" : "bg-raised text-muted")}>
                  <gd.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className={cx("block text-sm font-medium", active ? "text-brand" : "text-fg")}>{gd.title}</span>
                  <span className="hidden text-xs text-muted sm:block">{gd.summary}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Topics */}
        <div className="space-y-6">
          {visibleGuides.length === 0 ? (
            <Card>
              <EmptyState icon={<Search className="h-5 w-5" />} title="No help topics found" description={`Nothing matches “${query}”. Try “wiring”, “401” or “notifications”.`} />
            </Card>
          ) : (
            visibleGuides.map((gd) => (
              <section key={gd.id}>
                <div className="mb-3 flex items-center gap-2">
                  <gd.icon className="h-4 w-4 text-brand" />
                  <h2 className="font-semibold text-fg">{gd.title}</h2>
                </div>
                <div className="space-y-2">
                  {gd.topics.map((topic) => {
                    const key = `${gd.id}:${topic.title}`;
                    const isOpen = !!q || openTopic === key;
                    return (
                      <Card key={key} as="article" className="overflow-hidden">
                        <button
                          onClick={() => setOpenTopic(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-raised/40"
                        >
                          <span className="text-sm font-medium text-fg">{topic.title}</span>
                          <ChevronDown className={cx("h-4 w-4 text-muted transition-transform", isOpen && "rotate-180")} />
                        </button>
                        {isOpen ? (
                          <ul className="space-y-2.5 border-t border-line px-5 py-4">
                            {topic.content.map((line, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
