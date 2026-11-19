import { NextResponse } from "next/server";
import { pushEnabled, sendPushToUser } from "@/lib/push";
import { errorResponse, getSessionEmail, unauthorized } from "@/lib/session";

// POST /api/push-notify — send a test notification to the signed-in user's devices.
// Real alerts are sent by the server when readings arrive (see /api/sensor).
export async function POST() {
  const email = await getSessionEmail();
  if (!email) return unauthorized();
  if (!pushEnabled()) {
    return NextResponse.json({ error: "Push notifications are not configured on the server." }, { status: 503 });
  }

  try {
    const sent = await sendPushToUser(email, {
      title: "🔔 Test notification",
      body: "Push alerts are working on this device.",
      tag: "test",
    });
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    return errorResponse(error);
  }
}
