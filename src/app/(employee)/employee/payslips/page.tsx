import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { format } from "date-fns";
import { FileText, Download, Mail } from "lucide-react";
import Badge from "@/components/ui/Badge";

export default async function PayslipsPage() {
  const user = await getAuthUser();
  if (!user?.employee) redirect("/login");

  const payslips = await prisma.payslip.findMany({
    where: { employeeId: user.employee.id },
    include: {
      payrollRunRel: {
        select: {
          id: true,
          payrollMonth: true,
          periodStart: true,
          periodEnd: true,
        },
      },
    },
    orderBy: { generatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Payslips"
        subtitle="Download your monthly salary slips"
        icon={<FileText className="w-5 h-5" />}
      />

      {payslips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-stone-300" />
          </div>
          <p className="text-stone-500 font-medium">No payslips yet</p>
          <p className="text-stone-400 text-sm mt-1">Your payslips will appear here after each payroll cycle</p>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader title={`${payslips.length} Payslips`} />
            <div className="divide-y divide-stone-50">
              {payslips.map((ps) => (
                <div key={ps.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-4 hover:bg-stone-50 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-bold text-stone-900">{ps.payrollRunRel.payrollMonth}</p>
                    <p className="text-xs text-stone-400">
                      {format(new Date(ps.payrollRunRel.periodStart), "MMM d")} – {format(new Date(ps.payrollRunRel.periodEnd), "MMM d, yyyy")}
                      <span className="mx-1.5 hidden sm:inline">·</span>
                      <span className="hidden sm:inline">Generated {format(new Date(ps.generatedAt), "MMM d, yyyy")}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-green-600">₹{Number(ps.netSalary).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-stone-400">Net Pay</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ps.emailSent && (
                      <Badge variant="green" size="sm">
                        <Mail className="w-3 h-3 inline mr-0.5" />Emailed
                      </Badge>
                    )}
                    <a
                      href={`/api/employee/payslips/${ps.id}/download`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg hover:bg-stone-200 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </>
      )}
    </div>
  );
}
