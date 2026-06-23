"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, FileSpreadsheet, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface UploadErrors {
  errors: Array<{ row: number; field: string; message: string }>;
  warnings: Array<{ employeeId: string; message: string }>;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  payrollMonth: string;
  periodStart: string;
  periodEnd: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AttendanceUploadForm() {
  const router = useRouter();
  const now = new Date();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadErrors | null>(null);
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
      setFile(f);
      setUploadErrors(null);
    } else {
      toast.error("Only .xlsx or .xls files are accepted");
    }
  }, []);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadErrors(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("periodYear", String(periodYear));
    formData.append("periodMonth", String(periodMonth));
    try {
      const res = await fetch("/api/hr/attendance/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Upload failed"); return; }
      if (json.status === "INVALID") {
        setUploadErrors(json);
        toast.error(`${json.invalidRecords} error(s) found — fix and re-upload`);
        return;
      }
      // Valid — payroll auto-generated, go straight to review
      toast.success("Attendance uploaded & payroll generated!");
      router.push(json.payrollRunId ? `/hr/payroll/${json.payrollRunId}/review` : "/hr/payroll/review");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Upload Attendance Excel" subtitle="Select the payroll period and upload the device export file" />
      <CardBody className="space-y-4">
        {/* Period selector */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Payroll Period (To Month)</p>
          <p className="text-xs text-stone-400">Select the month this attendance file ends in. E.g. for Dec 14 – Jan 13 period, select January.</p>
          <div className="flex gap-2">
            <select
              value={periodMonth}
              onChange={e => setPeriodMonth(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={periodYear}
              onChange={e => setPeriodYear(Number(e.target.value))}
              className="w-28 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              {[-1, 0, 1].map(offset => {
                const y = now.getFullYear() + offset;
                return <option key={y} value={y}>{y}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all cursor-pointer ${
            dragging ? "border-orange-400 bg-orange-50"
            : file ? "border-green-400 bg-green-50"
            : "border-stone-200 hover:border-orange-300 hover:bg-orange-50/50"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setUploadErrors(null); }}
          />
          {file ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-700">{file.name}</p>
              <p className="text-xs text-green-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-600">Drop your Excel file here</p>
              <p className="text-xs text-stone-400 mt-1">or click to browse — .xlsx, .xls accepted</p>
            </>
          )}
        </div>

        {/* Validation errors (only shown for INVALID uploads) */}
        {uploadErrors && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", val: uploadErrors.totalRecords, color: "text-stone-700" },
                { label: "Valid", val: uploadErrors.validRecords, color: "text-green-600" },
                { label: "Errors", val: uploadErrors.invalidRecords, color: "text-red-600" },
              ].map(s => (
                <div key={s.label} className="bg-stone-50 rounded-xl p-3 text-center border border-stone-100">
                  <div className={`text-xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {uploadErrors.errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-red-700">Row {e.row} · {e.field}</p>
                  <p className="text-red-600">{e.message}</p>
                </div>
              </div>
            ))}
            {uploadErrors.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-700">{w.employeeId}</p>
                  <p className="text-amber-600">{w.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleUpload} loading={uploading} disabled={!file} className="w-full" size="lg">
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          ) : (
            <><Upload className="w-4 h-4" /> Upload & Generate Payroll</>
          )}
        </Button>

        {uploading && (
          <p className="text-xs text-center text-stone-400">
            Uploading attendance and generating payroll — this may take a few seconds…
          </p>
        )}
      </CardBody>
    </Card>
  );
}
