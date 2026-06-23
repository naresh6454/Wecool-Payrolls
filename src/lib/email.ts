import { Resend } from "resend";
import { generatePayslipPDF, PayslipPDFData } from "./pdf";

const resend = new Resend(process.env.RESEND_API_KEY);

export type PayslipEmailData = PayslipPDFData & { to: string; payrollMonth: string; };

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export async function sendPayslipEmail(data: PayslipEmailData): Promise<{ success: boolean; error?: string }> {
  const monthLabel = formatMonthLabel(data.payrollMonth);

  try {
    const pdfBuffer = await generatePayslipPDF(data);

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <tr><td style="background:#0d2b4e;padding:24px 32px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="width:48px;height:48px;background:#fff;border-radius:8px;text-align:center;vertical-align:middle;">
        <span style="font-size:22px;font-weight:900;color:#0d2b4e;line-height:48px;display:block;">W</span>
      </td>
      <td style="padding-left:14px;vertical-align:middle;">
        <div style="color:#fff;font-size:15px;font-weight:700;">WeCool Imports and Trading Pvt. Ltd</div>
        <div style="color:#a8c4e0;font-size:11px;margin-top:2px;">Payroll Department</div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:32px 32px 24px;">
    <p style="margin:0 0 16px;font-size:15px;color:#333;">Dear <strong>${data.employeeName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.6;">
      Please find attached your payslip for <strong>${monthLabel}</strong>.
      Your net pay for this month is <strong style="color:#1b5e20;">₹${data.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>.
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#555;line-height:1.6;">
      The payslip is attached as a PDF. Please keep it for your records. If you have any questions regarding your salary, please contact the HR department.
    </p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#0d2b4e;border-radius:6px;padding:10px 22px;">
          <span style="color:#fff;font-size:13px;font-weight:600;">Employee ID: ${data.employeeCode}</span>
        </td>
        <td style="width:12px;"></td>
        <td style="background:#f0f4f8;border-radius:6px;padding:10px 22px;border:1px solid #dde2e8;">
          <span style="color:#333;font-size:13px;font-weight:600;">Month: ${monthLabel}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #eee;">
    <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
      This is a system generated email. Please do not reply to this email.<br/>
      For queries, contact HR at <strong>080-41233006</strong> or visit our office.
    </p>
  </td></tr>

  <tr><td style="background:#0d2b4e;padding:14px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:11px;color:#a8c4e0;">© ${new Date().getFullYear()} WeCool Imports and Trading Pvt. Ltd</td>
      <td style="text-align:right;font-size:11px;color:#a8c4e0;">HR Department</td>
    </tr></table>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "Wecool Payroll <onboarding@resend.dev>",
      to: data.to,
      subject: `Payslip for ${monthLabel} — ${data.employeeName} (${data.employeeCode})`,
      html,
      attachments: [
        {
          filename: `Payslip_${data.employeeCode}_${data.payrollMonth}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: String(e instanceof Error ? e.message : e) };
  }
}
