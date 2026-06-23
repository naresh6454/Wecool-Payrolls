import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { numberToWords } from "./payroll-engine";

export interface PayslipPDFData {
  employeeName: string;
  employeeCode: string;
  payrollMonth: string;
  dateOfJoining: string;
  department: string;
  designation: string;
  bankAccountNo: string;
  panNumber?: string;
  totalDays: number;
  workingDays?: number;
  weeklyOffs?: number;
  netDaysPresent: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  bonus: number;
  specialAllowance: number;
  overtimeAmount: number;
  overtimeHours?: number;
  grossEarnings: number;
  professionalTax: number;
  tds?: number;
  lateDeduction: number;
  lopDeduction: number;
  lopDays: number;
  totalDeductions: number;
  netSalary: number;
  lateCount: number;
  leaveBalancePrev: number;
  leaveAddition: number;
  leaveTotalTillLastMonth: number;
  leaveAvailed: number;
  leaveBalanceNow: number;
}

const C = {
  navy:    "#1e3560", navyLt:  "#eef1f8", navyMid: "#c8d2e8", orange:  "#f0a500",
  earHd:   "#1a7080", earHdBg: "#dff0f3", earColBg:"#c2dde3", earA:    "#eef7f9", earB:    "#f8fcfd", earLine: "#c0dde3",
  dedHd:   "#8a5a00", dedHdBg: "#fef3d8", dedColBg:"#f0d98a", dedA:    "#fef9ec", dedB:    "#fffdf7", dedLine: "#e8d48a",
  white:   "#ffffff", text:    "#1a1a2e", muted:   "#5a6275", rowA:    "#eef1f8", rowB:    "#f8f9fc",
};

const FONT_REG  = path.join(process.cwd(), "public/fonts/calibri.ttf");
const FONT_BOLD = path.join(process.cwd(), "public/fonts/calibrib.ttf");
const FONT_ITA  = path.join(process.cwd(), "public/fonts/calibrii.ttf");
const LOGO_PNG  = path.join(process.cwd(), "public/wecool-logo.png");
const LOGO_JPG  = path.join(process.cwd(), "public/wecool-logo.jpg");
const LOGO_PATH = fs.existsSync(LOGO_PNG) ? LOGO_PNG : LOGO_JPG;
const SIGN_PATH = path.join(process.cwd(), "public/sign.png");

