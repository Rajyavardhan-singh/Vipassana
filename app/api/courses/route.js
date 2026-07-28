import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  const docs = await db.collection("courses").find({}).sort({ startDate: -1 }).toArray();
  const courses = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
  return NextResponse.json(courses);
}

export async function POST(req) {
  const body = await req.json();
  const { id, _id, ...doc } = body;
  const db = await getDb();
  const result = await db.collection("courses").insertOne(doc);
  return NextResponse.json({ id: result.insertedId.toString(), ...doc });
}
