import { NextResponse } from "next/server";
import { subscriptions } from "@/lib/push";
import { errorResponse, getSessionEmail, unauthorized } from "@/lib/session";

export async function POST(request: Request) {
  const email = await getSessionEmail();
  if (!email) return unauthorized();

  try {
    const { subscription } = await request.json();
    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    const col = await subscriptions();
    await col.updateOne(
      { "subscription.endpoint": subscription.endpoint },
      { $set: { subscription, email, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const email = await getSessionEmail();
  if (!email) return unauthorized();

  try {
    const { endpoint } = await request.json();
    const col = await subscriptions();
    await col.deleteOne({ "subscription.endpoint": endpoint, email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
