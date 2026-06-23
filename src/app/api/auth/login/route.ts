import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { employee: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      await prisma.loginHistory.create({
        data: { userId: user.id, status: "FAILED", failureReason: "Wrong password", ipAddress: req.headers.get("x-forwarded-for") || "unknown" },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status === "PENDING") {
      return NextResponse.json({ error: "Your account is pending HR approval." }, { status: 403 });
    }
    if (user.status === "REJECTED") {
      return NextResponse.json({ error: "Your account has been rejected." }, { status: 403 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "HR" | "EMPLOYEE",
      employeeId: user.employee?.id,
    });

    await prisma.loginHistory.create({
      data: { userId: user.id, status: "SUCCESS", ipAddress: req.headers.get("x-forwarded-for") || "unknown" },
    });

    await createAuditLog({
      actorId: user.id,
      actorRole: user.role as "HR" | "EMPLOYEE" | "SYSTEM",
      action: "USER_LOGIN",
      entityType: "user",
      entityId: user.id,
      description: `${user.email} logged in`,
    });

    const res = NextResponse.json({
      success: true,
      role: user.role,
      redirect: user.role === "HR" ? "/hr/dashboard" : "/employee/dashboard",
    });

    const cookieOpts = setAuthCookie(token) as { name: string; value: string; httpOnly: boolean; secure: boolean; sameSite: "lax"; maxAge: number; path: string };
    res.cookies.set(cookieOpts.name, cookieOpts.value, cookieOpts);
    return res;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
