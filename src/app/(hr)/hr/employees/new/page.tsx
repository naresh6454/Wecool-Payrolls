"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import EmployeeFormFields, { EmployeeFormData } from "@/components/hr/EmployeeFormFields";

interface Department { id: string; name: string; }
interface Designation { id: string; name: string; departmentId: string | null; }

const DEFAULT_FORM: EmployeeFormData = {
  employeeCode: "", firstName: "", lastName: "", email: "",
  password: "Welcome@123", phone: "", employeeType: "OFFICE",
  dateOfJoining: new Date().toISOString().split("T")[0],
  gender: "", monthlySalary: "", departmentId: "", designationId: "", bankAccountNo: "",
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [form, setForm] = useState<EmployeeFormData>(DEFAULT_FORM);
  const [leaveBalance, setLeaveBalance] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/hr/departments").then(r => r.json()),
      fetch("/api/hr/designations").then(r => r.json()),
    ]).then(([depts, desigs]) => { setDepartments(depts); setDesignations(desigs); });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.monthlySalary || !form.employeeCode) {
      return toast.error("Fill all required fields");
    }
    setSaving(true);
    const res = await fetch("/api/hr/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, currentLeaveBalance: parseFloat(leaveBalance) || 0 }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Employee created successfully!");
      router.push(`/hr/employees/${data.employeeId}`);
    } else {
      toast.error(data.error || "Failed to create employee");
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/hr/employees" className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-all mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
        <PageHeader title="Add New Employee" subtitle="Create a new employee account directly" icon={<UserPlus className="w-5 h-5" />} />
      </div>

      <form onSubmit={submit} className="space-y-6">
        <EmployeeFormFields
          form={form} setForm={setForm}
          departments={departments} designations={designations}
          showPassword
        />

        {/* Leave Balance */}
        <Card>
          <CardHeader title="Leave Balance" />
          <div className="px-6 pb-6 pt-4 flex flex-col md:flex-row items-start gap-6">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Current Leave Balance (days)</label>
              <input type="number" min={0} step="any" value={leaveBalance} onChange={e => setLeaveBalance(e.target.value)}
                className="w-full max-w-xs px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
                placeholder="e.g. 5.5" />
              <p className="text-xs text-stone-400 mt-1.5">Leave blank to start from 0.</p>
            </div>
            <div className="flex-1 p-4 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-800 space-y-1.5">
              <div className="font-semibold text-orange-700">Auto-accrual: 1.33 days/month</div>
              <div className="text-xs text-orange-600">Every payroll run adds 1.33 leave days automatically.</div>
              <div className="text-xs text-orange-600 font-medium">12 months × 1.33 = 16 days/year</div>
            </div>
          </div>
        </Card>

        <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
          Employee account will be created as <strong>APPROVED</strong> — they can log in immediately.
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/hr/employees" className="px-5 py-2.5 border border-stone-200 text-stone-600 text-sm font-semibold rounded-xl hover:bg-stone-50 transition-all">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create Employee
          </button>
        </div>
      </form>
    </div>
  );
}
