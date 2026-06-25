import * as XLSX from "xlsx";

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

export function isDeviceFormat(rows: unknown[][]): boolean {
  const header = rows[0] as unknown[];
  return String(header[0]).trim() === "D" && !isNaN(Number(header[1]));
}

function buildDateColumns(dayRow: unknown[], payrollYear: number, payrollMonth: number): (Date | null)[] {
  const days = dayRow.slice(1).map(d => Number(d));
  const dates: (Date | null)[] = [];
  let currentMonth = payrollMonth - 1;
  let prevDay = -1;

  for (const day of days) {
    if (!day || isNaN(day)) { dates.push(null); continue; }
    if (prevDay > 0 && day < prevDay) currentMonth = payrollMonth;
    const year = currentMonth <= 0 ? payrollYear - 1 : currentMonth === 13 ? payrollYear + 1 : payrollYear;
    const month = currentMonth <= 0 ? 12 : currentMonth > 12 ? 1 : currentMonth;
    dates.push(new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`));
    prevDay = day;
  }
  return dates;
}

export type ParsedRow = {
  employeeId: string;
  date: Date;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workingHours: number | null;
  overtimeHours: number;
  isLate: boolean;
  lateMinutes: number;
};

export function parseDeviceFormat(
  rows: unknown[][],
  empMap: Map<string, string>,
  payrollYear: number,
  payrollMonth: number,
): { errors: Array<{ row: number; field: string; message: string }>; warnings: string[]; validRows: ParsedRow[] } {
  const dateColumns = buildDateColumns(rows[0] as unknown[], payrollYear, payrollMonth);
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: string[] = [];
  const validRows: ParsedRow[] = [];

  let i = 1;
  while (i < rows.length) {
    const infoRow = rows[i] as unknown[];
    const empName = String(infoRow[0] || "").trim();
    if (!empName || empName === "S") { i++; continue; }

    const sRow  = rows[i + 1] as unknown[] | undefined;
    const iRow  = rows[i + 2] as unknown[] | undefined;
    const oRow  = rows[i + 3] as unknown[] | undefined;
    const wRow  = rows[i + 4] as unknown[] | undefined;
    const otRow = rows[i + 5] as unknown[] | undefined;

    if (!sRow || String(sRow[0]) !== "S") { i++; continue; }

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

    for (let col = 1; col < dateColumns.length + 1; col++) {
      const date = dateColumns[col - 1];
      if (!date) continue;

      const rawStatus = String(sRow[col] || "").trim();
      if (!rawStatus) continue;

      const status = STATUS_MAP[rawStatus] || STATUS_MAP[rawStatus.toUpperCase()] || "PRESENT";
      if (!status) continue;

      const checkIn  = iRow  ? parseTimeStr(iRow[col])  : null;
      const checkOut = oRow  ? parseTimeStr(oRow[col])  : null;
      const otHours  = otRow ? parseOtHours(otRow[col]) : 0;
      const wRaw     = wRow  ? String(wRow[col] || "").trim() : "";
      const wMatch   = wRaw.match(/^(\d+):(\d+)/);
      const workingHrs = wMatch ? parseInt(wMatch[1]) + parseInt(wMatch[2]) / 60 : null;

      let isLate = false;
      let lateMinutes = 0;
      if (checkIn) {
        const [h, m] = checkIn.split(":").map(Number);
        const totalMins = h * 60 + m;
        if (totalMins > 9 * 60 + 10) { isLate = true; lateMinutes = totalMins - 9 * 60; }
      }

      validRows.push({ employeeId: empDbId, date, checkIn, checkOut, status, workingHours: workingHrs, overtimeHours: otHours, isLate, lateMinutes });
    }

    i += 6;
  }

  return { errors, warnings, validRows };
}

export function parseSimpleFormat(
  rows: Record<string, unknown>[],
  empMap: Map<string, string>,
): { errors: Array<{ row: number; field: string; message: string }>; warnings: string[]; validRows: ParsedRow[] } {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const warnings: string[] = [];
  const validRows: ParsedRow[] = [];

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
      isLate: false,
      lateMinutes: 0,
    });
  }

  return { errors, warnings, validRows };
}

export function isBiometricFormat(rows: unknown[][]): boolean {
  // Biometric report has "Attendance Record Report" somewhere in row 0
  const firstRow = (rows[0] as unknown[]).map(c => String(c || "").trim());
  return firstRow.some(c => c.includes("Attendance Record Report"));
}

function extractTimesFromCell(cell: string): { checkIn: string | null; checkOut: string | null } {
  const matches = cell.match(/\d{2}:\d{2}/g);
  if (!matches || matches.length === 0) return { checkIn: null, checkOut: null };
  const unique = [...new Set(matches)];
  if (unique.length === 1) return { checkIn: unique[0], checkOut: null };
  return { checkIn: unique[0], checkOut: unique[unique.length - 1] };
}

export function parseBiometricFormat(
  rows: unknown[][],
  bioMap: Map<string, string>,
  payrollYear: number,
  payrollMonth: number,
): { errors: Array<{ row: number; field: string; message: string }>; warnings: string[]; validRows: ParsedRow[] } {
  const warnings: string[] = [];
  const validRows: ParsedRow[] = [];

  // Row 3 (index 3) has the day numbers across columns
  const dayRow = rows[3] as unknown[];
  // Columns 0..17 = Dec dates, Columns 18..30 = Jan dates (or current month)
  // Build date map: colIndex -> Date
  const dateByCol: (Date | null)[] = [];
  let prevDay = -1;
  let currentMonth = payrollMonth - 1; // start one month before

  for (let col = 0; col < dayRow.length; col++) {
    const day = Number(dayRow[col]);
    if (!day || isNaN(day)) { dateByCol.push(null); continue; }
    if (prevDay > 0 && day < prevDay) currentMonth = payrollMonth;
    const year = currentMonth <= 0 ? payrollYear - 1 : payrollYear;
    const month = currentMonth <= 0 ? 12 : currentMonth;
    dateByCol.push(new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`));
    prevDay = day;
  }

  // Each employee occupies 2 rows: info row (name/ID) + punch row
  for (let i = 4; i < rows.length; i += 2) {
    const infoRow = rows[i] as unknown[];
    const punchRow = rows[i + 1] as unknown[] | undefined;
    if (!punchRow) break;

    // Bio ID is in col 0 of info row
    const bioId = String(infoRow[0] || "").trim();
    if (!bioId || isNaN(Number(bioId))) continue;

    const empDbId = bioMap.get(bioId);
    if (!empDbId) {
      // Find name from info row
      const name = String(infoRow[8] || infoRow[7] || "").trim();
      warnings.push(`Biometric ID ${bioId} (${name}) not mapped to any employee — skipped`);
      continue;
    }

    for (let col = 0; col < dateByCol.length; col++) {
      const date = dateByCol[col];
      if (!date) continue;

      const cellVal = String(punchRow[col] || "").trim();
      if (!cellVal) {
        // Absent
        validRows.push({
          employeeId: empDbId, date,
          checkIn: null, checkOut: null,
          status: "ABSENT", workingHours: null,
          overtimeHours: 0, isLate: false, lateMinutes: 0,
        });
        continue;
      }

      const { checkIn, checkOut } = extractTimesFromCell(cellVal);

      let workingHours: number | null = null;
      if (checkIn && checkOut) {
        const [ih, im] = checkIn.split(":").map(Number);
        const [oh, om] = checkOut.split(":").map(Number);
        workingHours = Math.round(((oh * 60 + om) - (ih * 60 + im)) / 60 * 100) / 100;
      }

      let isLate = false;
      let lateMinutes = 0;
      if (checkIn) {
        const [h, m] = checkIn.split(":").map(Number);
        const totalMins = h * 60 + m;
        if (totalMins > 9 * 60 + 10) { isLate = true; lateMinutes = totalMins - 9 * 60; }
      }

      validRows.push({
        employeeId: empDbId, date,
        checkIn, checkOut,
        status: "PRESENT", workingHours,
        overtimeHours: 0, isLate, lateMinutes,
      });
    }
  }

  return { errors: [], warnings, validRows };
}

export function parseAttendanceBuffer(
  buffer: Buffer,
  empMap: Map<string, string>,
  payrollYear: number,
  payrollMonth: number,
  bioMap?: Map<string, string>,
): { errors: Array<{ row: number; field: string; message: string }>; warnings: string[]; validRows: ParsedRow[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];

  if (isBiometricFormat(rawRows)) {
    return parseBiometricFormat(rawRows, bioMap ?? new Map(), payrollYear, payrollMonth);
  } else if (isDeviceFormat(rawRows)) {
    return parseDeviceFormat(rawRows, empMap, payrollYear, payrollMonth);
  } else {
    const simpleRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    return parseSimpleFormat(simpleRows, empMap);
  }
}
