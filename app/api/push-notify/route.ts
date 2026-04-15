import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:admin@minesafe.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const client = new MongoClient(
  process.env.MONGODB_URI ||
  "mongodb+srv://elysegihozo123:elyse123456@cluster0.t9vzx.mongodb.net/mine_safety?retryWrites=true&w=majority"
);

export async function POST(request: Request) {
  try {
    const { title, body, tag } = await request.json();
    await client.connect();
    const col = client.db("mine_safety").collection("push_subscriptions");
    const subscriptions = await col.find({}).toArray();

    const payload = JSON.stringify({ title, body, tag });

    const results = await Promise.allSettled(
      subscriptions.map((doc) =>
        webpush.sendNotification(doc.subscription, payload)
      )
    );

    // Remove expired/invalid subscriptions
    const expired: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        expired.push(subscriptions[i].subscription.endpoint);
      }
    });
    if (expired.length > 0) {
      await col.deleteMany({ "subscription.endpoint": { $in: expired } });
    }

    return NextResponse.json({ ok: true, sent: subscriptions.length - expired.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
