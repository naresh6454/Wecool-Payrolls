interface AttendanceRecord {
  status: string;
  isLate: boolean;
  overtimeHours: number | { toString(): string } | null;
  checkIn: string | null;
  calendarDayType?: string | null; // WORKING_DAY | WEEKLY_OFF | COMPANY_HOLIDAY — overrides Excel status
}

export interface CalendarDay {
  status: "WORKING_DAY" | "WEEKLY_OFF" | "COMPANY_HOLIDAY";
  holidayName?: string | null;
}

export interface PayrollSettings {
  basicPercent: number;       // 50
  hraPercentOfBasic: number;  // 40
  fixedConveyance: number;    // 1600
  fixedBonus: number;         // 2000
  professionalTax: number;    // 200
  lateFreeCount: number;      // 3
  latePerHalfDay: number;     // 2 (every 2 lates = 1 half-day deduction)
  otWarehouseRate: number;    // 1000
  minOtHoursForExtraPay: number; // 6
}

export interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  halfDays: number;
  weeklyOffDays: number;
  holidayDays: number;
  weekOffWorkedDays: number;  // worked on weekly-off → extra pay days (Office)
  holidayWorkedDays: number; // worked on holiday → extra pay days (Office)
  lateCount: number;
  paidLeaveDays: number;
  lopDays: number;
  overtimeDays: number;       // extra pay days (week-off worked + high-OT on working day)
  totalCalendarDays: number;
}

export interface SalaryBreakdown {
  monthlySalary: number;
  perDaySalary: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  bonus: number;
  specialAllowance: number;
  overtimeAmount: number;
  grossEarnings: number;
  professionalTax: number;
  lopDeduction: number;
  lateDeduction: number;
  lateDeductionDays: number;
  totalDeductions: number;
  netSalary: number;
}

export function calculateLateDeductionDays(lateCount: number, settings: PayrollSettings): number {
  // First `lateFreeCount` lates are free (default 5)
  // Every 2 lates beyond that = 0.5 day deduction (ceiling — even 1 excess counts as a pair)
  // e.g. 6th or 7th late = 0.5 day, 8th or 9th = 1 day, 10th or 11th = 1.5 days
  if (lateCount <= settings.lateFreeCount) return 0;
  const excessLates = lateCount - settings.lateFreeCount;
  return Math.ceil(excessLates / 2) * 0.5;
}

export function calculateSalary(
  monthlySalary: number,
  summary: AttendanceSummary,
  employeeType: "OFFICE" | "WAREHOUSE",
  settings: PayrollSettings
): SalaryBreakdown {
  const calendarDays = summary.totalCalendarDays;
  const perDaySalary = monthlySalary / calendarDays;

  // Salary components (on full monthly salary)
  const basicSalary = monthlySalary * (settings.basicPercent / 100);
  const hra = basicSalary * (settings.hraPercentOfBasic / 100);
  const conveyance = settings.fixedConveyance;
  const bonus = settings.fixedBonus;
  const specialAllowance = monthlySalary - basicSalary - hra - conveyance - bonus;

  // Extra pay days = week-off worked days + high-OT working days
  // Each extra day is paid at 1 day's salary (OFFICE) or fixed warehouse rate
  let overtimeAmount = 0;
  if (employeeType === "OFFICE") {
    overtimeAmount = summary.overtimeDays * perDaySalary;
  } else {
    overtimeAmount = summary.overtimeDays * settings.otWarehouseRate;
  }

  const grossEarnings = monthlySalary + overtimeAmount;

  // Deductions
  const lopDeduction = summary.lopDays * perDaySalary;
  const lateDeductionDays = calculateLateDeductionDays(summary.lateCount, settings);
  const lateDeduction = lateDeductionDays * perDaySalary;
  const professionalTax = settings.professionalTax;

  const totalDeductions = lopDeduction + lateDeduction + professionalTax;
  const netSalary = grossEarnings - totalDeductions;

  return {
    monthlySalary,
    perDaySalary,
    basicSalary,
    hra,
    conveyance,
    bonus,
    specialAllowance: Math.max(0, specialAllowance),
    overtimeAmount,
    grossEarnings,
    professionalTax,
    lopDeduction,
    lateDeduction,
    lateDeductionDays,
    totalDeductions,
    netSalary: Math.max(0, netSalary),
  };
}

