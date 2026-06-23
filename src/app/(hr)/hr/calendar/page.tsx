"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, RefreshCw, X, Loader2,
  CalendarDays, Building2, Coffee
} from "lucide-react";
import toast from "react-hot-toast";
import PageHeader from "@/components/layout/PageHeader";

type DayStatus = "WORKING_DAY" | "WEEKLY_OFF" | "COMPANY_HOLIDAY";

interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  status: DayStatus;
  holidayName: string | null;
  description: string | null;
}

interface EditModal {
  date: string;
  dayOfWeek: string;
  status: DayStatus;
  holidayName: string;
  description: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG = {
  WORKING_DAY: {
    label: "Working Day",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dot: "bg-green-500",
    icon: Building2,
  },
  WEEKLY_OFF: {
    label: "Weekly Off",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-400",
    icon: Coffee,
  },
  COMPANY_HOLIDAY: {
    label: "Company Holiday",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: CalendarDays,
  },
};

function buildMonthDays(year: number, month: number): (string | null)[] {
  // Returns an array of date strings (YYYY-MM-DD) or null for padding
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

export default function CalendarPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<Map<string, CalendarEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [modal, setModal] = useState<EditModal | null>(null);
  const [saving, setSaving] = useState(false);

  const loadYear = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/calendar?year=${y}`);
      const data: CalendarEntry[] = await res.json();
      setEntries(new Map(data.map(e => [e.date, e])));
    } catch {
      toast.error("Failed to load calendar");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadYear(year); }, [year, loadYear]);

  const generateYear = async (overwrite = false) => {
    if (overwrite && !confirm(`This will reset ALL ${year} calendar entries to default (Sat/Sun = Weekly Off). Continue?`)) return;
    setGenerating(true);
    const res = await fetch("/api/hr/calendar/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, overwrite }),
    });
    if (res.ok) {
      const d = await res.json();
      toast.success(overwrite ? `Calendar reset for ${year}` : `Generated ${d.created} new entries for ${year}`);
      await loadYear(year);
    } else {
      toast.error("Failed to generate calendar");
    }
    setGenerating(false);
  };

  const openModal = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
    const existing = entries.get(dateStr);
    setModal({
      date: dateStr,
      dayOfWeek,
      status: existing?.status ?? (date.getUTCDay() === 0 ? "WEEKLY_OFF" : "WORKING_DAY"),
      holidayName: existing?.holidayName ?? "",
      description: existing?.description ?? "",
    });
  };

  const saveModal = async () => {
    if (!modal) return;
    setSaving(true);
    const res = await fetch("/api/hr/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: modal.date,
        status: modal.status,
        holidayName: modal.holidayName || null,
        description: modal.description || null,
      }),
    });
    if (res.ok) {
      const saved: CalendarEntry = await res.json();
      setEntries(prev => new Map(prev).set(saved.date, saved));
      toast.success("Saved");
      setModal(null);
    } else {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  const deleteEntry = async (dateStr: string) => {
    const res = await fetch(`/api/hr/calendar/${dateStr}`, { method: "DELETE" });
    if (res.ok) {
      setEntries(prev => { const m = new Map(prev); m.delete(dateStr); return m; });
      toast.success("Entry removed");
      setModal(null);
    } else {
      toast.error("Failed to remove");
    }
  };

  const totalEntries = entries.size;
  const holidayCount = [...entries.values()].filter(e => e.status === "COMPANY_HOLIDAY").length;
  const weeklyOffCount = [...entries.values()].filter(e => e.status === "WEEKLY_OFF").length;

  return (
    <div>
      <PageHeader
        title="Company Calendar"
        subtitle="Configure working days, weekly offs, and company holidays"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => generateYear(false)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-800 text-stone-200 rounded-lg hover:bg-stone-700 transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Generate Missing
            </button>
            <button
              onClick={() => generateYear(true)}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
            >
              Reset Year
            </button>
          </div>
        }
      />

      {/* Year navigation + stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setYear(y => y - 1)} className="p-1.5 rounded-lg hover:bg-stone-200 transition-all">
            <ChevronLeft className="w-4 h-4 text-stone-600" />
          </button>
          <span className="text-xl font-bold text-stone-900 w-16 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} className="p-1.5 rounded-lg hover:bg-stone-200 transition-all">
            <ChevronRight className="w-4 h-4 text-stone-600" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-stone-500">{cfg.label}</span>
              <span className="font-bold text-stone-700">
                {key === "COMPANY_HOLIDAY" ? holidayCount : key === "WEEKLY_OFF" ? weeklyOffCount : totalEntries - holidayCount - weeklyOffCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
        </div>
      ) : totalEntries === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <CalendarDays className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-amber-800 mb-1">No calendar configured for {year}</p>
          <p className="text-xs text-amber-600 mb-4">Click &quot;Generate Missing&quot; to auto-populate with Sat/Sun as weekly offs, or click any date to configure manually.</p>
          <button
            onClick={() => generateYear(false)}
            disabled={generating}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 transition-all"
          >
            Generate {year} Calendar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MONTH_NAMES.map((monthName, monthIdx) => {
            const cells = buildMonthDays(year, monthIdx);
            return (
              <div key={monthIdx} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wide">{monthName}</span>
                </div>
                <div className="p-3">
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className={`text-center text-[9px] font-bold py-0.5 ${i === 0 || i === 6 ? "text-orange-400" : "text-stone-400"}`}>
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {cells.map((dateStr, i) => {
                      if (!dateStr) return <div key={i} />;
                      const entry = entries.get(dateStr);
                      const dayNum = parseInt(dateStr.split("-")[2]);
                      const dow = new Date(dateStr + "T00:00:00Z").getUTCDay();
                      const isToday = dateStr === new Date().toISOString().split("T")[0];

                      let cellClass = "text-stone-400 hover:bg-stone-100";
                      let dotClass = "";

                      if (entry?.status === "COMPANY_HOLIDAY") {
                        cellClass = "bg-red-50 text-red-700 hover:bg-red-100";
                        dotClass = "bg-red-400";
                      } else if (entry?.status === "WEEKLY_OFF") {
                        cellClass = "bg-orange-50 text-orange-600 hover:bg-orange-100";
                      } else if (entry?.status === "WORKING_DAY") {
                        cellClass = "bg-green-50 text-green-700 hover:bg-green-100";
                      } else if (dow === 0) {
                        // Unconfigured Sunday — visual hint
                        cellClass = "text-orange-300 hover:bg-orange-50";
                      }

                      return (
                        <button
                          key={dateStr}
                          onClick={() => openModal(dateStr)}
                          title={entry?.holidayName ?? dateStr}
                          className={`relative rounded-md aspect-square flex items-center justify-center transition-all ${cellClass} ${isToday ? "ring-2 ring-orange-400 ring-offset-1" : ""}`}
                        >
                          <span className="text-[11px] font-semibold">{dayNum}</span>
                          {dotClass && (
                            <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotClass}`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div>
                <p className="text-base font-bold text-stone-900">{modal.date}</p>
                <p className="text-xs text-stone-400">{modal.dayOfWeek}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-stone-100 transition-all">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">Day Type</label>
                <div className="space-y-1.5">
                  {(Object.entries(STATUS_CONFIG) as [DayStatus, typeof STATUS_CONFIG[DayStatus]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setModal(m => m ? { ...m, status: key } : m)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${modal.status === key ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-stone-200 text-stone-500 hover:bg-stone-50"}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {modal.status === "COMPANY_HOLIDAY" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Holiday Name</label>
                    <input
                      type="text"
                      value={modal.holidayName}
                      onChange={e => setModal(m => m ? { ...m, holidayName: e.target.value } : m)}
                      placeholder="e.g. Republic Day"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wide mb-1.5">Description (optional)</label>
                    <input
                      type="text"
                      value={modal.description}
                      onChange={e => setModal(m => m ? { ...m, description: e.target.value } : m)}
                      placeholder="Optional note"
                      className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-1">
                {entries.has(modal.date) && (
                  <button
                    onClick={() => deleteEntry(modal.date)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-all"
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={saveModal}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
