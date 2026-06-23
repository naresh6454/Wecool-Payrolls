import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Badge from "@/components/ui/Badge";
import AttendanceUploadForm from "./AttendanceUploadForm";

export default async function AttendanceUploadPage() {
  const uploads = await prisma.attendanceUpload.findMany({
    include: { uploadedBy: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div>
      <PageHeader
        title="Attendance Upload"
        subtitle="Upload the monthly attendance Excel to begin payroll processing"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceUploadForm />
        <Card>
          <CardHeader title="Upload History" />
          <div className="divide-y divide-stone-50">
            {uploads.length === 0 ? (
              <div className="px-6 py-10 text-center text-stone-400 text-sm">No uploads yet</div>
            ) : uploads.map((u) => (
              <div key={u.id} className="px-6 py-4 hover:bg-stone-50 transition-all">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{u.payrollMonth}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[200px]">{u.fileName}</p>
                  </div>
                  <Badge variant={
                    u.status === "PROCESSED" ? "green"
                    : u.status === "VALID" ? "blue"
                    : u.status === "INVALID" ? "red"
                    : "amber"
                  }>
                    {u.status}
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-stone-400 mt-1">
                  <span>{u.totalRecords} records</span>
                  <span>{format(u.createdAt, "MMM d, yyyy HH:mm")}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Excel Format Guide */}
      <Card className="mt-6">
        <CardHeader title="Expected Excel Format" subtitle="Your attendance file must have these columns" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { col: "employee_id", type: "Text", eg: "EMP-001, WH-018" },
              { col: "employee_name", type: "Text", eg: "Sneha Pillai" },
              { col: "date", type: "Date", eg: "2025-06-01, 01-06-2025" },
              { col: "check_in", type: "Time", eg: "09:15, 09:00" },
              { col: "check_out", type: "Time", eg: "18:30, 18:00" },
              { col: "status", type: "Text", eg: "PRESENT, ABSENT, HALF_DAY" },
            ].map(f => (
              <div key={f.col} className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                <code className="text-xs font-bold text-orange-600">{f.col}</code>
                <p className="text-xs text-stone-500 mt-1">{f.type}</p>
                <p className="text-xs text-stone-400 mt-0.5">e.g. {f.eg}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
