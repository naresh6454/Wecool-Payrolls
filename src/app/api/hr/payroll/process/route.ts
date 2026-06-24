import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runPayrollProcessing } from "@/lib/process-payroll";
import { parseAttendanceBuffer } from "@/lib/parse-attendance";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("HR");
    const { uploadId } = await req.json();

    const upload = await prisma.attendanceUpload.findUnique({ where: { id: uploadId } });
    if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    if (!["VALID", "PROCESSED"].includes(upload.status))
      return NextResponse.json({ error: "Upload is not valid" }, { status: 400 });

    // Re-parse attendance from stored file content so newly matched employee codes are picked up
    if (upload.fileContent) {
      const employees = await prisma.employee.findMany({ select: { id: true, employeeCode: true } });
      const empMap = new Map(employees.map(e => [e.employeeCode.trim(), e.id]));

      const periodEndMonth = upload.periodEnd.getMonth() + 1;
      const periodEndYear = upload.periodEnd.getFullYear();

      // Derive payrollMonth and payrollYear from period end
      const payrollYear = periodEndYear;
      const payrollMonth = periodEndMonth;

      const buffer = Buffer.from(upload.fileContent);
      const { validRows } = parseAttendanceBuffer(buffer, empMap, payrollYear, payrollMonth);

      if (validRows.length > 0) {
        const empIds = [...new Set(validRows.map(r => r.employeeId))];
        // Only clear records for employees present in this Excel (don't touch others)
        await prisma.attendanceRecord.deleteMany({
          where: {
            employeeId: { in: empIds },
            attendanceDate: { gte: upload.periodStart, lte: upload.periodEnd },
          },
        });

        for (const r of validRows) {
          await prisma.attendanceRecord.upsert({
            where: { employeeId_attendanceDate: { employeeId: r.employeeId, attendanceDate: r.date } },
            update: {
              checkIn: r.checkIn, checkOut: r.checkOut, status: r.status,
              workingHours: r.workingHours ?? undefined,
              overtimeHours: r.overtimeHours,
              isLate: r.isLate, lateMinutes: r.lateMinutes,
              uploadId: upload.id,
            },
            create: {
              employeeId: r.employeeId, uploadId: upload.id, attendanceDate: r.date,
              checkIn: r.checkIn, checkOut: r.checkOut, status: r.status,
              workingHours: r.workingHours ?? undefined,
              overtimeHours: r.overtimeHours,
              isLate: r.isLate, lateMinutes: r.lateMinutes,
              entryType: "EXCEL",
            },
          });
        }
      }
    }

    const result = await runPayrollProcessing(uploadId, session.userId);
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Payroll processing failed" }, { status: 500 });
  }
}
