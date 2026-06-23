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

// Theme matching the ECOMFLEX reference: dark navy + gold
const C = {
  navy:    "#1a2744",
  navyLt:  "#f4f6fb",
  navyMid: "#c0c8dc",
  gold:    "#c8960a",
  goldLt:  "#f9f3e0",
  white:   "#ffffff",
  text:    "#1a1a2e",
  muted:   "#5a6275",
  rowA:    "#f4f6fb",
  rowB:    "#ffffff",
  earHd:   "#1a2744",
  earHdBg: "#e8edf7",
  earColBg:"#d0d8ec",
  earA:    "#f4f6fb",
  earB:    "#ffffff",
  earLine: "#c0c8dc",
  dedHd:   "#1a2744",
  dedHdBg: "#e8edf7",
  dedColBg:"#d0d8ec",
  dedA:    "#f4f6fb",
  dedB:    "#ffffff",
  dedLine: "#c0c8dc",
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
function ln(doc: PDFKit.PDFDocument, x1: number, y1: number, x2: number, y2: number, color = "#c0c8dc", lw = 0.4) {
  doc.save().lineWidth(lw).moveTo(x1, y1).lineTo(x2, y2).stroke(color).restore();
}
function inr(n: number) {
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}
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

    const PW = 595, M = 30, CW = PW - M * 2, colW = CW / 2;
    const GAP = 4;
    let y = 0;

    // ── HEADER: full dark navy background ────────────────────────────────────
    const HDR_H = 100;
    r(doc, 0, 0, PW, HDR_H, C.navy);

    // Logo left-aligned in header
    const LOGO_H = 52, LOGO_W = 52;
    if (fs.existsSync(LOGO_PATH)) {
      try { doc.image(LOGO_PATH, M, (HDR_H - LOGO_H) / 2, { height: LOGO_H, fit: [LOGO_W, LOGO_H] }); } catch { /* skip */ }
    }

    // Company name centred in header
    const txX = M + LOGO_W + 12;
    const txW = PW - txX - M;
    doc.font("Bold").fontSize(17).fillColor(C.white)
      .text("WeCool Imports and Trading Pvt. Ltd", txX, 16, { width: txW, align: "center" });
    doc.font("Reg").fontSize(9).fillColor("#9badc8")
      .text("#5/BC-106, 5th Cross, HRBR Layout, 3rd Block, Kalyan Nagar, Bangalore - 560043", txX, 40, { width: txW, align: "center" })
      .text("Ph: 080-41233006  |  hr@wecoolimports.com", txX, 54, { width: txW, align: "center" });

    // Gold separator line
    r(doc, 0, HDR_H - 5, PW, 5, C.gold);
    y = HDR_H + GAP;

    // ── SALARY SLIP TITLE BAR ────────────────────────────────────────────────
    const titleH = 28;
    r(doc, M, y, CW, titleH, C.navy);
    doc.font("Bold").fontSize(13).fillColor(C.gold)
      .text(`SALARY SLIP — ${monthLabel(data.payrollMonth)}`, M, y + mid(titleH, 13), { width: CW, align: "center" });
    y += titleH + GAP;

    // ── EMPLOYEE DETAILS ─────────────────────────────────────────────────────
    const weeklyOffs  = data.weeklyOffs  ?? (data.totalDays - (data.workingDays ?? data.totalDays));
    const workingDays = data.workingDays ?? data.totalDays;

    const IRH = 20;
    const HDG = 26;

    // Left column — employee info
    const empRows: [string, string][] = [
      ["Employee Code",   data.employeeCode],
      ["Employee Name",   data.employeeName],
      ["Department",      data.department  || "—"],
      ["Designation",     data.designation || "—"],
      ["Date of Joining", data.dateOfJoining],
      ["Bank / A/C",      data.bankAccountNo ? "XXXXXXXX" + data.bankAccountNo.slice(-4) : "—"],
    ];
    // Right column — payroll info
    const payRows: [string, string][] = [
      ["Working Days",    String(workingDays)],
      ["Paid Days",       String(data.netDaysPresent - data.lopDays)],
      ["LOP Days",        String(data.lopDays)],
      ["Leave",           String(data.leaveAvailed)],
      ["Weekly Offs",     String(weeklyOffs)],
      ["Late Mark Count", String(data.lateCount)],
    ];

    const infoBoxH = HDG + Math.max(empRows.length, payRows.length) * IRH + 4;
    r(doc, M, y, CW, infoBoxH, C.white, C.navyMid, 0.8);

    // Section heading row
    r(doc, M, y, CW, HDG, C.navy);
    doc.font("Bold").fontSize(10).fillColor(C.gold)
      .text("EMPLOYEE DETAILS", M + 10, y + mid(HDG, 10))
      .text("PAYROLL DETAILS",  M + colW + 10, y + mid(HDG, 10));
    ln(doc, M + colW, y + HDG, M + colW, y + infoBoxH, C.navyMid, 0.8);

    const lbW = 90, colonX = M + lbW + 6, valX = colonX + 10;
    let ry = y + HDG + 1;
    for (let i = 0; i < empRows.length; i++) {
      r(doc, M, ry, colW, IRH, i % 2 === 0 ? C.rowA : C.rowB);
      const ty = ry + mid(IRH, 10);
      doc.font("Reg").fontSize(10).fillColor(C.muted).text(empRows[i][0], M + 8, ty, { width: lbW });
      doc.font("Reg").fontSize(10).fillColor(C.muted).text(":", colonX, ty);
      doc.font("Bold").fontSize(10).fillColor(C.text).text(empRows[i][1], valX, ty, { width: colW - valX + M - 4 });
      ry += IRH;
    }
    const plbW = 90, pcolonX = M + colW + plbW + 6, pvalX = pcolonX + 10;
    let py = y + HDG + 1;
    for (let i = 0; i < payRows.length; i++) {
      r(doc, M + colW, py, colW, IRH, i % 2 === 0 ? C.rowA : C.rowB);
      const ty = py + mid(IRH, 10);
      doc.font("Reg").fontSize(10).fillColor(C.muted).text(payRows[i][0], M + colW + 8, ty, { width: plbW });
      doc.font("Reg").fontSize(10).fillColor(C.muted).text(":", pcolonX, ty);
      doc.font("Bold").fontSize(10).fillColor(C.text).text(payRows[i][1], pvalX, ty, { width: colW - pvalX + M + colW - 4 });
      py += IRH;
    }
    y += infoBoxH + GAP;

    // ── EARNINGS + DEDUCTIONS ────────────────────────────────────────────────
    const otLabel = data.overtimeHours ? `Overtime (${data.overtimeHours} hrs)` : "Overtime";
    const earningsRows: [string, number][] = [
      ["Basic",              data.basicSalary],
      ["HRA",                data.hra],
      ["Special Allowance",  data.specialAllowance],
      ["Conveyance",         data.conveyance],
      ["Medical",            0],
      ["Other Allowance",    data.bonus],
      [otLabel,              data.overtimeAmount],
      ["Bonus",              0],
      ["Incentive",          0],
    ];
    const deductionRows: [string, number][] = [
      ["Provident Fund (PF)", Math.round(data.basicSalary * 0.06)],
      ["ESI",                 0],
      ["Professional Tax",    data.professionalTax],
      ["TDS",                 data.tds ?? 0],
      ["Advance",             0],
      ["Loan",                0],
      ["Other Deductions",    data.lopDeduction + data.lateDeduction],
    ];

    const ERH     = 20;
    const CHH     = 26;
    const SECTHDG = 26;
    const TOTBAR  = 26;

    const earTblH = SECTHDG + CHH + earningsRows.length * ERH + TOTBAR;
    const dedTblH = SECTHDG + CHH + deductionRows.length * ERH + TOTBAR;
    const tblH    = Math.max(earTblH, dedTblH);

    // Earnings box
    const earBoxW = colW - 4;
    const eLblW   = 110;
    const eAmtX   = M + earBoxW - 72;
    const eAmtW   = 68;

    r(doc, M, y, earBoxW, tblH, C.white, C.navyMid, 0.8);
    r(doc, M, y, earBoxW, SECTHDG, C.navy);
    doc.font("Bold").fontSize(11).fillColor(C.gold)
      .text("EARNINGS", M + 10, y + mid(SECTHDG, 11));
    doc.font("Bold").fontSize(10).fillColor(C.gold)
      .text("Amount", eAmtX, y + mid(SECTHDG, 10), { width: eAmtW, align: "right" });

    r(doc, M, y + SECTHDG, earBoxW, CHH, C.earColBg);
    doc.font("Bold").fontSize(10).fillColor(C.navy)
      .text("Particulars", M + 10, y + SECTHDG + mid(CHH, 10), { width: eLblW })
      .text("Amount", eAmtX, y + SECTHDG + mid(CHH, 10), { width: eAmtW, align: "right" });

    let ey = y + SECTHDG + CHH;
    for (let i = 0; i < earningsRows.length; i++) {
      r(doc, M, ey, earBoxW, ERH, i % 2 === 0 ? C.earA : C.earB);
      const ty = ey + mid(ERH, 10);
      doc.font("Reg").fontSize(10).fillColor(C.text)
        .text(earningsRows[i][0], M + 10, ty, { width: eLblW })
        .text(inr(earningsRows[i][1]), eAmtX, ty, { width: eAmtW, align: "right" });
      ln(doc, M, ey + ERH, M + earBoxW, ey + ERH, C.earLine, 0.4);
      ey += ERH;
    }
    const earPad = tblH - earTblH;
    if (earPad > 0) { r(doc, M, ey, earBoxW, earPad, C.earB); ey += earPad; }
    r(doc, M, ey, earBoxW, TOTBAR, C.earColBg);
    ln(doc, M, ey, M + earBoxW, ey, C.navyMid, 0.8);
    doc.font("Bold").fontSize(10.5).fillColor(C.navy)
      .text("Gross Earnings", M + 10, ey + mid(TOTBAR, 10.5))
      .text(inr(data.grossEarnings), eAmtX, ey + mid(TOTBAR, 10.5), { width: eAmtW, align: "right" });

    // Deductions box
    const dx      = M + colW + 4;
    const dedColW = colW - 4;
    const dAmtW   = 72;
    const dAmtX   = dx + dedColW - dAmtW - 8;
    const dLblW   = dedColW - 18 - dAmtW - 8;

    r(doc, dx, y, dedColW, tblH, C.white, C.navyMid, 0.8);
    r(doc, dx, y, dedColW, SECTHDG, C.navy);
    doc.font("Bold").fontSize(11).fillColor(C.gold)
      .text("DEDUCTIONS", dx + 10, y + mid(SECTHDG, 11));
    doc.font("Bold").fontSize(10).fillColor(C.gold)
      .text("Amount", dAmtX, y + mid(SECTHDG, 10), { width: dAmtW, align: "right" });

    r(doc, dx, y + SECTHDG, dedColW, CHH, C.dedColBg);
    doc.font("Bold").fontSize(10).fillColor(C.navy)
      .text("Particulars", dx + 10, y + SECTHDG + mid(CHH, 10), { width: dLblW })
      .text("Amount", dAmtX, y + SECTHDG + mid(CHH, 10), { width: dAmtW, align: "right" });

    let ddy = y + SECTHDG + CHH;
    for (let i = 0; i < deductionRows.length; i++) {
      r(doc, dx, ddy, dedColW, ERH, i % 2 === 0 ? C.dedA : C.dedB);
      const ty = ddy + mid(ERH, 10);
      doc.font("Reg").fontSize(10).fillColor(C.text)
        .text(deductionRows[i][0], dx + 10, ty, { width: dLblW })
        .text(inr(deductionRows[i][1]), dAmtX, ty, { width: dAmtW, align: "right" });
      ln(doc, dx, ddy + ERH, dx + dedColW, ddy + ERH, C.dedLine, 0.4);
      ddy += ERH;
    }
    const dedPad = tblH - dedTblH;
    if (dedPad > 0) { r(doc, dx, ddy, dedColW, dedPad, C.dedB); ddy += dedPad; }
    r(doc, dx, ddy, dedColW, TOTBAR, C.dedColBg);
    ln(doc, dx, ddy, dx + dedColW, ddy, C.navyMid, 0.8);
    doc.font("Bold").fontSize(10.5).fillColor(C.navy)
      .text("Total Deductions", dx + 10, ddy + mid(TOTBAR, 10.5))
      .text(inr(data.totalDeductions), dAmtX, ddy + mid(TOTBAR, 10.5), { width: dAmtW, align: "right" });

    y += tblH + GAP;

    // ── NET PAY ──────────────────────────────────────────────────────────────
    const netH = 36;
    r(doc, M, y, CW, netH, C.navy, C.navyMid, 0.8);
    doc.font("Bold").fontSize(13).fillColor(C.white)
      .text("NET PAY", M + 12, y + mid(netH, 13));
    doc.font("Bold").fontSize(13).fillColor(C.gold)
      .text(inr(data.netSalary), M + 12, y + mid(netH, 13), { width: CW - 24, align: "right" });
    y += netH + GAP;

    // Amount in words
    const wordsH = 24;
    r(doc, M, y, CW, wordsH, C.navyLt, C.navyMid, 0.7);
    doc.font("Ita").fontSize(10).fillColor(C.muted)
      .text(`Amount in words: ${numberToWords(data.netSalary)}`, M + 12, y + mid(wordsH, 10), { width: CW - 24 });
    y += wordsH + GAP;

    // ── EMPLOYER CONTRIBUTIONS ───────────────────────────────────────────────
    const ctcH = 30;
    r(doc, M, y, CW, ctcH, C.white, C.navyMid, 0.8);
    const pfEmployer = Math.round(data.basicSalary * 0.06);
    const ctcCols: [string, string][] = [
      ["Employer PF",  inr(pfEmployer)],
      ["Employer ESI", inr(0)],
      ["Monthly CTC",  inr(data.grossEarnings + pfEmployer)],
    ];
    const cw = CW / 3;
    ctcCols.forEach(([label, val], i) => {
      const cx = M + i * cw;
      if (i > 0) ln(doc, cx, y + 4, cx, y + ctcH - 4, C.navyMid);
      doc.font("Reg").fontSize(9).fillColor(C.muted).text(label, cx + 4, y + 6, { width: cw - 8, align: "center" });
      doc.font("Bold").fontSize(10).fillColor(C.navy).text(val, cx + 4, y + 17, { width: cw - 8, align: "center" });
    });
    y += ctcH + GAP;

    // ── SIGNATURE ────────────────────────────────────────────────────────────
    const sigH = 60;
    r(doc, M, y, CW, sigH, C.white, C.navyMid, 0.7);

    // Employee signature left
    ln(doc, M + 10, y + sigH - 18, M + 130, y + sigH - 18, C.navyMid, 0.8);
    doc.font("Reg").fontSize(9).fillColor(C.muted)
      .text("Employee Signature", M + 10, y + sigH - 12, { width: 120, align: "center" });

    // Authorized signatory right
    const sigX = M + CW - 145;
    if (fs.existsSync(SIGN_PATH)) {
      try { doc.image(SIGN_PATH, sigX + 10, y + sigH - 42, { width: 100, height: 22 }); } catch { /* skip */ }
    }
    ln(doc, sigX, y + sigH - 18, sigX + 140, y + sigH - 18, C.navyMid, 0.8);
    doc.font("Reg").fontSize(9).fillColor(C.muted)
      .text("for WeCool Imports and Trading Pvt. Ltd", sigX, y + sigH - 14, { width: 140, align: "center" });
    doc.font("Bold").fontSize(9).fillColor(C.muted)
      .text("Authorised Signatory", sigX, y + sigH - 4, { width: 140, align: "center" });
    y += sigH + GAP;

    // ── FOOTER ───────────────────────────────────────────────────────────────
    r(doc, 0, y, PW, 5, C.gold);
    r(doc, 0, y + 5, PW, 28, C.navy);
    doc.font("Ita").fontSize(9).fillColor("#9badc8")
      .text("This is a computer-generated salary slip and does not require a physical signature.", 0, y + 12, { width: PW, align: "center" });

    doc.end();
  });
}
