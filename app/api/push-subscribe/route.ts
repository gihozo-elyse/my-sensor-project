import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(
  process.env.MONGODB_URI ||
  "mongodb+srv://elysegihozo123:elyse123456@cluster0.t9vzx.mongodb.net/mine_safety?retryWrites=true&w=majority"
);

async function getSubscriptions() {
  await client.connect();
  return client.db("mine_safety").collection("push_subscriptions");
}

export async function POST(request: Request) {
  try {
    const { subscription, email } = await request.json();
    const col = await getSubscriptions();
    await col.updateOne(
      { "subscription.endpoint": subscription.endpoint },
      { $set: { subscription, email, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    const col = await getSubscriptions();
    await col.deleteOne({ "subscription.endpoint": endpoint });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
