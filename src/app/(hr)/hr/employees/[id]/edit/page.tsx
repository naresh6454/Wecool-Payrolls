"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import EmployeeFormFields, { EmployeeFormData } from "@/components/hr/EmployeeFormFields";

interface Department { id: string; name: string; }
interface Designation { id: string; name: string; departmentId: string | null; }

const EMPTY_FORM: EmployeeFormData = {
  employeeCode: "", firstName: "", lastName: "", email: "", phone: "",
  employeeType: "OFFICE", dateOfJoining: "", gender: "",
  monthlySalary: "", departmentId: "", designationId: "", bankAccountNo: "",
};

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [form, setForm] = useState<EmployeeFormData>(EMPTY_FORM);
  const [leaveBalance, setLeaveBalance] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/hr/employees/${id}`).then(r => r.json()),
      fetch("/api/hr/departments").then(r => r.json()),
      fetch("/api/hr/designations").then(r => r.json()),
    ]).then(([emp, depts, desigs]) => {
      setDepartments(depts);
      setDesignations(desigs);
      setForm({
        employeeCode: emp.employeeCode || "",
        firstName: emp.firstName || "",
        lastName: emp.lastName || "",
        email: emp.email || "",
        phone: emp.phone || "",
        employeeType: emp.employeeType || "OFFICE",
        dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split("T")[0] : "",
        gender: emp.gender || "",
        monthlySalary: emp.monthlySalary ? String(emp.monthlySalary) : "",
        departmentId: emp.departmentId || "",
        designationId: emp.designationId || "",
        bankAccountNo: emp.bankAccountNo || "",
      });
      if (emp.leaveBalance) setLeaveBalance(String(Number(emp.leaveBalance.totalAllocated)));
      setLoading(false);
    }).catch(() => { toast.error("Failed to load employee"); setLoading(false); });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.monthlySalary || !form.employeeCode) return toast.error("Fill all required fields");
    setSaving(true);
    const body: Record<string, unknown> = { ...form };
    if (leaveBalance !== "") body.leaveBalance = Number(leaveBalance);
    const res = await fetch(`/api/hr/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Employee updated successfully!");
      router.push(`/hr/employees/${id}`);
    } else {
      toast.error(data.error || "Failed to update");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Link href={`/hr/employees/${id}`} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-all mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Employee
        </Link>
        <PageHeader title="Edit Employee" subtitle="Update employee details and salary" icon={<Save className="w-5 h-5" />} />
      </div>

      <form onSubmit={submit} className="space-y-6">
        <EmployeeFormFields
          form={form} setForm={setForm}
          departments={departments} designations={designations}
        />

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700 mb-4">Leave Balance (2026)</h3>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Total Allocated Leave Days
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={leaveBalance}
              onChange={e => setLeaveBalance(e.target.value)}
              placeholder="e.g. 6.19"
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="mt-1.5 text-xs text-stone-400">
              Set the employee&apos;s total leave days for this year (opening balance + accruals so far).
              Payroll will add 1.33 days on first run for each month.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/hr/employees/${id}`} className="px-5 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
