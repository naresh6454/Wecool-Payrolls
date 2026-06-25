import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarCheck, Upload } from "lucide-react";

export default async function AttendanceRecordsPage() {
  await requireAuth("HR");

  const uploads = await prisma.attendanceUpload.findMany({
    include: { uploadedBy: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const recentRecords = await prisma.attendanceRecord.findMany({
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { attendanceDate: "desc" },
    take: 50,
  });

  const statusVariant = (s: string): "green" | "red" | "amber" | "orange" | "gray" => {
    if (s === "PRESENT") return "green";
    if (s === "ABSENT") return "red";
    if (s === "HALF_DAY") return "amber";
    if (s === "LEAVE") return "orange";
    return "gray";
  };

  return (
    <div>
      <PageHeader
        title="Attendance Records"
        subtitle="View all uploaded attendance data"
        actions={
          <Link
            href="/hr/attendance/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload Attendance
          </Link>
        }
      />

      {/* Upload History */}
      <Card className="mb-6">
        <CardHeader title="Upload History" subtitle="All attendance file uploads" />
        {uploads.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400">
            <Upload className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p>No uploads yet</p>
            <Link href="/hr/attendance/upload" className="text-orange-500 text-sm font-semibold mt-1 inline-block">
              Upload your first attendance file →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {uploads.map((u) => {
              const variant: "green" | "red" | "amber" | "gray" =
                u.status === "VALID" || u.status === "PROCESSED" ? "green" :
                u.status === "INVALID" ? "red" :
                u.status === "VALIDATING" ? "amber" : "gray";
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-stone-50 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <CalendarCheck className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{u.payrollMonth}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {u.validRecords}/{u.totalRecords} valid · {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant={variant}>{u.status}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent Records */}
      <Card>
        <CardHeader title="Recent Attendance Entries" subtitle="Latest 50 records" />
        {recentRecords.length === 0 ? (
          <div className="px-6 py-12 text-center text-stone-400">No attendance records found</div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-stone-100">
              {recentRecords.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-stone-800">{r.employee.firstName} {r.employee.lastName}</p>
                      <span className="text-[10px] font-mono text-stone-400">{r.employee.employeeCode}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-stone-500">
                      <span>{format(new Date(r.attendanceDate), "MMM d, yyyy")}</span>
                      {r.checkIn && <span>{r.checkIn} – {r.checkOut || "?"}</span>}
                      {r.workingHours ? <span>{Number(r.workingHours).toFixed(2)} hrs</span> : null}
                      {r.isLate && <span className="text-amber-600 font-semibold">+{r.lateMinutes}m late</span>}
                    </div>
                  </div>
                  <Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100">
                    {["Employee", "Date", "Check In", "Check Out", "Hours", "Status", "Late"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-stone-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {recentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-all">
                      <td className="px-6 py-3">
                        <p className="font-semibold text-stone-800">{r.employee.firstName} {r.employee.lastName}</p>
                        <p className="text-xs text-stone-400">{r.employee.employeeCode}</p>
                      </td>
                      <td className="px-6 py-3 text-stone-600">{format(new Date(r.attendanceDate), "MMM d, yyyy")}</td>
                      <td className="px-6 py-3 text-stone-600">{r.checkIn || "—"}</td>
                      <td className="px-6 py-3 text-stone-600">{r.checkOut || "—"}</td>
                      <td className="px-6 py-3 text-stone-600">{r.workingHours ? `${Number(r.workingHours).toFixed(2)} hrs` : "—"}</td>
                      <td className="px-6 py-3"><Badge variant={statusVariant(r.status)} size="sm">{r.status}</Badge></td>
                      <td className="px-6 py-3">
                        {r.isLate ? <span className="text-xs text-amber-600 font-semibold">+{r.lateMinutes}m late</span> : <span className="text-xs text-stone-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
