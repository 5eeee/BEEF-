import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (!password || password !== adminPassword) {
    return NextResponse.json({ detail: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, token: adminPassword });
  response.cookies.set("admin_session", "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  response.cookies.set("admin_token", adminPassword, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
