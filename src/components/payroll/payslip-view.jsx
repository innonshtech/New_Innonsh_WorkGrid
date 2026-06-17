"use client";
import { useState, useEffect } from "react";
import {
  Download,
  ArrowLeft,
  Printer,
  FileText,
  Calendar,
  User,
  CreditCard,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  IdCard,
  Receipt,
  Loader2,
  Briefcase,
  Coffee,
  Sun,
  PieChart,
} from "lucide-react";
// import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import toast, { Toaster } from "react-hot-toast";
export default function PayslipView({ payslipId }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (payslipId) {
      fetchPayslip();
    }
  }, [payslipId]);

  const fetchPayslip = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/payslip/${payslipId}`);
      if (response.ok) {
        const payslipData = await response.json();
        setPayslip(payslipData);
      } else {
        toast.error("Failed to load payslip data");
      }
    } catch (error) {
      console.error("Error fetching payslip:", error);
      toast.error("Error loading payslip data");
    } finally {
      setLoading(false);
    }
  };



  // ================== FORMATTERS ==================
  const fmtInt = (v = 0) => Number(v || 0).toFixed(0);
  const fmtMoney = (v = 0) => Number(v || 0).toFixed(2);
  const fmtHours = (v = 0) => Number(v || 0).toFixed(1);

  const TEXT_FONT = "helvetica";
  const NUMBER_FONT = "courier";

  // ================== SINGLE PAYSLIP PDF ==================
  const handleDownloadPDF = async (payslip) => {
    const toastId = toast.loading("Generating payslip PDF...");

    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF("portrait", "mm", "a4");
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const PRIMARY = [30, 64, 175];
      const BORDER = [220, 220, 220];
      const TEXT = [30, 30, 30];
      const LIGHT_BG = [248, 249, 251];

      const employee = payslip.employee?.personalDetails || {};
      const job = payslip.employee?.jobDetails || {};
      const bank = payslip.employee?.salaryDetails?.bankAccount || {};

      const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();

      const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthName = payslip?.month ? MONTHS[payslip.month - 1] : "N/A";

      // ================= HEADER =================
      // Company Name
      doc.setFont(TEXT_FONT, "bold");
      doc.setFontSize(18);
      doc.setTextColor(...PRIMARY);
      doc.text(pursueString(payslip.organizationName || "Organization Name"), 14, 20);

      // Payslip Title
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text("PAYSLIP", W - 14, 20, { align: "right" });

      doc.setFont(TEXT_FONT, "normal");
      doc.setFontSize(10);
      doc.text(`${monthName} ${payslip.year}`, W - 14, 26, { align: "right" });

      doc.setDrawColor(...BORDER);
      doc.line(14, 32, W - 14, 32);

      // ================= INFO GRID =================
      const startY = 40;
      doc.setFontSize(9);
      doc.setTextColor(100);

      // Label Column 1
      doc.text("Employee Name", 14, startY);
      doc.text("Employee ID", 14, startY + 6);
      doc.text("Designation", 14, startY + 12);
      doc.text("Department", 14, startY + 18);

      // Value Column 1
      doc.setFont(TEXT_FONT, "bold");
      doc.setTextColor(...TEXT);
      doc.text(pursueString(fullName), 50, startY);
      doc.text(pursueString(payslip.employee?.employeeId), 50, startY + 6);
      doc.text(pursueString(job.designation), 50, startY + 12);
      doc.text(pursueString(job.department), 50, startY + 18);

      // Label Column 2
      doc.setFont(TEXT_FONT, "normal");
      doc.setTextColor(100);
      doc.text("Payslip ID", 110, startY);
      doc.text("Payment Date", 110, startY + 6);
      doc.text("Bank Name", 110, startY + 12);
      doc.text("Account No", 110, startY + 18);

      // Value Column 2
      doc.setFont(TEXT_FONT, "bold");
      doc.setTextColor(...TEXT);
      doc.text(pursueString(payslip.payslipId), 145, startY);
      doc.text(payslip.paymentDate ? formatDate(payslip.paymentDate) : "N/A", 145, startY + 6);
      doc.text(pursueString(bank.bankName), 145, startY + 12);
      doc.text(bank.accountNumber ? `••••${bank.accountNumber.slice(-4)}` : "N/A", 145, startY + 18);

      // ================= SALARY TABLE (EARNINGS vs DEDUCTIONS) =================
      // Construct rows: We need two lists, earnings and deductions.
      // We will merge them into a single list of rows for the table.

      const earningsList = [];
      const deductionsList = [];

      // Add Basic / Daily Rate
      if (payslip.salaryType === "perday") {
        earningsList.push({ name: "Daily Rate", amount: payslip.basicSalary });
        earningsList.push({ name: `Working Pay (${payslip.presentDays} days)`, amount: (payslip.basicSalary || 0) * (payslip.presentDays || 0) });
      } else {
        earningsList.push({ name: "Basic Salary", amount: payslip.basicSalary });
      }

      // Add other earnings
      (payslip.earnings || []).forEach(e => {
        earningsList.push({ name: e.type || e.name || "Allowance", amount: e.amount });
      });
      // Add Overtime
      if (payslip.overtimeAmount > 0) {
        earningsList.push({ name: `Overtime (${fmtHours(payslip.overtimeHours)} hrs)`, amount: payslip.overtimeAmount });
      }

      // Add Deductions
      (payslip.deductions || []).forEach(d => {
        deductionsList.push({ name: d.type || d.name || "Deduction", amount: d.amount });
      });

      // Normalize lengths
      const maxRows = Math.max(earningsList.length, deductionsList.length);
      const tableRows = [];

      for (let i = 0; i < maxRows; i++) {
        const earn = earningsList[i] || {};
        const ded = deductionsList[i] || {};
        tableRows.push([
          earn.name || "",
          earn.amount !== undefined ? fmtMoney(earn.amount) : "",
          ded.name || "",
          ded.amount !== undefined ? fmtMoney(ded.amount) : "",
        ]);
      }

      // Calculate accurate Total Earnings for PDF
      const pdfTotalEarnings = payslip.salaryType === "perday"
        ? ((payslip.basicSalary || 0) * (payslip.presentDays || 0)) + (payslip.overtimeAmount || 0)
        : (payslip.basicSalary || 0) + (payslip.earnings || []).reduce((sum, e) => sum + (e.amount || 0), 0) + (payslip.overtimeAmount || 0);

      // Calculate accurate Total Deductions for PDF (Sum of list)
      const pdfTotalDeductions = (payslip.deductions || []).reduce((sum, d) => sum + (d.amount || 0), 0);

      // Add Total Row
      tableRows.push([
        "Total Earnings",
        fmtMoney(pdfTotalEarnings),
        "Total Deductions",
        fmtMoney(pdfTotalDeductions),
      ]);


      autoTable(doc, {
        startY: startY + 30,
        head: [["EARNINGS", "AMOUNT (INR)", "DEDUCTIONS", "AMOUNT (INR)"]],
        body: tableRows,
        theme: "grid",
        styles: {
          font: TEXT_FONT,
          fontSize: 9,
          cellPadding: 5,
          lineColor: BORDER,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: PRIMARY,
          textColor: 255,
          fontStyle: "bold",
          halign: "left", // Default alignment
        },
        columnStyles: {
          0: { halign: "left", cellWidth: "auto" },
          1: { halign: "right", font: NUMBER_FONT, cellWidth: 35 },
          2: { halign: "left", cellWidth: "auto" },
          3: { halign: "right", font: NUMBER_FONT, cellWidth: 35 },
        },
        didParseCell: (data) => {
          // Bold the Total Row (last row)
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });

      // ================= ATTENDANCE SUMMARY =================
      const attendanceY = doc.lastAutoTable.finalY + 10;
      doc.setFont(TEXT_FONT, "bold");
      doc.setFontSize(10);
      doc.setTextColor(...PRIMARY);
      doc.text("ATTENDANCE SUMMARY", 14, attendanceY);

      autoTable(doc, {
        startY: attendanceY + 4,
        body: [
          [
            "Total Days", payslip.totalDays || 0,
            "Working Days", payslip.workingDays || 0,
            "Present Days", payslip.presentDays || 0,
            "Half Days", payslip.halfDays || 0
          ],
          [
            "Weekly Offs", payslip.weeklyOffs || 0,
            "Paid Leaves", payslip.paidLeaveDays || 0,
            "LWP / Unpaid", payslip.lopDays || payslip.unpaidLeaveDays || 0,
            "Holidays", payslip.holidays || 0
          ]
        ],
        theme: "grid",
        styles: { font: TEXT_FONT, fontSize: 8, cellPadding: 3, lineColor: BORDER, lineWidth: 0.1 },
        columnStyles: {
          0: { fontStyle: "bold", fillColor: LIGHT_BG, cellWidth: 25 },
          1: { halign: "center", cellWidth: 20 },
          2: { fontStyle: "bold", fillColor: LIGHT_BG, cellWidth: 25 },
          3: { halign: "center", cellWidth: 20 },
          4: { fontStyle: "bold", fillColor: LIGHT_BG, cellWidth: 25 },
          5: { halign: "center", cellWidth: 20 },
          6: { fontStyle: "bold", fillColor: LIGHT_BG, cellWidth: 25 },
          7: { halign: "center", cellWidth: 20 },
        }
      });

      // ================= NET PAY SECTION =================
      const finalY = doc.lastAutoTable.finalY + 10;

      // Box for Net Pay
      doc.setDrawColor(...PRIMARY);
      doc.setLineWidth(0.5);
      doc.rect(14, finalY, W - 28, 20);

      doc.setFont(TEXT_FONT, "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY);
      doc.text("NET SALARY PAYABLE", 20, finalY + 8);

      doc.setFontSize(14);
      doc.setTextColor(...TEXT);
      doc.text(`INR ${fmtMoney(payslip.netSalary)}`, W - 20, finalY + 8, { align: "right" });

      // Amount in words
      doc.setFont(TEXT_FONT, "italic");
      doc.setFontSize(9);
      doc.setTextColor(80);
      const amountWords = amountToWords(payslip.netSalary);
      doc.text(`( ${amountWords} )`, 20, finalY + 16);


      // ================= SIGNATURES =================
      const sigY = finalY + 45;

      doc.setFont(TEXT_FONT, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...TEXT);

      // Left Sig
      // doc.text("Employee Signature", 14, sigY + 5);
      // doc.line(14, sigY, 60, sigY);

      // Right Sig
      doc.text("Authorized Signatory", W - 60, sigY + 5);
      doc.text("HR Department", W - 60, sigY + 10);
      doc.line(W - 60, sigY, W - 14, sigY);

      // ================= FOOTER =================
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("This is a computer-generated document and does not require a physical signature.", W / 2, H - 10, { align: "center" });

      // Save
      doc.save(`Payslip_${fullName.replace(/\s+/g, "_")}_${monthName}_${payslip.year}.pdf`);
      toast.success("Payslip PDF downloaded successfully");

    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      toast.dismiss(toastId);
    }
  };

  // Helper safety check for strings
  const pursueString = (str) => (str ? String(str) : "N/A");


  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatCurrencyForPDF = (amount) => {
    return `INR ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)}`;
  };

  const formatDate = (date) => {
    return date
      ? new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "N/A";
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return months[(monthNumber || 1) - 1] || "Unknown";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: { color: "bg-slate-50 text-slate-700 border-slate-200", icon: Clock },
      Generated: { color: "bg-slate-50 text-blue-700 border-blue-200", icon: FileText },
      Approved: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
      Paid: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: CreditCard },
      Failed: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.Generated;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium border ${color}`}>
        <Icon className="w-4 h-4" />
        {status || "Unknown"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">Loading payslip...</span>
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payslip Not Found</h2>
          <p className="text-slate-600 mb-6">The requested payslip could not be found.</p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payslips
          </button>
        </div>
      </div>
    );
  }

  // Calculate accurate Total Earnings (Basic + Allowances + Overtime)
  const calculatedTotalEarnings = (payslip.basicSalary || 0) +
    (payslip.earnings || []).reduce((sum, e) => sum + (e.amount || 0), 0) +
    (payslip.overtimeAmount || 0);

  // If salary type is per day, basic salary is calculated differently in the list but the sum should be consistent
  const displayTotalEarnings = payslip.salaryType === "perday"
    ? ((payslip.basicSalary || 0) * (payslip.presentDays || 0)) + (payslip.overtimeAmount || 0)
    : calculatedTotalEarnings;

  const totalDeductions = payslip.totalDeductions || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Payslip</h1>
                  <p className="text-slate-600">{payslip.payslipId}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownloadPDF(payslip)}
                disabled={generatingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Payslip Document */}
        <div className="bg-white rounded-xl border border-slate-200 print:">
          {/* Document Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{payslip.organizationName || "Unknown Organization"}</h2>
                  </div>
                </div>
                <p className="text-slate-600 font-medium">
                  Payslip for {getMonthName(payslip.month)} {payslip.year}
                </p>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">
                    Payslip ID: <span className="font-medium">{payslip.payslipId}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Generated on: <span className="font-medium">{formatDate(payslip.createdAt)}</span>
                  </p>
                  {getStatusBadge(payslip.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Employee Information</h3>
                {payslip.employee && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 font-medium">
                        {payslip.employee.personalDetails?.firstName || "N/A"} {payslip.employee.personalDetails?.lastName || ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IdCard className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">ID: {payslip.employee.employeeId || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{payslip.employee.personalDetails?.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{payslip.employee.personalDetails?.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IdCard className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {payslip.employee.jobDetails?.department || "N/A"} - {payslip.employee.jobDetails?.designation || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      Payment Month: {getMonthName(payslip.month)} {payslip.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Payment Method: {payslip.paymentMethod || "Bank Transfer"}</span>
                  </div>
                  {payslip.paymentDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Payment Date: {formatDate(payslip.paymentDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Bank: {payslip.employee?.salaryDetails?.bankAccount?.bankName || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      Account: ••••{payslip.employee?.salaryDetails?.bankAccount?.accountNumber?.slice(-4) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Salary Breakdown</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">Earnings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">
                      {payslip.salaryType === "perday" ? "Daily Rate" : "Basic Salary"}
                    </span>
                    <span className="font-medium text-slate-900">{formatCurrency(payslip.basicSalary)}</span>
                  </div>
                  {payslip.salaryType === "perday" && (
                    <div className="flex justify-between items-center mt-1 pl-4 border-l-2 border-slate-100">
                      <span className="text-sm text-slate-500">
                        Working Pay ({payslip.presentDays} days)
                      </span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency((payslip.basicSalary || 0) * (payslip.presentDays || 0))}
                      </span>
                    </div>
                  )}
                  {payslip.earnings?.map((earning, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-600">{earning.type || "Unknown"}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(earning.amount)}</span>
                    </div>
                  ))}
                  {payslip.overtimeAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Overtime ({parseFloat(payslip.overtimeHours || 0).toFixed(1)} hours)</span>
                      <span className="font-medium text-slate-900">{formatCurrency(payslip.overtimeAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-300 pt-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">Total Earnings</span>
                      <span className="font-bold text-slate-800">{formatCurrency(displayTotalEarnings)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">Deductions</h4>
                <div className="space-y-2">
                  {payslip.deductions?.length ? (
                    payslip.deductions.map((deduction, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-slate-600">{deduction.type || "Unknown"}</span>
                        <span className="font-medium text-slate-900">-{formatCurrency(deduction.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">No Deductions</span>
                      <span className="font-medium text-slate-900">₹0</span>
                    </div>
                  )}
                  <div className="border-t border-slate-300 pt-2 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-800">Total Deductions</span>
                      <span className="font-bold text-slate-800">-{formatCurrency(
                        (payslip.deductions || []).reduce((sum, d) => sum + (d.amount || 0), 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-500" />
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Total Days */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-yellow-200 transition-colors">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Days</p>
                  <p className="text-xl font-black text-slate-900">{payslip.totalDays || 0}</p>
                </div>
              </div>

              {/* Working Days */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-blue-200 transition-colors">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Working Days</p>
                  <p className="text-xl font-black text-slate-900">{payslip.workingDays || 0}</p>
                </div>
              </div>

              {/* Present */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-green-200 transition-colors">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Present Days</p>
                  <p className="text-xl font-black text-green-600">{payslip.presentDays || 0}</p>
                </div>
              </div>

              {/* Half Days */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-amber-200 transition-colors">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Half Days</p>
                  <p className="text-xl font-black text-amber-600">{payslip.halfDays || 0}</p>
                </div>
              </div>

              {/* Weekly Offs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-indigo-200 transition-colors">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Weekly Offs</p>
                  <p className="text-xl font-black text-indigo-600">{payslip.weeklyOffs || 0}</p>
                </div>
              </div>

              {/* Holidays */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-orange-200 transition-colors">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Sun className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Holidays</p>
                  <p className="text-xl font-black text-orange-500">{payslip.holidays || 0}</p>
                </div>
              </div>

              {/* Paid Leaves */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-sky-200 transition-colors">
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Paid Leaves</p>
                  <p className="text-xl font-black text-sky-600">{payslip.paidLeaveDays || 0}</p>
                </div>
              </div>

              {/* LWP / Unpaid */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 hover:border-rose-200 transition-colors">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">LWP / Unpaid</p>
                  <p className="text-xl font-black text-rose-600">{payslip.lopDays || payslip.unpaidLeaveDays || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-6 border-b border-slate-200">
            <div className="bg-white border border-slate-200 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">Net Salary Payable</h4>
                  <p className="text-slate-600 text-sm">Amount transferred to bank account</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(payslip.netSalary)}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    <span className="font-medium">In words:</span> {amountToWords(payslip.netSalary)}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Footer */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Notes</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    {payslip.notes || "This is a computer-generated payslip and does not require signature."}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="text-center">
                  <div className="w-32 h-12 border-b border-slate-300 mb-2"></div>
                  <p className="text-sm font-semibold text-slate-900">Authorized Signatory</p>
                  <p className="text-xs text-slate-500">{payslip.organizationName || "Unknown"} HR Department</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function amountToWords(amount) {
  if (amount === 0) return "Zero Rupees";

  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanOneThousand(number) {
    let result = "";

    if (number >= 100) {
      result += units[Math.floor(number / 100)] + " Hundred ";
      number %= 100;
    }

    if (number >= 20) {
      result += tens[Math.floor(number / 10)] + " ";
      number %= 10;
    } else if (number >= 10) {
      result += teens[number - 10] + " ";
      number = 0;
    }

    if (number > 0) {
      result += units[number] + " ";
    }

    return result.trim();
  }

  let words = "";
  let num = Math.floor(amount || 0);

  if (num >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }

  if (num >= 100000) {
    words += convertLessThanOneThousand(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }

  if (num >= 1000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  if (num > 0) {
    words += convertLessThanOneThousand(num);
  }

  words = words.trim() + " Rupees";

  const paise = Math.round(((amount || 0) - Math.floor(amount || 0)) * 100);
  if (paise > 0) {
    words += " and " + convertLessThanOneThousand(paise) + " Paise";
  }

  return words;
}