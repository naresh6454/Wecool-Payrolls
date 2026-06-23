import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { runPayrollProcessing } from "@/lib/process-payroll";
import * as XLSX from "xlsx";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Map device status codes to our system statuses
const STATUS_MAP: Record<string, string> = {
  P:  "PRESENT",
  A:  "ABSENT",
  HD: "HALF_DAY",
  wo: "WEEKLY_OFF",
  WO: "WEEKLY_OFF",
  L:  "LEAVE",
  Ho: "HOLIDAY",
  HO: "HOLIDAY",
  "": "",
};

function parseTimeStr(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}/.test(s)) return s.substring(0, 5);
  if (typeof val === "number" && val > 0 && val < 1) {
    const totalMins = Math.round(val * 24 * 60);
    const h = String(Math.floor(totalMins / 60)).padStart(2, "0");
    const m = String(totalMins % 60).padStart(2, "0");
    return `${h}:${m}`;
  }
  return null;
}

function parseOtHours(val: unknown): number {
  if (!val || val === "0" || val === 0) return 0;
  const s = String(val).trim();
  const match = s.match(/^(\d+):(\d+)/);
  if (match) return parseInt(match[1]) + parseInt(match[2]) / 60;
  return 0;
}

// Detect if this is the device export format (D, 14, 15, 16... header)
function isDeviceFormat(rows: unknown[][]): boolean {
  const header = rows[0] as unknown[];
  return String(header[0]).trim() === "D" && !isNaN(Number(header[1]));
}

