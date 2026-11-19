import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  clearSessionCookie,
  errorResponse,
  getSessionEmail,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/session";

type UserDoc = {
  email: string;
  password: string;
  createdAt: Date;
  lastLoginAt: Date | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function users() {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

// POST /api/auth  { action: "signup" | "login" | "logout", email?, password? }
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (action === "logout") {
      const res = NextResponse.json({ ok: true });
      clearSessionCookie(res);
      return res;
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!EMAIL_RE.test(email) || !password) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }

    const col = await users();

    if (action === "signup") {
      if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      }
      if (await col.findOne({ email })) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      await col.insertOne({
        email,
        password: await hashPassword(password),
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
      const res = NextResponse.json({ ok: true, email });
      setSessionCookie(res, email);
      return res;
    }

    if (action === "login") {
      const user = await col.findOne({ email });
      const check = user ? await verifyPassword(password, user.password) : { ok: false, needsRehash: false };
      if (!user || !check.ok) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      const update: Partial<UserDoc> = { lastLoginAt: new Date() };
      if (check.needsRehash) update.password = await hashPassword(password);
      await col.updateOne({ email }, { $set: update });

      const res = NextResponse.json({ ok: true, email });
      setSessionCookie(res, email);
      return res;
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

// GET /api/auth — return the signed-in user (from the session cookie).
export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ email: null });
    const user = await (await users()).findOne({ email }, { projection: { email: 1 } });
    if (!user) {
      const res = NextResponse.json({ email: null });
      clearSessionCookie(res);
      return res;
    }
    return NextResponse.json({ email: user.email });
  } catch (error) {
    return errorResponse(error);
  }
}
