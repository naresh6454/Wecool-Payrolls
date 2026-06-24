import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { runPayrollProcessing } from "@/lib/process-payroll";
import { parseAttendanceBuffer, isDeviceFormat } from "@/lib/parse-attendance";
import * as XLSX from "xlsx";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("HR");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!file.name.match(/\.(xlsx|xls)$/i))
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are accepted" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const employees = await prisma.employee.findMany({ select: { id: true, employeeCode: true } });
    const empMap = new Map(employees.map(e => [e.employeeCode.trim(), e.id]));

    const now = new Date();
    const payrollYear = Number(formData.get("periodYear") || now.getFullYear());
    const payrollMonth = Number(formData.get("periodMonth") || (now.getMonth() + 1));

    // Detect format for the response label
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];
    const deviceFmt = isDeviceFormat(rawRows);

    const { errors, warnings, validRows } = parseAttendanceBuffer(buffer, empMap, payrollYear, payrollMonth);

    const dates = validRows.map(r => r.date).filter(Boolean);
    const periodStart = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const periodEnd   = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    const periodEndYear  = periodEnd.getFullYear();
    const periodEndMonth = periodEnd.getMonth() + 1;
    const payrollMonthStr = `${periodEndYear}-${String(periodEndMonth).padStart(2, "0")}`;

    const fileName = `attendance_${payrollMonthStr}_${Date.now()}.xlsx`;

    if (!process.env.VERCEL) {
      const uploadsDir = path.join(process.cwd(), "uploads", "attendance");
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, fileName), buffer);
    }

    const uploadStatus = errors.length > 0 ? "INVALID" : "VALID";

    const upload = await prisma.attendanceUpload.create({
      data: {
        fileName: file.name,
        filePath: process.env.VERCEL ? fileName : `/uploads/attendance/${fileName}`,
        fileContent: buffer,
        periodStart,
        periodEnd,
        payrollMonth: payrollMonthStr,
        uploadedById: session.userId,
        status: uploadStatus,
        validationErrors: errors.length > 0 ? JSON.stringify(errors) : null,
        totalRecords: validRows.length,
        validRecords: validRows.length - errors.length,
        invalidRecords: errors.length,
      },
    });

    let payrollRunId: string | null = null;
    if (uploadStatus === "VALID") {
      const empIds = [...new Set(validRows.map(r => r.employeeId))];
      await prisma.attendanceRecord.deleteMany({
        where: { employeeId: { in: empIds }, attendanceDate: { gte: periodStart, lte: periodEnd } },
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

      const existingRun = await prisma.payrollRun.findFirst({
        where: { payrollMonth: payrollMonthStr },
        select: { id: true, periodEnd: true },
      });
      if (existingRun) {
        const oldRecords = await prisma.payrollRecord.findMany({
          where: { payrollRunId: existingRun.id },
          select: { employeeId: true, paidLeaveDays: true },
        });
        const leaveYear = new Date(existingRun.periodEnd).getFullYear();
        for (const rec of oldRecords) {
          const lb = await prisma.leaveBalance.findFirst({
            where: { employeeId: rec.employeeId, year: leaveYear, leaveType: "LEAVE" },
          });
          if (lb) {
            await prisma.leaveBalance.update({
              where: { id: lb.id },
              data: {
                totalAllocated: Math.max(0, Number(lb.totalAllocated) - 1.33),
                used: Math.max(0, Number(lb.used) - Number(rec.paidLeaveDays)),
              },
            });
          }
        }

        await prisma.payslip.deleteMany({ where: { payrollRunId: existingRun.id } });
        await prisma.payrollRecord.deleteMany({ where: { payrollRunId: existingRun.id } });
        await prisma.payrollRun.delete({ where: { id: existingRun.id } });
      }

      try {
        const result = await runPayrollProcessing(upload.id, session.userId);
        payrollRunId = result.payrollRunId;
      } catch (processErr) {
        console.error("Auto-process failed:", processErr);
      }
    }

    await createAuditLog({
      actorId: session.userId, actorRole: "HR", action: "ATTENDANCE_UPLOAD",
      entityType: "attendance_upload", entityId: upload.id,
      description: `HR uploaded attendance for ${payrollMonthStr} (${deviceFmt ? "device" : "simple"} format). ${validRows.length} records, ${errors.length} errors, ${warnings.length} warnings.`,
    });

    return NextResponse.json({
      uploadId: upload.id, status: uploadStatus,
      totalRecords: validRows.length,
      validRecords: validRows.length - errors.length,
      invalidRecords: errors.length,
      errors, warnings,
      payrollMonth: payrollMonthStr,
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      format: deviceFmt ? "device" : "simple",
      payrollRunId,
    });

  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}
