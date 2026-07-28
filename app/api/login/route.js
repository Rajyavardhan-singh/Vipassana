import { NextResponse } from "next/server";

export async function POST(req) {
  const { password } = await req.json();

  if (password && password === process.env.APP_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("vpt_session", process.env.SESSION_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  }

  return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
}
