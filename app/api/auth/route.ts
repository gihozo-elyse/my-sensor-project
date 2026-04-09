import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://elysegihozo123:elyse123456@cluster0.t9vzx.mongodb.net/mine_safety?retryWrites=true&w=majority";

const client = new MongoClient(uri);

type UserDoc = {
  email: string;
  password: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  loggedOut: boolean;
};

async function getUsers() {
  await client.connect();
  return client.db("mine_safety").collection<UserDoc>("users");
}

// POST /api/auth  { action: "signup" | "login" | "logout", email, password? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password } = body;
    const users = await getUsers();

    if (action === "signup") {
      const existing = await users.findOne({ email });
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      await users.insertOne({
        email,
        password,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        loggedOut: false,
      });
      return NextResponse.json({ ok: true, email });
    }

    if (action === "login") {
      const user = await users.findOne({ email, password });
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
      }
      await users.updateOne({ email }, { $set: { lastLoginAt: new Date(), loggedOut: false } });
      return NextResponse.json({ ok: true, email });
    }

    if (action === "logout") {
      await users.updateOne({ email }, { $set: { loggedOut: true } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/auth?email=xxx  — verify the user exists in DB (session check on refresh)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) return NextResponse.json({ valid: false });

    const users = await getUsers();
    const user = await users.findOne({ email });
    return NextResponse.json({ valid: !!user, email: user?.email ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
