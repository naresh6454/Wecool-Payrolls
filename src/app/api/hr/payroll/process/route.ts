import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPayrollProcessing } from "@/lib/process-payroll";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("HR");
    const { uploadId } = await req.json();

    const upload = await prisma.attendanceUpload.findUnique({ where: { id: uploadId } });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (!["VALID", "PROCESSED"].includes(upload.status))
      return NextResponse.json({ error: "Upload is not valid" }, { status: 400 });

    const result = await runPayrollProcessing(uploadId, session.userId);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Payroll processing failed" }, { status: 500 });
  }
}
