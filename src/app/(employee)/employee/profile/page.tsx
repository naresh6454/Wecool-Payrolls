"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, User } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { format } from "date-fns";

interface Profile {
  email: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    employeeType: string;
    dateOfJoining: string;
    gender: string | null;
    department: { name: string } | null;
    designation: { name: string } | null;
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    fetch("/api/employee/profile")
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setPhone(d.employee?.phone || "");
        setLoading(false);
      });
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/employee/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (res.ok) toast.success("Profile updated");
    else toast.error("Failed to update");
    setSaving(false);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw) return toast.error("Fill both fields");
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    setSaving(true);
    const res = await fetch("/api/employee/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    if (res.ok) {
      toast.success("Password changed");
      setCurrentPw(""); setNewPw("");
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed");
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );
  if (!profile) return null;

  const emp = profile.employee;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="View and update your information" icon={<User className="w-5 h-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Personal Information" />
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Employee Code", emp.employeeCode],
                ["Full Name", `${emp.firstName} ${emp.lastName}`],
                ["Email", profile.email],
                ["Employee Type", emp.employeeType],
                ["Department", emp.department?.name || "—"],
                ["Designation", emp.designation?.name || "—"],
                ["Date of Joining", format(new Date(emp.dateOfJoining), "MMMM d, yyyy")],
                ["Gender", emp.gender || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-stone-400 font-semibold mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-stone-800">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="+91 XXXXX XXXXX"
                />
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Change Password" />
          <form onSubmit={changePassword} className="px-6 pb-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-stone-800 text-white text-sm font-semibold rounded-xl hover:bg-stone-900 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Change Password
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
