"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Settings, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";

interface Setting {
  key: string;
  value: string;
  label: string;
  dataType: string;
  category: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  COMPANY: "Company",
  PAYROLL: "Payroll",
  ATTENDANCE: "Attendance",
  LEAVE: "Leave",
  OVERTIME: "Overtime",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/hr/settings")
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false); });
  }, []);

  const handleChange = (key: string, value: string) => {
    setChanged(prev => ({ ...prev, [key]: value }));
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const save = async () => {
    if (Object.keys(changed).length === 0) return toast("No changes");
    setSaving(true);
    const res = await fetch("/api/hr/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed),
    });
    if (res.ok) {
      toast.success("Settings saved");
      setChanged({});
    } else {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Company Settings"
        subtitle="Configure payroll and attendance parameters"
        actions={
          <button
            onClick={save}
            disabled={saving || Object.keys(changed).length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        }
      />

      <ChangePasswordCard />

      {Object.entries(grouped).map(([category, items]) => (
        <Card key={category} className="mb-4">
          <CardHeader
            title={CATEGORY_LABELS[category] || category}
            icon={<Settings className="w-4 h-4" />}
          />
          <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(s => (
              <div key={s.key}>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">{s.label}</label>
                <input
                  type={s.dataType === "NUMBER" ? "number" : "text"}
                  value={s.value}
                  onChange={e => handleChange(s.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                    changed[s.key] ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-white"
                  }`}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChangePasswordCard() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error("New passwords do not match");
    if (form.newPassword.length < 6) return toast.error("Password must be at least 6 characters");
    setSaving(true);
    const res = await fetch("/api/hr/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Password changed successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      toast.error(data.error || "Failed to change password");
    }
    setSaving(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader title="Change Admin Password" icon={<Lock className="w-4 h-4" />} />
      <form onSubmit={submit} className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { key: "currentPassword", label: "Current Password", showKey: "current" },
            { key: "newPassword", label: "New Password", showKey: "new" },
            { key: "confirmPassword", label: "Confirm New Password", showKey: "confirm" },
          ] as { key: keyof typeof form; label: string; showKey: keyof typeof show }[]).map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">{f.label}</label>
              <div className="relative">
                <input
                  type={show[f.showKey] ? "text" : "password"}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [f.showKey]: !p[f.showKey] }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {show[f.showKey] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Change Password
          </button>
        </div>
      </form>
    </Card>
  );
}