// Build date map from day-number columns
// Days that decrease (e.g. 30→1) indicate a month rollover
function buildDateColumns(dayRow: unknown[], payrollYear: number, payrollMonth: number): (Date | null)[] {
  // payrollMonth is the "to" month (e.g. 5 for May)
  // days before the rollover belong to payrollMonth-1, days after belong to payrollMonth
  const days = dayRow.slice(1).map(d => Number(d));
  const dates: (Date | null)[] = [];
  let currentMonth = payrollMonth - 1; // start in previous month
  let prevDay = -1;

  for (const day of days) {
    if (!day || isNaN(day)) { dates.push(null); continue; }
    if (prevDay > 0 && day < prevDay) {
      // Month rolled over
      currentMonth = payrollMonth;
    }
    const year = currentMonth <= 0
      ? payrollYear - 1
      : currentMonth === 13
        ? payrollYear + 1
        : payrollYear;
    const month = currentMonth <= 0 ? 12 : currentMonth > 12 ? 1 : currentMonth;
    // Use UTC midnight to avoid IST → previous-UTC-day shift
    dates.push(new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`));
    prevDay = day;
  }
  return dates;
}

async function parseDeviceFormat(
  rows: unknown[][],
  empMap: Map<string, string>,
  payrollYear: number,
  payrollMonth: number,
) {
  const dateColumns = buildDateColumns(rows[0] as unknown[], payrollYear, payrollMonth);
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: string[] = [];
  const validRows: Array<{
    employeeId: string; date: Date; checkIn: string | null; checkOut: string | null;
    status: string; workingHours: number | null; overtimeHours: number;
  }> = [];

  let i = 1; // start after header row
  while (i < rows.length) {
    const infoRow = rows[i] as unknown[];
    // Employee info row: employee code is at index 20
    const empName = String(infoRow[0] || "").trim();
    if (!empName || empName === "S") { i++; continue; }

    // Ensure next rows are S, I, O, W, o
    const sRow  = rows[i + 1] as unknown[] | undefined;
    const iRow  = rows[i + 2] as unknown[] | undefined;
    const oRow  = rows[i + 3] as unknown[] | undefined;
    const wRow  = rows[i + 4] as unknown[] | undefined;
    const otRow = rows[i + 5] as unknown[] | undefined;

    if (!sRow || String(sRow[0]) !== "S") { i++; continue; }

    // Scan entire info row for a cell that matches a known employee code
    // (different device export versions place it at different column indices)
    let empCode = "";
    for (let c = 1; c < infoRow.length; c++) {
      const cell = String(infoRow[c] || "").trim();
      if (cell && empMap.has(cell)) { empCode = cell; break; }
    }
    if (!empCode) {
      warnings.push(`Could not find employee code for "${empName}" (row ${i + 1})`);
      i += 6; continue;
    }

    const empDbId = empMap.get(empCode);
    if (!empDbId) {
      warnings.push(`Employee code "${empCode}" (${empName}) not found in system — skipped`);
      i += 6; continue;
    }

    // Process each day column (indices 1..N)
    for (let col = 1; col < dateColumns.length + 1; col++) {
      const date = dateColumns[col - 1];
      if (!date) continue;

      const rawStatus = String(sRow[col] || "").trim();
      if (!rawStatus) continue; // blank = no data for this day

      const status = STATUS_MAP[rawStatus] || STATUS_MAP[rawStatus.toUpperCase()] || "PRESENT";
      if (!status) continue;

      const checkIn    = iRow  ? parseTimeStr(iRow[col])  : null;
      const checkOut   = oRow  ? parseTimeStr(oRow[col])  : null;
      const otHours    = otRow ? parseOtHours(otRow[col]) : 0;
      const wRaw       = wRow  ? String(wRow[col] || "").trim() : "";
      const wMatch     = wRaw.match(/^(\d+):(\d+)/);
      const workingHrs = wMatch ? parseInt(wMatch[1]) + parseInt(wMatch[2]) / 60 : null;

      // Detect late arrival (check in after 09:10)
      let isLate = false;
      let lateMinutes = 0;
      if (checkIn) {
        const [h, m] = checkIn.split(":").map(Number);
        const totalMins = h * 60 + m;
        if (totalMins > 9 * 60 + 10) {
          isLate = true;
          lateMinutes = totalMins - (9 * 60);
        }
      }

      validRows.push({ employeeId: empDbId, date, checkIn, checkOut, status, workingHours: workingHrs, overtimeHours: otHours });

      // Store late info inline for upsert
      (validRows[validRows.length - 1] as typeof validRows[number] & { isLate: boolean; lateMinutes: number }).isLate = isLate;
      (validRows[validRows.length - 1] as typeof validRows[number] & { isLate: boolean; lateMinutes: number }).lateMinutes = lateMinutes;
    }

    i += 6; // advance past this employee's 6-row block
  }

  return { errors, warnings, validRows };
}

// Simple format parser (employee_id, date, status columns)
async function parseSimpleFormat(rows: Record<string, unknown>[], empMap: Map<string, string>) {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: string[] = [];
  const validRows: Array<{
    employeeId: string; date: Date; checkIn: string | null; checkOut: string | null;
    status: string; workingHours: number | null; overtimeHours: number;
    isLate?: boolean; lateMinutes?: number;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const empCode = String(row["employee_id"] || row["Employee ID"] || row["emp_id"] || "").trim();
    const dateRaw = row["date"] || row["Date"];
    const statusRaw = String(row["status"] || row["Status"] || "PRESENT").trim().toUpperCase();

    if (!empCode) { errors.push({ row: rowNum, field: "employee_id", message: "Missing employee ID" }); continue; }
    if (!empMap.has(empCode)) { errors.push({ row: rowNum, field: "employee_id", message: `Employee ${empCode} not found` }); continue; }

    let date: Date | null = null;
    if (typeof dateRaw === "number") date = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
    else if (dateRaw) { const d = new Date(String(dateRaw)); if (!isNaN(d.getTime())) date = d; }
    if (!date) { errors.push({ row: rowNum, field: "date", message: `Invalid date: ${dateRaw}` }); continue; }

    validRows.push({
      employeeId: empMap.get(empCode)!,
      date,
      checkIn: parseTimeStr(row["check_in"] || row["Check In"]),
      checkOut: parseTimeStr(row["check_out"] || row["Check Out"]),
      status: statusRaw,
      workingHours: null,
      overtimeHours: 0,
    });
  }

  return { errors, warnings, validRows };
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth("HR");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!file.name.match(/\.(xlsx|xls)$/i))
      return NextResponse.json({ error: "Only Excel files (.xlsx, .xls) are accepted" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

    // Get all employees
    const employees = await prisma.employee.findMany({ select: { id: true, employeeCode: true } });
    const empMap = new Map(employees.map(e => [e.employeeCode.trim(), e.id]));

    // Detect format
    const deviceFmt = isDeviceFormat(rawRows);

    // Use HR-specified period year/month (from form); fallback to current month
    const now = new Date();
    const payrollYear = Number(formData.get("periodYear") || now.getFullYear());
    const payrollMonth = Number(formData.get("periodMonth") || (now.getMonth() + 1));

    let errors: Array<{ row: number; field: string; message: string }> = [];
    let warnings: string[] = [];
    let validRows: Array<{
      employeeId: string; date: Date; checkIn: string | null; checkOut: string | null;
      status: string; workingHours: number | null; overtimeHours: number;
      isLate?: boolean; lateMinutes?: number;
    }> = [];

    if (deviceFmt) {
      const result = await parseDeviceFormat(rawRows, empMap, payrollYear, payrollMonth);
      errors = result.errors;
      warnings = result.warnings;
      validRows = result.validRows as typeof validRows;
    } else {
      const simpleRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const result = await parseSimpleFormat(simpleRows, empMap);
      errors = result.errors;
      warnings = result.warnings;
      validRows = result.validRows;
    }

    const dates = validRows.map(r => r.date).filter(Boolean);
    const periodStart = dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const periodEnd   = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    // Derive payroll month label from the END date of the period (e.g. "2026-05")
    const periodEndYear  = periodEnd.getFullYear();
    const periodEndMonth = periodEnd.getMonth() + 1;
    const payrollMonthStr = `${periodEndYear}-${String(periodEndMonth).padStart(2, "0")}`;

    // Save file
    const uploadsDir = path.join(process.cwd(), "uploads", "attendance");
    await mkdir(uploadsDir, { recursive: true });
    const fileName = `attendance_${payrollMonthStr}_${Date.now()}.xlsx`;
    await writeFile(path.join(uploadsDir, fileName), buffer);

    const uploadStatus = errors.length > 0 ? "INVALID" : "VALID";

    const upload = await prisma.attendanceUpload.create({
      data: {
        fileName: file.name,
        filePath: `/uploads/attendance/${fileName}`,
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

    // Persist records if valid
    let payrollRunId: string | null = null;
    if (uploadStatus === "VALID") {
      // Clear all attendance records in this date range (full re-upload)
      const empIds = [...new Set(validRows.map(r => r.employeeId))];
      await prisma.attendanceRecord.deleteMany({
        where: { employeeId: { in: empIds }, attendanceDate: { gte: periodStart, lte: periodEnd } },
      });

      for (const r of validRows) {
        const rec = r as typeof r & { isLate?: boolean; lateMinutes?: number };
        await prisma.attendanceRecord.upsert({
          where: { employeeId_attendanceDate: { employeeId: r.employeeId, attendanceDate: r.date } },
          update: {
            checkIn: r.checkIn, checkOut: r.checkOut, status: r.status,
            workingHours: r.workingHours ?? undefined,
            overtimeHours: r.overtimeHours,
            isLate: rec.isLate ?? false, lateMinutes: rec.lateMinutes ?? 0,
            uploadId: upload.id,
          },
          create: {
            employeeId: r.employeeId, uploadId: upload.id, attendanceDate: r.date,
            checkIn: r.checkIn, checkOut: r.checkOut, status: r.status,
            workingHours: r.workingHours ?? undefined,
            overtimeHours: r.overtimeHours,
            isLate: rec.isLate ?? false, lateMinutes: rec.lateMinutes ?? 0,
            entryType: "EXCEL",
          },
        });
      }

      // Delete existing payroll run for this month so fresh data is generated
      const existingRun = await prisma.payrollRun.findFirst({
        where: { payrollMonth: payrollMonthStr },
        select: { id: true, periodEnd: true },
      });
      if (existingRun) {
        // Reverse leave balance changes from the previous run before deleting
        // so re-upload starts from a clean slate (no double accrual, no double deduction)
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
            // Reverse: undo the 1.33 accrual and undo the auto-converted paid leave deduction.
            // Use absolute values (not decrement) to prevent going negative.
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

      // Auto-process payroll from the new upload
      try {
        const result = await runPayrollProcessing(upload.id, session.userId);
        payrollRunId = result.payrollRunId;
      } catch (processErr) {
        console.error("Auto-process failed:", processErr);
        // Non-fatal — upload succeeded; HR can retry from the review page
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