export function buildAttendanceSummary(
  records: AttendanceRecord[],
  calendarDays: number,
  paidLeaveDays: number,
  employeeType: "OFFICE" | "WAREHOUSE" = "OFFICE",
  minOtHours = 6
): AttendanceSummary {
  let presentDays = 0;
  let halfDays = 0;
  let lateCount = 0;
  let weeklyOffDays = 0;
  let holidayDays = 0;
  let absentDays = 0;
  let weekOffWorkedDays = 0;
  let holidayWorkedDays = 0;
  let highOtDays = 0;

  for (const r of records) {
    const calType = r.calendarDayType; // calendar is source of truth when present
    const excelStatus = r.status;

    // Calendar strictly overrides Excel for day type classification.
    // If calendar says WORKING_DAY, treat as working day regardless of Excel (W/O, absent, etc.)
    // Only fall back to Excel status when no calendar entry exists (calType is null).
    const isWeeklyOff = calType === "WEEKLY_OFF" || (!calType && excelStatus === "WEEKLY_OFF");
    const isHoliday   = calType === "COMPANY_HOLIDAY" || (!calType && excelStatus === "HOLIDAY");
    const isWorkingDay = calType === "WORKING_DAY" || (!calType && !isWeeklyOff && !isHoliday);

    if (isWeeklyOff) {
      weeklyOffDays += 1;
      if (r.checkIn) weekOffWorkedDays += 1;
    } else if (isHoliday) {
      holidayDays += 1;
      if (r.checkIn) holidayWorkedDays += 1;
    } else if (isWorkingDay) {
      // On a working day, Excel's LEAVE/HALF_DAY/PRESENT/ABSENT is still respected
      // but W/O from Excel is ignored — calendar already said it's a working day
      if (excelStatus === "LEAVE") {
        // handled via paidLeaveDays; skip counting here
      } else if (excelStatus === "HALF_DAY") {
        halfDays += 1;
        presentDays += 0.5;
      } else if (r.checkIn || excelStatus === "PRESENT") {
        presentDays += 1;
      } else {
        // ABSENT, or Excel showed W/O but calendar says working day → treat as absent (LOP)
        absentDays += 1;
      }
    }

    if (r.isLate) lateCount += 1;
  }

  // Office OT: any check-in on WO or Holiday day = 1 full OT day (hours don't matter)
  // Warehouse OT: always 0 — entered manually by HR during review
  const overtimeDays = employeeType === "OFFICE"
    ? weekOffWorkedDays + holidayWorkedDays
    : 0;

  // Paid days = present (includes 0.5 per half-day) + approved paid leaves + week-offs + holidays
  // Week-offs and holidays are paid — they do NOT cause LOP
  const paidDays = presentDays + paidLeaveDays + weeklyOffDays + holidayDays;
  const lopDays = Math.max(0, calendarDays - paidDays);

  return {
    presentDays,
    absentDays,
    halfDays,
    weeklyOffDays,
    holidayDays,
    weekOffWorkedDays,
    holidayWorkedDays,
    lateCount,
    paidLeaveDays,
    lopDays,
    overtimeDays,
    totalCalendarDays: calendarDays,
  };
}

export function numberToWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
    if (n < 100000) return convert(Math.floor(n / 1000)) + "Thousand " + convert(n % 1000);
    if (n < 10000000) return convert(Math.floor(n / 100000)) + "Lakh " + convert(n % 100000);
    return convert(Math.floor(n / 10000000)) + "Crore " + convert(n % 10000000);
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let result = convert(rupees).trim() + " Rupees";
  if (paise > 0) result += " and " + convert(paise).trim() + " Paise";
  return result + " Only";
}
