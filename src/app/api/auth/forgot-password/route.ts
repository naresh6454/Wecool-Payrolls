import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to avoid email enumeration
    if (!user) return NextResponse.json({ success: true });

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "Wecool Payroll <noreply@wecoolimports.com>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e7e5e4">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
            <div style="width:36px;height:36px;background:#f97316;border-radius:8px;display:flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-weight:700;font-size:16px">W</span>
            </div>
            <span style="font-weight:700;font-size:18px;color:#1c1917">Wecool Payroll</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#1c1917;margin:0 0 8px">Reset your password</h2>
          <p style="color:#57534e;font-size:14px;line-height:1.6;margin:0 0 24px">
            We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;background:#f97316;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none">
            Reset Password
          </a>
          <p style="color:#a8a29e;font-size:12px;margin-top:24px">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Forgot password error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
