import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  const c = clearAuthCookie() as { name: string; value: string; httpOnly: boolean; maxAge: number; path: string };
  res.cookies.set(c.name, c.value, c);
  return res;
}
