import webpush, { type PushSubscription, type WebPushError } from "web-push";
import { getDb } from "@/lib/mongodb";

export type PushSubscriptionDoc = {
  subscription: PushSubscription;
  email: string;
  updatedAt: Date;
};

let configured: boolean | null = null;

function configure() {
  if (configured !== null) return configured;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set — push notifications are disabled.");
    configured = false;
    return false;
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
  configured = true;
  return true;
}

export function pushEnabled() {
  return configure();
}

export async function subscriptions() {
  const db = await getDb();
  return db.collection<PushSubscriptionDoc>("push_subscriptions");
}

type Payload = { title: string; body: string; tag?: string };

async function deliver(docs: PushSubscriptionDoc[], payload: Payload) {
  if (!configure() || docs.length === 0) return 0;
  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(docs.map((d) => webpush.sendNotification(d.subscription, body)));

  // Only drop subscriptions the push service says are gone (404/410), not transient failures.
  const gone = results.flatMap((r, i) => {
    if (r.status !== "rejected") return [];
    const code = (r.reason as WebPushError)?.statusCode;
    return code === 404 || code === 410 ? [docs[i].subscription.endpoint] : [];
  });
  if (gone.length) {
    const col = await subscriptions();
    await col.deleteMany({ "subscription.endpoint": { $in: gone } });
  }
  return results.filter((r) => r.status === "fulfilled").length;
}

export async function sendPushToAll(payload: Payload) {
  const col = await subscriptions();
  return deliver(await col.find({}).toArray(), payload);
}

export async function sendPushToUser(email: string, payload: Payload) {
  const col = await subscriptions();
  return deliver(await col.find({ email }).toArray(), payload);
}
