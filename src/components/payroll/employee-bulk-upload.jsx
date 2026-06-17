"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Upload, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const TEMPLATE_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "dateOfJoining",
  "departmentName",
  "designation",
  "workingHr",
  "basicSalary",
  "salaryType",
  "bankAccountNumber",
  "bankName",
  "ifscCode",
];

function buildTemplateWorkbook() {
  const workbook = XLSX.utils.book_new();
  const exampleRow = [
    "Amit",
    "Sharma",
    "amit.sharma@example.com",
    "9876543210",
    "2026-04-01",
    "Sales",
    "Sales Executive",
    8,
    25000,
    "monthly",
    "123456789012",
    "HDFC Bank",
    "HDFC0000123",
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, exampleRow]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");
  return workbook;
}

export default function EmployeeBulkUpload() {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fileLabel = useMemo(() => {
    if (!file) return "No file selected";
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  const downloadTemplate = () => {
    try {
      const workbook = buildTemplateWorkbook();
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `employee_bulk_template_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate template");
    }
  };

  const submit = async () => {
    if (!file) {
      toast.error("Please select an Excel file first");
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v1/admin/employees/bulk-import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || "Bulk upload failed";
        toast.error(msg);
        setResult({ ok: false, ...data });
        return;
      }

      toast.success("Bulk upload finished");
      setResult({ ok: true, ...data });
    } catch (e) {
      console.error(e);
      toast.error("Network error during upload");
      setResult({ ok: false, error: "Network error during upload" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Bulk Add Employees</h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Upload an Excel sheet to create many employees at once
                </p>
              </div>
            </div>

            <Link
              href="/admin/employees"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Template</h2>
              <p className="text-sm text-slate-600 mt-1">
                Download the template and fill it. Required headers:{" "}
                <span className="font-medium text-slate-700">
                  {TEMPLATE_HEADERS.join(", ")}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Upload Excel</h2>
            <p className="text-sm text-slate-600 mt-1">
              Supported: <span className="font-medium text-slate-700">.xlsx</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 text-slate-700">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Choose file</span>
                </div>
                <span className="text-sm text-slate-500 truncate">{fileLabel}</span>
              </div>
            </label>

            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {submitting ? "Uploading..." : "Upload & Import"}
            </button>
          </div>

          {result ? (
            <div className={`rounded-lg border p-4 ${result.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <p className={`text-sm font-semibold ${result.ok ? "text-emerald-900" : "text-rose-900"}`}>
                {result.ok ? "Import Result" : "Import Failed"}
              </p>
              {result.message ? <p className="text-sm text-slate-700 mt-1">{result.message}</p> : null}

              {result.summary ? (
                <div className="text-sm text-slate-800 mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Created: <span className="font-semibold">{result.summary.created}</span></span>
                  <span>Skipped: <span className="font-semibold">{result.summary.skipped}</span></span>
                  <span>Failed: <span className="font-semibold">{result.summary.failed}</span></span>
                </div>
              ) : null}

              {Array.isArray(result.errors) && result.errors.length ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-slate-900">Errors</p>
                  <div className="mt-2 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-slate-600 font-semibold">Row</th>
                          <th className="text-left px-3 py-2 text-slate-600 font-semibold">Email</th>
                          <th className="text-left px-3 py-2 text-slate-600 font-semibold">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.slice(0, 200).map((e, idx) => (
                          <tr key={idx} className="border-b border-slate-100">
                            <td className="px-3 py-2 text-slate-700">{e.row}</td>
                            <td className="px-3 py-2 text-slate-700">{e.email || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{e.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.errors.length > 200 ? (
                    <p className="text-xs text-slate-600 mt-2">
                      Showing first 200 errors. Fix the sheet and re-upload.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

