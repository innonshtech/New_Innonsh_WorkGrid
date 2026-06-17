"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Upload,
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Download,
  X,
  Eye,
  Search,
  Clock,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import toast, { Toaster } from "react-hot-toast";

export default function ImportAttendance() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    completed: 0,
    failed: 0,
  });

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        selectedFile.type === "application/vnd.ms-excel"
      ) {
        setFile(selectedFile);
        setErrors([]);
        setSuccess(false);
        setShowPreview(false);
        setPreview([]);
      } else {
        toast.error("Please select a valid Excel file (.xlsx or .xls)");
      }
    }
  };

  // Parse Excel file - now processes all sheets
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });

          // Process all sheets instead of just the first one
          const allSheetData = [];

          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Add sheet name for reference
            allSheetData.push({
              sheetName,
              data: jsonData
            });
          });

          resolve(allSheetData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Extract attendance data from parsed Excel - now handles multiple sheets
  const extractAttendanceData = (allSheetData) => {
    const attendanceRecords = [];
    const errorList = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    allSheetData.forEach(({ sheetName, data: excelData }) => {
      console.log(`Processing sheet: ${sheetName}`);
      let currentEmployeeCode = null;
      let currentEmployeeName = null;
      let sixTo8HourFirstTimeUsed = {};

      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        if (!Array.isArray(row) || row.length === 0) continue;

        // 1. SEARCH FOR EMPLOYEE INFO HEADERS
        const empCodeIndex = row.findIndex(cell => {
          if (typeof cell !== 'string') return false;
          const clean = cell.trim().toLowerCase();
          return clean.includes("emp") && (clean.includes("code") || clean.includes("id"));
        });

        if (empCodeIndex !== -1) {
          // Look for code in subsequent cells in this row
          for (let j = empCodeIndex + 1; j < Math.min(row.length, empCodeIndex + 6); j++) {
            if (row[j] !== undefined && row[j] !== null && row[j] !== "") {
              currentEmployeeCode = row[j].toString().trim();
              break;
            }
          }

          // Look for Name header in the same row
          const nameIdx = row.findIndex((cell, idx) =>
            idx > empCodeIndex && typeof cell === 'string' && cell.toLowerCase().includes("name")
          );
          if (nameIdx !== -1) {
            for (let j = nameIdx + 1; j < Math.min(row.length, nameIdx + 6); j++) {
              if (row[j] !== undefined && row[j] !== null && j !== empCodeIndex) {
                if (row[j].toString().trim() !== "") {
                  currentEmployeeName = row[j].toString().trim();
                  break;
                }
              }
            }
          }
          sixTo8HourFirstTimeUsed[currentEmployeeCode] = false;
        }

        // 2. SEARCH FOR ATTENDANCE DATA BLOCK (Status Row)
        const statusHeaderIndex = row.findIndex(cell =>
          typeof cell === 'string' && cell.trim().toLowerCase().includes("status")
        );

        if (statusHeaderIndex !== -1 && currentEmployeeCode) {
          const statusRow = row;
          let inTimeRow = [];
          let outTimeRow = [];
          let excelHoursRow = [];

          // SEARCH FOR IN/OUT/HOURS ROWS IN THE NEXT 4 ROWS
          for (let k = 1; k <= 4; k++) {
            const nextRow = excelData[i + k] || [];
            const labelCell1 = nextRow[statusHeaderIndex - 1];
            const labelCell2 = nextRow[statusHeaderIndex];
            const rowLabel = ((labelCell1 || "") + " " + (labelCell2 || "")).toString().toLowerCase();

            if (rowLabel.includes("in")) inTimeRow = nextRow;
            else if (rowLabel.includes("out")) outTimeRow = nextRow;
            else if (rowLabel.includes("hours") || rowLabel.includes("total") || rowLabel.includes("work")) excelHoursRow = nextRow;
          }

          // Fallback to i+1 and i+2 if not found by labels
          if (inTimeRow.length === 0) inTimeRow = excelData[i + 1] || [];
          if (outTimeRow.length === 0) outTimeRow = excelData[i + 2] || [];

          for (let day = 1; day <= daysInMonth; day++) {
            const columnIndex = statusHeaderIndex + day;
            const statusValue = statusRow[columnIndex];

            if (statusValue !== undefined && statusValue !== null && statusValue !== "") {
              const date = new Date(selectedYear, selectedMonth - 1, day);
              let workedHours = 0;
              let isDayType = "Full";
              let isNightShift = false;

              const inTime = inTimeRow[columnIndex];
              const outTime = outTimeRow[columnIndex];
              const excelHoursValue = excelHoursRow[columnIndex];

              const mappedStatus = mapStatus(statusValue.toString().trim());

              if (mappedStatus === "Present") {
                try {
                  // Option 1: Calculate from In/Out (Prioritize accuracy)
                  if (inTime && outTime) {
                    const checkInMs = parseTimeValue(inTime);
                    const checkOutMs = parseTimeValue(outTime);

                    if (checkInMs !== null && checkOutMs !== null) {
                      let diffMs = checkOutMs - checkInMs;

                      // Handle night shifts (check-out on next day)
                      if (diffMs < 0) {
                        diffMs += 24 * 60 * 60 * 1000;
                        isNightShift = true;
                      }

                      workedHours = diffMs / (1000 * 60 * 60);
                    }
                  }

                  // Option 2: Use Hours column from Excel as fallback if calculation failed or data missing
                  if (workedHours === 0 && excelHoursValue !== undefined && excelHoursValue !== null && excelHoursValue !== "" && !isNaN(parseFloat(excelHoursValue))) {
                    const parsedExcelHours = parseFloat(excelHoursValue);
                    workedHours = parsedExcelHours < 1 ? parsedExcelHours * 24 : parsedExcelHours;
                  }

                  // Determine Day Type based on worked hours
                  if (workedHours > 0) {
                    if (workedHours < 4) {
                      isDayType = "None"; // Treat as inactive/absent for calculation
                      // mappedStatus = "Absent"; // Uncomment if you want to visually change status to Absent
                    } else if (workedHours < 6) {
                      // 4-6 hours is Half
                      isDayType = "Half";
                    } else if (workedHours <= 8) {
                      // 6-8 hours logic: One grace full day allowed, otherwise Half
                      if (!sixTo8HourFirstTimeUsed[currentEmployeeCode]) {
                        isDayType = "Full";
                        sixTo8HourFirstTimeUsed[currentEmployeeCode] = true;
                      } else {
                        isDayType = "Half";
                      }
                    } else {
                      isDayType = "Full";
                    }
                  } else {
                    // 0 hours but Present? Likely a mistake or special case like "On Duty" not captured here. 
                    // Keeping as Full if status was P to be safe, or could be None.
                    isDayType = "Full";
                  }
                } catch (error) {
                  console.error(`Error calculating hours for ${currentEmployeeCode}:`, error);
                }
              } else if (mappedStatus === "Weekend" || mappedStatus === "Holiday") {
                isDayType = "Full";
              } else {
                isDayType = "None";
              }

              const checkOutDate = new Date(date);
              if (isNightShift) {
                checkOutDate.setDate(checkOutDate.getDate() + 1);
              }

              attendanceRecords.push({
                employeeCode: currentEmployeeCode,
                employeeName: currentEmployeeName,
                date: date.toISOString().split("T")[0],
                status: mappedStatus,
                checkIn: formatTime(inTime, date),
                checkOut: formatTime(outTime, checkOutDate),
                workedHours: parseFloat(workedHours.toFixed(2)),
                dayType: isDayType,
                sheetName: sheetName,
              });
            }
          }
        }
      }
    });

    return { attendanceRecords, errorList };
  };

  // Helper function to parse time value to milliseconds
  const parseTimeValue = (timeValue) => {
    if (timeValue === undefined || timeValue === null || timeValue === "") return null;

    try {
      // 1. If it's an Excel serial number (fraction of a 24h day)
      if (typeof timeValue === "number") {
        return Math.round(timeValue * 86400) * 1000;
      }

      // 2. If it's a string
      if (typeof timeValue === "string") {
        const cleanValue = timeValue.trim().toUpperCase();
        if (!cleanValue.includes(":")) return null;

        // Check for AM/PM
        const isPM = cleanValue.includes("PM");
        const isAM = cleanValue.includes("AM");

        // Remove AM/PM for easier numeric parsing
        const timePart = cleanValue.replace(/[AP]M/g, "").trim();
        const parts = timePart.split(":");

        let hours = parseInt(parts[0]) || 0;
        let minutes = parseInt(parts[1]) || 0;
        let seconds = parseInt(parts[2]) || 0;

        // Adjust for 12-hour format if AM/PM is present
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        return (hours * 3600 + minutes * 60 + seconds) * 1000;
      }

      return null;
    } catch (error) {
      console.error("Error parsing time value:", error, timeValue);
      return null;
    }
  };

  // Map Excel status to our status
  const mapStatus = (excelStatus) => {
    if (!excelStatus) return "Absent";
    const clean = excelStatus.toString().trim().toUpperCase();

    const statusMap = {
      P: "Present",
      PRESENT: "Present",
      A: "Absent",
      ABSENT: "Absent",
      L: "Leave",
      LEAVE: "Leave",
      WO: "Weekend",
      WOP: "Weekend",
      WEEKEND: "Weekend",
      H: "Holiday",
      HOLIDAY: "Holiday",
      OFF: "Weekend",
    };

    return statusMap[clean] || (clean.startsWith("P") ? "Present" : clean.startsWith("A") ? "Absent" : "Absent");
  };

  // Format time from Excel
  const formatTime = (timeValue, date) => {
    if (timeValue === undefined || timeValue === null || timeValue === "") return null;

    try {
      const d = new Date(date);

      if (typeof timeValue === "number") {
        const totalSeconds = Math.round(timeValue * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        d.setHours(hours, minutes, seconds, 0);
        return d.toISOString();
      }

      if (typeof timeValue === "string") {
        const cleanValue = timeValue.trim().toUpperCase();
        if (!cleanValue.includes(":")) return null;

        const isPM = cleanValue.includes("PM");
        const isAM = cleanValue.includes("AM");

        const timePart = cleanValue.replace(/[AP]M/g, "").trim();
        const parts = timePart.split(":");

        let hours = parseInt(parts[0]) || 0;
        let minutes = parseInt(parts[1]) || 0;
        let seconds = parseInt(parts[2]) || 0;

        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;

        d.setHours(hours, minutes, seconds, 0);
        return d.toISOString();
      }

      return null;
    } catch (error) {
      console.error("Error formatting time:", error, timeValue);
      return null;
    }
  };

  // Helper to format worked hours to "Xh Ymin"
  const formatHours = (decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return "0h 0m";
    const totalMinutes = Math.round(decimalHours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  // Preview data
  const handlePreview = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setProcessing(true);

      const allSheetData = await parseExcelFile(file);
      const { attendanceRecords, errorList } = extractAttendanceData(allSheetData);

      if (attendanceRecords.length === 0) {
        toast.error("No valid attendance records found in any sheet");
      }

      setPreview(attendanceRecords);
      const uniqueSheets = [...new Set(attendanceRecords.map(r => r.sheetName))];
      if (uniqueSheets.length > 0) {
        setActiveSheet(uniqueSheets[0]);
      }

      setErrors(errorList);
      setShowPreview(true);

      toast.success(`Processed ${allSheetData.length} sheet(s) with ${attendanceRecords.length} records`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Error parsing Excel file. Please check the file format.");
    } finally {
      setProcessing(false);
    }
  };

  // Upload attendance data
  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");

    try {
      setProcessing(true);

      const allSheetData = await parseExcelFile(file);
      const { attendanceRecords } = extractAttendanceData(allSheetData);

      const response = await fetch("/api/v1/admin/payroll/attendance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceRecords }),
      });

      const result = await response.json();

      setUploadProgress({
        total: attendanceRecords.length,
        completed: result.success,
        failed: result.failed,
      });

      if (result.failed > 0) {
        setErrors(result.errors);
      }

      setSuccess(true);

    } catch (err) {
      console.error(err);
      toast.error("Error uploading file");
    } finally {
      setProcessing(false);
    }
  };


  // Upload single attendance record
  const uploadAttendanceRecord = async (record) => {
    try {
      // First, find employee by code
      const employeeResponse = await fetch(
        `/api/v1/admin/payroll/employees?employeeId=${record.employeeCode}`
      );
      const employeeData = await employeeResponse.json();

      if (!employeeData.employees || employeeData.employees.length === 0) {
        throw new Error(`Employee not found: ${record.employeeCode}`);
      }

      const employee = employeeData.employees[0];

      // Create attendance record
      const attendanceData = {
        employee: employee._id,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
      };

      const response = await fetch("/api/v1/admin/payroll/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create attendance record");
      }

      return await response.json();
    } catch (error) {
      throw error.message;
    }
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    // Create sample data
    const sampleData = [
      ["", "", "", "", "", "", "Emp. Name:", "", "", "SAMPLE EMPLOYEE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Emp. Code:", "", "EMP001", "", "", "", "Emp. Name:", "", "", "SAMPLE EMPLOYEE", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Status", "P", "P", "P", "P", "P", "P", "WO", "P", "P", "P", "P", "P", "P", "WO", "P", "P", "P", "P", "P", "P", "WO", "P", "P", "P", "P", "P", "P", "WO", "P", "P"],
      ["InTime", "09:00", "09:15", "09:00", "09:10", "09:05", "09:00", "", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "", "09:00", "09:00", "09:00", "09:00", "09:00", "09:00", "", "09:00", "09:00"],
      ["OutTime", "18:00", "18:00", "18:00", "18:00", "18:00", "18:00", "", "18:00", "18:00", "18:00", "18:00", "18:00", "18:00", "", "18:00", "18:00", "18:00", "18:00", "18:00", "18:00", "", "18:00", "18:00", "18:00", "18:00", "18:00", "18:00", "", "18:00", "18:00"],
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(sampleData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    // Download
    XLSX.writeFile(wb, "attendance_template.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Import Attendance from Excel
                </h1>
                <p className="text-slate-600">
                  Upload attendance data for the entire month
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/payroll/attendance")}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Instructions for Excel Import
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Download the sample template to see the required format</li>
                <li>
                  Employee Code must match existing employee IDs in the system
                </li>
                <li>Status codes: P = Present, A = Absent, L = Leave, WO = Weekend</li>
                <li>Time format should be HH:MM (e.g., 09:00, 18:30)</li>
                <li>Select the month and year before uploading</li>
                <li>The system will process all employees in the file</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Month Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Select Month and Year
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Upload Excel File
              </h2>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 bg-slate-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                </div>

                {file ? (
                  <div className="text-center">
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={() => {
                        setFile(null);
                        setShowPreview(false);
                        setPreview([]);
                        setErrors([]);
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="font-medium text-slate-900">
                        Drop your Excel file here, or click to browse
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Supports .xlsx and .xls files
                      </p>
                    </div>
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {file && !showPreview && (
              <div className="flex justify-center gap-3">
                <button
                  onClick={handlePreview}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Analyze & Preview
                </button>
                <button
                  onClick={handleUpload}
                  disabled={processing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {processing ? "Processing..." : "Upload Attendance"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {processing && uploadProgress.total > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Upload Progress
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Records:</span>
                <span className="font-medium text-slate-900">
                  {uploadProgress.total}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Completed:</span>
                <span className="font-medium text-green-700">
                  {uploadProgress.completed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Failed:</span>
                <span className="font-medium text-red-700">
                  {uploadProgress.failed}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((uploadProgress.completed + uploadProgress.failed) /
                      uploadProgress.total) *
                      100
                      }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && preview.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Attendance Preview
                  </h3>
                  <p className="text-sm text-slate-500">
                    Review and verify data before importing
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Total Sheets: {[...new Set(preview.map(p => p.sheetName))].length}</span>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sheet Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              {[...new Set(preview.map((p) => p.sheetName))].map((sheet) => (
                <button
                  key={sheet}
                  onClick={() => setActiveSheet(sheet)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeSheet === sheet
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {sheet}
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${activeSheet === sheet ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {preview.filter(p => p.sheetName === sheet).length}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeSheet && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-6 bg-slate-500 rounded-full"></div>
                      <h4 className="font-bold text-slate-800">
                        Sheet Content: <span className="text-blue-600">{activeSheet}</span>
                      </h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-white border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Emp Code
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Check In
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Check Out
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Hours
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase bg-slate-50">
                            Day Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {preview
                          .filter((p) => p.sheetName === activeSheet)
                          .map((record, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900 border-l-4 border-l-transparent hover:border-l-blue-400">
                                {record.employeeCode}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {record.employeeName || "Not Found"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {new Date(record.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${record.status === "Present"
                                    ? "bg-green-100 text-green-700"
                                    : record.status === "Absent"
                                      ? "bg-red-100 text-red-700"
                                      : record.status === "Weekend"
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                  {record.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                {record.checkIn
                                  ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  })
                                  : "--:--"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                {record.checkOut
                                  ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  })
                                  : "--:--"}
                              </td>
                              <td className="px-4 py-3 text-sm font-bold text-slate-700">
                                {record.workedHours > 0 ? (
                                  <span className={record.workedHours < 8 ? "text-orange-600" : "text-green-600"}>
                                    {formatHours(record.workedHours)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${record.dayType === "Half"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    }`}
                                >
                                  {record.dayType}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                      Showing records from sheet: <span className="font-semibold text-slate-700">{activeSheet}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 text-slate-600 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all font-medium hover:"
              >
                Cancel Import
              </button>
              <button
                onClick={handleUpload}
                disabled={processing}
                className="inline-flex items-center gap-2 px-8 py-2.5 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl font-bold transition-all hover: transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {processing ? "Uploading Records..." : "Confirm & Import Data"}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">
                  Upload Successful!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Successfully uploaded {uploadProgress.completed} attendance
                  records
                  {uploadProgress.failed > 0 &&
                    ` (${uploadProgress.failed} failed)`}
                  . Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">
                  Errors Found ({errors.length})
                </h3>
                <div className="max-h-60 overflow-y-auto">
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}