function r(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill?: string, stroke?: string, lw = 0.7) {
  doc.save();
  if (fill)   doc.rect(x, y, w, h).fill(fill);
  if (stroke) doc.lineWidth(lw).rect(x, y, w, h).stroke(stroke);
  doc.restore();
}
function ln(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, color = "#c8d2e8", lw = 0.4) {
  doc.save().lineWidth(lw).moveTo(x1, y1).lineTo(x2, y2).stroke(color).restore();
}
function inr(n: number) {
  return "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}
// vertical centre helper: offset from row top so text sits centred in row height rh
const mid = (rh: number, fs: number) => Math.round((rh - fs) / 2);

export async function generatePayslipPDF(data: PayslipPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Payslip - ${data.employeeName}`, Author: "WeCool Payroll" } });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end",  () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      doc.registerFont("Reg",  FONT_REG);
      doc.registerFont("Bold", FONT_BOLD);
      doc.registerFont("Ita",  FONT_ITA);
    } catch {
      doc.registerFont("Reg",  "Helvetica");
      doc.registerFont("Bold", "Helvetica-Bold");
      doc.registerFont("Ita",  "Helvetica-Oblique");
    }

    // ── Page geometry ────────────────────────────────────────────────────────
    const PW = 595, M = 30, CW = PW - M * 2, colW = CW / 2;
    const GAP = 4; // tight gap keeps larger fonts within A4
    let y = 0;

    // ── HEADER ───────────────────────────────────────────────────────────────
    const HDR_H = 92;
    r(doc, 0, 0, PW, HDR_H, C.navyLt);
    r(doc, 0, HDR_H - 4, PW, 4, C.orange);

    // Logo — compact size so company text has room
    const LOGO_H = 54, LOGO_W = 108;
    if (fs.existsSync(LOGO_PATH)) {
      try { doc.image(LOGO_PATH, M + 6, (HDR_H - LOGO_H) / 2 - 2, { height: LOGO_H, fit: [LOGO_W, LOGO_H] }); } catch { /* skip */ }
    } else {
      doc.save().circle(M + 27, HDR_H / 2, 27).fill(C.navy).restore();
      doc.font("Bold").fontSize(22).fillColor(C.orange).text("W", M + 15, HDR_H / 2 - 14);
    }
    const txX = M + LOGO_W + 16;
    doc.font("Bold").fontSize(16).fillColor(C.navy)
      .text("WeCool Imports and Trading Pvt. Ltd", txX, 15);
    doc.font("Reg").fontSize(10).fillColor(C.muted)
      .text("#5/BC-106, 5th Cross, HRBR Layout, 3rd Block, Kalyan Nagar,", txX, 37)
      .text("Bangalore - 560043  |  Ph: 080-41233006  |  hr@wecoolimports.com",  txX, 52);

    // PAY SLIP badge
    const bW = 140, bH = 74, bx = PW - M - bW, by = (HDR_H - bH) / 2 - 2;
    r(doc, bx, by, bW, bH, C.navy);
    r(doc, bx, by,        bW, 4, C.orange);
    r(doc, bx, by + bH - 4, bW, 4, C.orange);
    doc.font("Bold").fontSize(15).fillColor(C.orange)
      .text("PAY SLIP", bx, by + 13, { width: bW, align: "center" });
    doc.font("Reg").fontSize(9).fillColor("#9badc8")
      .text("for the month of", bx, by + 33, { width: bW, align: "center" });
    doc.font("Bold").fontSize(12).fillColor(C.white)
      .text(monthLabel(data.payrollMonth).toUpperCase(), bx, by + 48, { width: bW, align: "center" });

    y = HDR_H + GAP;

    // ── EMPLOYEE + PAYROLL INFO ──────────────────────────────────────────────
    const weeklyOffs  = data.weeklyOffs  ?? (data.totalDays - (data.workingDays ?? data.totalDays));
    const workingDays = data.workingDays ?? data.totalDays;

    const empRows: [string, string][] = [
      ["Employee Name",   data.employeeName],
      ["Employee ID",     data.employeeCode],
      ["Designation",     data.designation || "—"],
      ["Department",      data.department  || "—"],
      ["Date of Joining", data.dateOfJoining],
      ["Branch",          "Bangalore"],
      ["Bank A/C No",     data.bankAccountNo ? "XXXX XXXX XXXX " + data.bankAccountNo.slice(-4) : "—"],
    ];
    const payRows: [string, string][] = [
      ["Total Days in Month", String(data.totalDays)],
      ["Working Days",        String(workingDays)],
      ["Weekly Offs",         String(weeklyOffs)],
      ["Days Present",        String(data.netDaysPresent)],
      ["LOP Days",            String(data.lopDays)],
      ["Paid Days",           String(data.netDaysPresent - data.lopDays)],
      ["Late Mark Count",     String(data.lateCount)],
    ];

    const IRH = 21;   // info row height — fits 10.5 pt font
    const HDG = 28;   // section heading bar height
    const infoBoxH = HDG + Math.max(empRows.length, payRows.length) * IRH + 4;

    r(doc, M, y, CW, infoBoxH, C.white, C.navyMid, 0.8);
    r(doc, M, y, CW, HDG, C.navy);
    doc.font("Bold").fontSize(10.5).fillColor(C.white)
      .text("EMPLOYEE DETAILS", M + 12, y + mid(HDG, 10.5))
      .text("PAYROLL DETAILS",  M + colW + 12, y + mid(HDG, 10.5));
    ln(doc, M + colW, y + HDG, M + colW, y + infoBoxH, C.navyMid, 0.8);

    const lbW = 92, colonX = M + lbW + 8, valX = colonX + 11;
    let ry = y + HDG + 1;
    for (let i = 0; i < empRows.length; i++) {
      r(doc, M, ry, colW, IRH, i % 2 === 0 ? C.rowA : C.rowB);
      const ty = ry + mid(IRH, 10.5);
      doc.font("Reg").fontSize(10.5).fillColor(C.muted).text(empRows[i][0], M + 10, ty, { width: lbW });
      doc.font("Reg").fontSize(10.5).fillColor(C.muted).text(":", colonX, ty);
      doc.font("Bold").fontSize(10.5).fillColor(C.text).text(empRows[i][1], valX, ty, { width: colW - valX + M - 4 });
      ry += IRH;
    }
    const plbW = 100, pcolonX = M + colW + plbW + 8, pvalX = pcolonX + 11;
    let py = y + HDG + 1;
    for (let i = 0; i < payRows.length; i++) {
      r(doc, M + colW, py, colW, IRH, i % 2 === 0 ? C.rowA : C.rowB);
      const ty = py + mid(IRH, 10.5);
      doc.font("Reg").fontSize(10.5).fillColor(C.muted).text(payRows[i][0], M + colW + 10, ty, { width: plbW });
      doc.font("Reg").fontSize(10.5).fillColor(C.muted).text(":", pcolonX, ty);
      doc.font("Bold").fontSize(10.5).fillColor(C.text).text(payRows[i][1], pvalX, ty, { width: colW - pvalX + M + colW - 4 });
      py += IRH;
    }
    y += infoBoxH + GAP;

    // ── SALARY DETAILS HEADING ───────────────────────────────────────────────
    r(doc, M, y, CW, HDG, C.navy, C.navyMid, 0.8);
    doc.font("Bold").fontSize(11.5).fillColor(C.white).text("SALARY DETAILS", M + 12, y + mid(HDG, 11.5));
    y += HDG + GAP;

    // ── EARNINGS + DEDUCTIONS ────────────────────────────────────────────────
    const otLabel = data.overtimeHours ? `Overtime (${data.overtimeHours} hrs)` : "Overtime";
    const earningsRows: [string, number, number][] = [
      ["Basic Salary",        data.basicSalary,      data.basicSalary],
      ["House Rent Allowance",data.hra,              data.hra],
      ["Fixed Conveyance",    data.conveyance,       data.conveyance],
      ["Happiness Bonus",     data.bonus,            data.bonus],
      ["Special Allowance",   data.specialAllowance, data.specialAllowance],
      [otLabel,               data.overtimeAmount,   data.overtimeAmount],
    ];
    const deductionRows: [string, number][] = [
      ["Professional Tax (PT)", data.professionalTax],
      ["Loss of Pay (LOP)",     data.lopDeduction],
      ["Late Mark Deduction",   data.lateDeduction],
    ];

    const ERH     = 21;   // earnings row height — fits 10.5 pt
    const CHH     = 32;   // column-header sub-row height (tall enough for 2-line headers)
    const SECTHDG = 30;   // EARNINGS / DEDUCTIONS title bar
    const TOTBAR  = 28;   // GROSS / TOTAL footer bar

    const earTblH = SECTHDG + CHH + earningsRows.length * ERH + TOTBAR;
    const dedTblH = SECTHDG + CHH + deductionRows.length * ERH + TOTBAR;
    const tblH    = Math.max(earTblH, dedTblH);

    // ── Earnings box ─────────────────────────────────────────────────────────
    const earBoxW = colW - 4;
    // column widths inside earnings box
    const eLblW   = 104;
    const eDiv1X  = M + 10 + eLblW + 6;
    const eActX   = eDiv1X + 7;
    const eActW   = 66;
    const eDiv2X  = eActX + eActW + 6;
    const ePaidX  = eDiv2X + 7;
    const ePaidW  = M + earBoxW - ePaidX - 4;

    r(doc, M, y, earBoxW, tblH, C.white, C.navyMid, 0.8);
    r(doc, M, y, earBoxW, SECTHDG, C.earHdBg);
    doc.font("Bold").fontSize(13).fillColor(C.earHd)
      .text("EARNINGS", M + 10, y + mid(SECTHDG, 13));

    r(doc, M, y + SECTHDG, earBoxW, CHH, C.earColBg);
    // Two-line column headers centred vertically in CHH
    const chTopY = y + SECTHDG + 4;
    doc.font("Bold").fontSize(10.5).fillColor(C.navy)
      .text("Particulars",  M + 10, chTopY + 5, { width: eLblW })
      .text("Actual",       eActX,  chTopY,     { width: eActW,  align: "right" })
      .text("Earnings",     eActX,  chTopY + 13, { width: eActW,  align: "right" })
      .text("Amount",       ePaidX, chTopY,     { width: ePaidW, align: "right" })
      .text("Paid",         ePaidX, chTopY + 13, { width: ePaidW, align: "right" });
    ln(doc, eDiv1X, y + SECTHDG, eDiv1X, y + SECTHDG + CHH, C.earLine, 0.5);
    ln(doc, eDiv2X, y + SECTHDG, eDiv2X, y + SECTHDG + CHH, C.earLine, 0.5);

    let ey = y + SECTHDG + CHH;
    for (let i = 0; i < earningsRows.length; i++) {
      r(doc, M, ey, earBoxW, ERH, i % 2 === 0 ? C.earA : C.earB);
      const ty = ey + mid(ERH, 10.5);
      doc.font("Reg").fontSize(10.5).fillColor(C.text)
        .text(earningsRows[i][0], M + 10, ty, { width: eLblW })
        .text(inr(earningsRows[i][1]), eActX,  ty, { width: eActW,  align: "right" })
        .text(inr(earningsRows[i][2]), ePaidX, ty, { width: ePaidW, align: "right" });
      ln(doc, eDiv1X, ey, eDiv1X, ey + ERH, C.earLine, 0.4);
      ln(doc, eDiv2X, ey, eDiv2X, ey + ERH, C.earLine, 0.4);
      ey += ERH;
      ln(doc, M, ey, M + earBoxW, ey, C.earLine, 0.4);
    }
    // pad if deductions taller
    const earPad = tblH - earTblH;
    if (earPad > 0) { r(doc, M, ey, earBoxW, earPad, C.earB); ey += earPad; }
    r(doc, M, ey, earBoxW, TOTBAR, C.earHdBg);
    ln(doc, M, ey, M + earBoxW, ey, C.earLine, 0.8);
    const etY = ey + mid(TOTBAR, 11);
    doc.font("Bold").fontSize(11).fillColor(C.earHd)
      .text("GROSS EARNINGS", M + 10, etY)
      .text(inr(data.grossEarnings), eActX,  etY, { width: eActW,  align: "right" })
      .text(inr(data.grossEarnings), ePaidX, etY, { width: ePaidW, align: "right" });

    // ── Deductions box ───────────────────────────────────────────────────────
    const dx      = M + colW + 4;
    const dedColW = colW - 4;
    const dAmtW   = 72;
    const dAmtX   = dx + dedColW - dAmtW - 8;
    const dLblW   = dedColW - 18 - dAmtW - 8;

    r(doc, dx, y, dedColW, tblH, C.white, C.navyMid, 0.8);
    r(doc, dx, y, dedColW, SECTHDG, C.dedHdBg);
    doc.font("Bold").fontSize(13).fillColor(C.dedHd)
      .text("DEDUCTIONS", dx + 10, y + mid(SECTHDG, 13));

    r(doc, dx, y + SECTHDG, dedColW, CHH, C.dedColBg);
    doc.font("Bold").fontSize(10.5).fillColor(C.navy)
      .text("Particulars", dx + 10, chTopY + 5, { width: dLblW })
      .text("Amount",      dAmtX,   chTopY + 5, { width: dAmtW, align: "right" });

    let ddy = y + SECTHDG + CHH;
    for (let i = 0; i < deductionRows.length; i++) {
      r(doc, dx, ddy, dedColW, ERH, i % 2 === 0 ? C.dedA : C.dedB);
      const ty = ddy + mid(ERH, 10.5);
      doc.font("Reg").fontSize(10.5).fillColor(C.text)
        .text(deductionRows[i][0], dx + 10, ty, { width: dLblW })
        .text(inr(deductionRows[i][1]), dAmtX, ty, { width: dAmtW, align: "right" });
      ddy += ERH;
      ln(doc, dx, ddy, dx + dedColW, ddy, C.dedLine, 0.4);
    }
    const dedPad = tblH - dedTblH;
    if (dedPad > 0) { r(doc, dx, ddy, dedColW, dedPad, C.dedB); ddy += dedPad; }
    r(doc, dx, ddy, dedColW, TOTBAR, C.dedHdBg);
    ln(doc, dx, ddy, dx + dedColW, ddy, C.dedLine, 0.8);
    const dtY = ddy + mid(TOTBAR, 11);
    doc.font("Bold").fontSize(11).fillColor(C.dedHd)
      .text("TOTAL DEDUCTIONS", dx + 10, dtY)
      .text(inr(data.totalDeductions), dAmtX, dtY, { width: dAmtW, align: "right" });

    y += tblH + GAP;

    // ── NET PAY ──────────────────────────────────────────────────────────────
    const netH = 60;
    r(doc, M, y, CW, netH, C.navy, C.navyMid, 0.8);
    doc.font("Reg").fontSize(10).fillColor("#9badc8")
      .text("NET PAY FOR THE MONTH", M + 12, y + 9);
    doc.font("Bold").fontSize(24).fillColor(C.orange)
      .text(inr(data.netSalary), M + 12, y + 23);
    ln(doc, M + CW / 2 + 10, y + 8, M + CW / 2 + 10, y + netH - 8, "#2e4a78", 1);
    doc.font("Reg").fontSize(10).fillColor("#9badc8")
      .text("Amount in Words", M + CW / 2 + 20, y + 9);
    doc.font("Bold").fontSize(10.5).fillColor(C.white)
      .text(numberToWords(data.netSalary), M + CW / 2 + 20, y + 24, { width: CW / 2 - 28, lineGap: 2 });
    y += netH + GAP;

    // ── LEAVE SUMMARY ────────────────────────────────────────────────────────
    r(doc, M, y, CW, HDG, C.navy, C.navyMid, 0.8);
    doc.font("Bold").fontSize(11.5).fillColor(C.white)
      .text("LEAVE SUMMARY", M + 12, y + mid(HDG, 11.5));
    y += HDG;

    const leaveH = 60;
    r(doc, M, y, CW, leaveH, C.white, C.navyMid, 0.8);
    const leaveCols: [string, string][] = [
      ["Leave Balance\n(Last Month)",    data.leaveBalancePrev.toFixed(2)],
      ["Leave Addition\n(This Month)",   data.leaveAddition.toFixed(2)],
      ["Total Leave\n(Till Last Month)", data.leaveTotalTillLastMonth.toFixed(2)],
      ["Leave Availed\n(This Month)",    String(data.leaveAvailed)],
      ["Leave Balance\n(As of Now)",     data.leaveBalanceNow.toFixed(2)],
    ];
    const lcw = CW / leaveCols.length;
    leaveCols.forEach(([label, value], i) => {
      const lx = M + i * lcw;
      if (i > 0) ln(doc, lx, y + 4, lx, y + leaveH - 4, C.navyMid);
      r(doc, lx, y, lcw, leaveH, i % 2 === 0 ? C.navyLt : C.white);
      doc.font("Reg").fontSize(9).fillColor(C.muted)
        .text(label, lx + 4, y + 6, { width: lcw - 8, align: "center" });
      doc.font("Bold").fontSize(17).fillColor(C.navy)
        .text(value, lx + 4, y + 32, { width: lcw - 8, align: "center" });
    });
    y += leaveH + GAP;

    // ── DECLARATION + SIGNATURE ──────────────────────────────────────────────
    const declText =
      "This payslip is a confidential document issued by WeCool Imports and Trading Pvt. Ltd. " +
      "It is system generated. The salary details are as per company records for the specified " +
      "payroll month. For any discrepancies, please contact the HR department within 7 working days of receipt.";
    const declH = 110;
    r(doc, M, y, CW, declH, C.navyLt, C.navyMid, 0.7);
    doc.font("Bold").fontSize(10.5).fillColor(C.navy).text("DECLARATION", M + 12, y + 10);
    doc.font("Ita").fontSize(9.5).fillColor(C.muted)
      .text(declText, M + 12, y + 27, { width: CW - 28, lineGap: 2 });

    // Signature anchored to bottom of declaration box
    const sigLineY = y + declH - 18;
    const sigX = M + CW - 155, sigW = 140;
    if (fs.existsSync(SIGN_PATH)) {
      try { doc.image(SIGN_PATH, sigX + 20, sigLineY - 30, { width: 100, height: 26 }); } catch { /* skip */ }
    }
    ln(doc, sigX, sigLineY, sigX + sigW, sigLineY, C.navyMid, 0.8);
    doc.font("Reg").fontSize(9.5).fillColor(C.muted)
      .text("HR / Authorized Signatory", sigX, sigLineY + 4, { width: sigW, align: "center" });

    y += declH + GAP;

    // ── FOOTER ───────────────────────────────────────────────────────────────
    r(doc, 0, y, PW, 36, C.navy);
    r(doc, 0, y, PW, 3,  C.orange);
    doc.font("Bold").fontSize(10).fillColor(C.white)
      .text("WeCool Imports and Trading Pvt. Ltd  |  Bangalore - 560043", 0, y + 7, { width: PW, align: "center" });
    doc.font("Reg").fontSize(9).fillColor("#9badc8")
      .text("HR Department  |  hr@wecoolimports.com  |  080-41233006", 0, y + 20, { width: PW, align: "center" });

    doc.end();
  });
}
