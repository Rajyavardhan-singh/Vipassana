import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DEFAULTS = { regularPractice: false, fullCommitment: false, silaOneYear: false, role: "student" };

export async function GET() {
  const db = await getDb();
  const doc = await db.collection("settings").findOne({ _id: "singleton" });
  if (!doc) return NextResponse.json(DEFAULTS);
  const { _id, ...rest } = doc;
  return NextResponse.json({ ...DEFAULTS, ...rest });
}

export async function PUT(req) {
  const body = await req.json();
  const db = await getDb();
  await db.collection("settings").updateOne(
    { _id: "singleton" },
    { $set: body },
    { upsert: true }
  );
  return NextResponse.json(body);
}
