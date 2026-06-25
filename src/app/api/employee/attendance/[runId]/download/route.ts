import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const session = await requireAuth("EMPLOYEE");
    const { runId } = await params;

    // Security: employee must have a payslip for this payroll run
    const payslip = await prisma.payslip.findFirst({
      where: { payrollRunId: runId, employeeId: session.employeeId },
    });
    if (!payslip) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const run = await prisma.payrollRun.findUnique({
      where: { id: runId },
      include: { upload: { select: { fileContent: true, fileName: true } } },
    });

    if (!run?.upload?.fileContent) {
      return NextResponse.json({ error: "Attendance file not found" }, { status: 404 });
    }

    const blob = new Blob([new Uint8Array(run.upload.fileContent)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${run.upload.fileName}"`,
        "Content-Length": String(run.upload.fileContent.length),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
