import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

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

    // Fetch employee code to filter rows
    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { employeeCode: true },
    });

    // Parse and filter the Excel to only this employee's rows
    const buffer = Buffer.from(run.upload.fileContent);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const empCode = employee?.employeeCode ?? "";
    const filtered = rows.filter((row) => {
      const id = String(row["employee_id"] ?? row["Employee ID"] ?? row["emp_id"] ?? "").trim();
      return id === empCode;
    });

    // Build new workbook with header + filtered rows
    const newWb = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(filtered);
    XLSX.utils.book_append_sheet(newWb, newSheet, sheetName);
    const outBuffer = XLSX.write(newWb, { type: "buffer", bookType: "xlsx" });

    const blob = new Blob([outBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${run.upload.fileName}"`,
        "Content-Length": String(outBuffer.length),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
