"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function sendPush(title: string, body: string, tag: string) {
  await fetch("/api/push-notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, tag }),
  });
}

export function SensorMonitor() {
  const { email } = useAuth();
  const prevRef = useRef({ gas: 0, temp: 0, humidity: 0 });
  const subscribedRef = useRef(false);

  // Register service worker and subscribe to push
  useEffect(() => {
    if (!email || subscribedRef.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function registerAndSubscribe() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const existing = await reg.pushManager.getSubscription();
        const subscription =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          }));

        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription, email }),
        });

        subscribedRef.current = true;
      } catch (err) {
        console.error("Push registration failed:", err);
      }
    }

    registerAndSubscribe();
  }, [email]);

  // Poll sensor data and fire notifications
  useEffect(() => {
    if (!email) return;
    let isMounted = true;

    const fetchAndNotify = async () => {
      try {
        const res = await fetch("/api/sensor", { cache: "no-store" });
        if (!res.ok) return;
        const result = await res.json();
        if (!isMounted) return;

        const gas: number = result.latest?.gas ?? 0;
        const temp: number = result.latest?.temperature ?? 0;
        const humidity: number = result.latest?.humidity ?? 0;
        const prev = prevRef.current;

        // Gas
        if (gas > 800 && prev.gas <= 800) {
          const msg = `⚠️ Critical gas: ${gas.toFixed(1)} PPM — Evacuate immediately!`;
          toast.error(msg, { duration: 8000, position: "top-right" });
          sendPush("⚠️ Critical Gas Alert", `Gas level: ${gas.toFixed(1)} PPM — Sensor alert! Be careful, evacuate immediately.`, "gas");
        } else if (gas > 400 && prev.gas <= 400) {
          const msg = `⚠️ Gas rising: ${gas.toFixed(1)} PPM — Be careful!`;
          toast.warning(msg, { duration: 6000, position: "top-right" });
          sendPush("⚠️ Gas Level Rising", `Gas level: ${gas.toFixed(1)} PPM — Sensor detected elevated gas. Be careful!`, "gas");
        } else if (gas <= 400 && prev.gas > 400) {
          toast.success(`✅ Gas back to safe: ${gas.toFixed(1)} PPM`, { position: "top-right" });
          sendPush("✅ Gas Level Safe", `Gas level back to safe: ${gas.toFixed(1)} PPM`, "gas");
        }

        // Temperature
        if (temp > 40 && prev.temp <= 40) {
          const msg = `🌡️ Critical temp: ${temp.toFixed(1)}°C — Dangerously hot!`;
          toast.error(msg, { duration: 8000, position: "top-right" });
          sendPush("🌡️ Critical Temperature", `Temperature: ${temp.toFixed(1)}°C — Sensor alert! Be careful, dangerously hot.`, "temp");
        } else if (temp > 35 && prev.temp <= 35) {
          const msg = `🌡️ Temp rising: ${temp.toFixed(1)}°C — Be careful!`;
          toast.warning(msg, { duration: 6000, position: "top-right" });
          sendPush("🌡️ Temperature Rising", `Temperature: ${temp.toFixed(1)}°C — Sensor detected high heat. Be careful!`, "temp");
        } else if (temp <= 35 && prev.temp > 35) {
          toast.success(`✅ Temperature normal: ${temp.toFixed(1)}°C`, { position: "top-right" });
          sendPush("✅ Temperature Normal", `Temperature back to normal: ${temp.toFixed(1)}°C`, "temp");
        }

        // Humidity
        if (humidity > 90 && prev.humidity <= 90) {
          const msg = `💧 Critical humidity: ${humidity.toFixed(1)}% — Extremely humid!`;
          toast.error(msg, { duration: 8000, position: "top-right" });
          sendPush("💧 Critical Humidity", `Humidity: ${humidity.toFixed(1)}% — Sensor alert! Be careful, extremely humid.`, "humidity");
        } else if (humidity > 70 && prev.humidity <= 70) {
          const msg = `💧 Humidity rising: ${humidity.toFixed(1)}% — Be careful!`;
          toast.warning(msg, { duration: 6000, position: "top-right" });
          sendPush("💧 Humidity Rising", `Humidity: ${humidity.toFixed(1)}% — Sensor detected high humidity. Be careful!`, "humidity");
        } else if (humidity <= 70 && prev.humidity > 70) {
          toast.success(`✅ Humidity normal: ${humidity.toFixed(1)}%`, { position: "top-right" });
          sendPush("✅ Humidity Normal", `Humidity back to normal: ${humidity.toFixed(1)}%`, "humidity");
        }

        prevRef.current = { gas, temp, humidity };
      } catch {
        // silently ignore
      }
    };

    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [email]);

  return null;
}
