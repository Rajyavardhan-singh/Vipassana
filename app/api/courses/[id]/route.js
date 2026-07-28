import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function PUT(req, { params }) {
  const body = await req.json();
  const { id, _id, ...doc } = body;
  const db = await getDb();
  await db.collection("courses").updateOne(
    { _id: new ObjectId(params.id) },
    { $set: doc }
  );
  return NextResponse.json({ id: params.id, ...doc });
}

export async function DELETE(req, { params }) {
  const db = await getDb();
  await db.collection("courses").deleteOne({ _id: new ObjectId(params.id) });
  return NextResponse.json({ ok: true });
}
