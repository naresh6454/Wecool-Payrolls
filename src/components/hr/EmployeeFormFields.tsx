"use client";

import { Dispatch, SetStateAction } from "react";
import { Card, CardHeader } from "@/components/ui/Card";

export interface EmployeeFormData {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeType: string;
  dateOfJoining: string;
  gender: string;
  monthlySalary: string;
  departmentId: string;
  designationId: string;
  bankAccountNo: string;
  password?: string;
}

interface Department { id: string; name: string; }
interface Designation { id: string; name: string; departmentId: string | null; }

interface Props {
  form: EmployeeFormData;
  setForm: Dispatch<SetStateAction<EmployeeFormData>>;
  departments: Department[];
  designations: Designation[];
  showPassword?: boolean;
}

const INPUT = "w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white";

export default function EmployeeFormFields({ form, setForm, departments, designations, showPassword }: Props) {
  const set = (k: keyof EmployeeFormData, v: string) => setForm(p => ({ ...p, [k]: v }));

  const filteredDesignations = form.departmentId
    ? designations.filter(d => d.departmentId === form.departmentId)
    : designations;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Info */}
      <Card>
        <CardHeader title="Basic Information" />
        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              Employee ID / Code <span className="text-red-400">*</span>
            </label>
            <input
              value={form.employeeCode}
              onChange={e => set("employeeCode", e.target.value.toUpperCase())}
              className={INPUT}
              placeholder="e.g. WC054"
            />
            <p className="text-xs text-stone-400 mt-1">Must match the ID used in attendance sheets</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">First Name <span className="text-red-400">*</span></label>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)} className={INPUT} placeholder="Rajesh" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Last Name</label>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)} className={INPUT} placeholder="Kumar" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email Address <span className="text-red-400">*</span></label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={INPUT} placeholder="rajesh@wecool.com" />
          </div>

          {showPassword && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Temporary Password</label>
              <input type="text" value={form.password ?? ""} onChange={e => set("password", e.target.value)} className={INPUT} />
              <p className="text-xs text-stone-400 mt-1">Employee can change this after login</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} className={INPUT} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Gender</label>
              <select value={form.gender} onChange={e => set("gender", e.target.value)} className={INPUT}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Bank Account No.</label>
            <input value={form.bankAccountNo} onChange={e => set("bankAccountNo", e.target.value)} className={INPUT} placeholder="Account number" />
          </div>
        </div>
      </Card>

      {/* Employment Info */}
      <Card>
        <CardHeader title="Employment Details" />
        <div className="px-6 pb-6 pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Employee Type <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(["OFFICE", "WAREHOUSE"] as const).map(t => (
                <button key={t} type="button" onClick={() => set("employeeType", t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    form.employeeType === t
                      ? "bg-orange-500 border-orange-500 text-white"
                      : "bg-white border-stone-200 text-stone-600 hover:border-orange-300"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Department</label>
              <select value={form.departmentId}
                onChange={e => { set("departmentId", e.target.value); set("designationId", ""); }}
                className={INPUT}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Designation</label>
              <select value={form.designationId} onChange={e => set("designationId", e.target.value)} className={INPUT}>
                <option value="">Select Designation</option>
                {filteredDesignations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Date of Joining <span className="text-red-400">*</span></label>
            <input type="date" value={form.dateOfJoining} onChange={e => set("dateOfJoining", e.target.value)} className={INPUT} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Monthly Salary (₹) <span className="text-red-400">*</span></label>
            <input type="number" value={form.monthlySalary} onChange={e => set("monthlySalary", e.target.value)} className={INPUT} placeholder="45000" />
            {form.monthlySalary && (
              <div className="mt-2 p-3 bg-stone-50 rounded-xl text-xs text-stone-500 space-y-1">
                <div className="flex justify-between"><span>Basic (50%)</span><span className="font-semibold">₹{(Number(form.monthlySalary) * 0.5).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>HRA (40% of Basic)</span><span className="font-semibold">₹{(Number(form.monthlySalary) * 0.2).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span>Conveyance</span><span className="font-semibold">₹1,600</span></div>
                <div className="flex justify-between"><span>Bonus</span><span className="font-semibold">₹2,000</span></div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
