import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { format } from "date-fns";
import { FileText, Mail, Download } from "lucide-react";

export default async function PayslipsPage() {
  await requireAuth("HR");

  const payslips = await prisma.payslip.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      payrollRunRel: { select: { payrollMonth: true } },
    },
    orderBy: { generatedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Payslips"
        subtitle="All generated payslips"
        icon={<FileText className="w-5 h-5" />}
      />

      <Card>
        <CardHeader title={`${payslips.length} Payslips`} />
        {payslips.length === 0 ? (
          <div className="px-6 py-16 text-center text-stone-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-stone-300" />
            <p>No payslips generated yet</p>
            <p className="text-sm mt-1">Approve a payroll run to generate payslips</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {payslips.map((ps) => (
              <div key={ps.id} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-all">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {ps.employee.firstName} {ps.employee.lastName}
                    <span className="text-xs text-stone-400 ml-2">{ps.employee.employeeCode}</span>
                  </p>
                  <p className="text-xs text-stone-400">
                    {ps.payrollRunRel.payrollMonth} · Net: <span className="font-semibold text-green-600">₹{Number(ps.netSalary).toLocaleString("en-IN")}</span>
                  </p>
                </div>
                <p className="text-xs text-stone-400">{format(ps.generatedAt, "MMM d, yyyy")}</p>
                <Badge variant={ps.emailSent ? "green" : "amber"}>
                  {ps.emailSent ? (
                    <><Mail className="w-3 h-3 inline mr-1" />Sent</>
                  ) : "Not Sent"}
                </Badge>
                <a
                  href={`/api/hr/payslips/${ps.id}/download`}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
