"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Download,
  Eye,
  Calendar,
  DollarSign,
  FileText,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  PieChart,
  BarChart3,
  LayoutDashboard,
  Wallet,
  DownloadCloud,
  ExternalLink,
  ChevronLeft,
  Clock,
  X,
  Info,
  Shield,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  Zap,
  Calculator,
  Plus,
  Minus,
  ArrowUpRight,
  HelpCircle,
  ArrowRightLeft
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, ChartTitle);

export default function EmployeePayslipView() {
  const { user } = useSession();
  const { t } = useLanguage();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    status: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchPayslips();
      fetchEmployee(user.id);
    }
  }, [user, filters]);

  const fetchEmployee = async (employeeId) => {
    try {
      const res = await fetch(`/api/v1/employee/payroll/employees/${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (error) {
      console.error("Failed to load employee data", error);
    }
  };

  const calcAmount = (item, basic) => {
    if (item.calculationType === 'fixed') return item.fixedAmount || 0;
    if (item.calculationType === 'percentage') return (basic * (item.percentage || 0)) / 100;
    return 0;
  };

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        employee: user.id,
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/v1/employee/payroll/payslip?${queryParams}`);
      const data = await response.json();
      if (response.ok) {
        setPayslips(data.payslips || []);
      }
    } catch (error) {
      toast.error(t("failedFetchSalary") || "Failed to fetch salary slips");
    } finally {
      setLoading(false);
    }
  };

  const latestPayslip = payslips[0] || null;

  const stats = useMemo(() => {
    const totalEarnings = payslips.reduce((acc, p) => acc + p.grossSalary, 0);
    const totalNet = payslips.reduce((acc, p) => acc + p.netSalary, 0);
    const totalDeductions = payslips.reduce((acc, p) => acc + p.totalDeductions, 0);
    return { totalEarnings, totalNet, totalDeductions };
  }, [payslips]);

  const doughnutData = useMemo(() => {
    if (latestPayslip) {
      return {
        labels: [t("takeHome") || "Net Take-Home", t("deductions") || "Deductions"],
        datasets: [{
          data: [latestPayslip.netSalary, latestPayslip.totalDeductions],
          backgroundColor: ['#6366f1', '#f43f5e'],
          hoverOffset: 12,
          borderWidth: 0,
          spacing: 6,
          borderRadius: 16
        }]
      };
    } else if (employee?.payslipStructure) {
      const ps = employee.payslipStructure;
      const totalDed = ps.deductions?.filter(d => d.enabled).reduce((sum, d) => sum + calcAmount(d, ps.basicSalary), 0) || 0;
      const net = (ps.grossSalary || 0) - totalDed;
      return {
        labels: [t("takeHome") || "Net Take-Home", t("deductions") || "Deductions"],
        datasets: [{
          data: [net, totalDed],
          backgroundColor: ['#6366f1', '#f43f5e'],
          hoverOffset: 12,
          borderWidth: 0,
          spacing: 6,
          borderRadius: 16
        }]
      };
    }
    return null;
  }, [latestPayslip, employee]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[month - 1];
  };

  const handleViewDetails = (ps) => {
    setSelectedPayslip(ps);
    setShowModal(true);
  };

  const displayEarnings = useMemo(() => {
    if (!selectedPayslip) return [];
    return (Array.isArray(selectedPayslip.earnings)
      ? selectedPayslip.earnings
      : Object.entries(selectedPayslip.earnings || {}).map(([type, amount]) => ({ type, amount: Number(amount) }))
    ).filter(e => e.type.toUpperCase() !== 'BASIC' && e.type.toUpperCase() !== 'BASIC SALARY');
  }, [selectedPayslip]);

  const displayDeductions = useMemo(() => {
    if (!selectedPayslip) return [];
    return Array.isArray(selectedPayslip.deductions)
      ? selectedPayslip.deductions
      : Object.entries(selectedPayslip.deductions || {}).map(([type, amount]) => ({ type, amount: Number(amount) }));
  }, [selectedPayslip]);

  const handleDownloadPDF = async (slip) => {
    try {
      const jsPDF = (await import("jspdf/dist/jspdf.es.min.js")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229);
      doc.text("PAYROLL SYSTEM", 105, 15, { align: "center" });

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text(`Payslip for ${getMonthName(slip.month)} ${slip.year}`, 105, 25, { align: "center" });

      // Info Table
      autoTable(doc, {
        startY: 35,
        head: [['Payslip ID', 'Status', 'Working Days', 'Present']],
        body: [
          [slip.payslipId, slip.status, slip.workingDays || '-', slip.presentDays || '-']
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Breakdown Table preparation
      const normEarnings = Array.isArray(slip.earnings)
        ? slip.earnings
        : Object.entries(slip.earnings || {}).map(([type, amount]) => ({ type, amount: Number(amount) }));

      const normDeductions = Array.isArray(slip.deductions)
        ? slip.deductions
        : Object.entries(slip.deductions || {}).map(([type, amount]) => ({ type, amount: Number(amount) }));

      const formattedEarnings = normEarnings.map(e => ({
        type: e.type.toUpperCase() === 'BASIC' ? 'Basic Salary' : e.type,
        amount: e.amount
      }));

      if (!formattedEarnings.some(e => e.type === 'Basic Salary')) {
        formattedEarnings.unshift({ type: 'Basic Salary', amount: slip.basicSalary });
      }

      const rows = [];
      const len = Math.max(formattedEarnings.length, normDeductions.length);

      for (let i = 0; i < len; i++) {
        rows.push([
          formattedEarnings[i]?.type || '',
          formattedEarnings[i]?.amount ? `Rs. ${formattedEarnings[i].amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}` : '',
          normDeductions[i]?.type || '',
          normDeductions[i]?.amount ? `Rs. ${normDeductions[i].amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}` : ''
        ]);
      }

      // Totals
      rows.push(['Gross Salary', `Rs. ${slip.grossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 'Total Reductions', `Rs. ${slip.totalDeductions?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 1: { fontStyle: 'bold' }, 3: { fontStyle: 'bold', textColor: [225, 29, 72] } }
      });

      // Net Pay
      const finalY = doc.lastAutoTable.finalY + 15;
      doc.setFillColor(240, 253, 244);
      doc.rect(14, finalY, 182, 15, 'F');
      doc.setFontSize(12);
      doc.setTextColor(21, 128, 61);
      doc.setFont("helvetica", "bold");
      doc.text(`Net Payable: Rs. ${slip.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 105, finalY + 10, { align: "center" });
      doc.save(`Payslip_${slip.payslipId}.pdf`);
      toast.success(t("payslipPdfDownloaded") || "PDF downloaded successfully");
    } catch (e) {
      console.error(e);
      toast.error(t("failedGeneratePdf") || "Failed to generate PDF");
    }
  };

  const handleShareInfo = async (slip) => {
    if (!slip) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Payslip for ${getMonthName(slip.month)} ${slip.year}`,
          text: `Here is the payslip information for ${getMonthName(slip.month)} ${slip.year}. Net Salary: ${formatCurrency(slip.netSalary)}.`,
          url: window.location.href,
        });
        toast.success("Successfully shared payslip info.");
      } else {
        navigator.clipboard.writeText(`Payslip for ${getMonthName(slip.month)} ${slip.year}. Net Salary: ${formatCurrency(slip.netSalary)}.`);
        toast.success("Info copied to clipboard successfully!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading && payslips.length === 0) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
        <LoaderSpinner />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading salary database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] pb-16">
      <Toaster position="top-right" richColors closeButton />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">


        {/* Tab Navigation Menu */}
        <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-3xl border border-slate-200/60 max-w-fit no-scrollbar">
          {[
            { id: "overview", label: t("overview") || "Structure & Recent", icon: LayoutDashboard },
            { id: "history", label: t("payHistory") || "Pay History", icon: Clock },
            { id: "analytics", label: t("salaryTrends") || "Trends & Analytics", icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview & Structure */}
        {activeTab === "overview" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {employee?.payslipStructure && (employee.payslipStructure.basicSalary || employee.payslipStructure.grossSalary) && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Current Salary Structure</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Standard baseline structure defined by the organization.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Basic Salary</p>
                    <p className="text-2xl font-black text-slate-900">₹{(employee.payslipStructure.basicSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                  <div className="w-px h-12 bg-slate-200 hidden md:block" />
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calculated Gross Salary</p>
                    <p className="text-2xl font-black text-emerald-600">₹{(employee.payslipStructure.grossSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                  {/* Earnings structure */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">Monthly Earnings Breakdown</h4>
                    </div>

                    {employee.payslipStructure.earnings && employee.payslipStructure.earnings.filter(e => e.enabled).length > 0 ? (
                      <div className="space-y-3">
                        {employee.payslipStructure.earnings.filter(e => e.enabled).map((earning, i) => (
                          <div key={i} className="flex justify-between items-center py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
                            <span className="text-xs text-slate-600 font-bold">{earning.name}</span>
                            <span className="text-xs font-black text-emerald-600">+₹{calcAmount(earning, employee.payslipStructure.basicSalary).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium p-3 bg-slate-50 rounded-2xl">No additional custom earnings defined.</p>
                    )}
                  </div>

                  {/* Deductions structure */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                        <Minus className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">Tax & Monthly Deductions</h4>
                    </div>

                    {employee.payslipStructure.deductions && employee.payslipStructure.deductions.filter(d => d.enabled).length > 0 ? (
                      <div className="space-y-3">
                        {employee.payslipStructure.deductions.filter(d => d.enabled).map((deduction, i) => (
                          <div key={i} className="flex justify-between items-center py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
                            <span className="text-xs text-slate-600 font-bold">{deduction.name}</span>
                            <span className="text-xs font-black text-rose-600">-₹{calcAmount(deduction, employee.payslipStructure.basicSalary).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic font-medium p-3 bg-slate-50 rounded-2xl">No deductions configured in structure.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Payouts */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t("recentPayouts") || "Recent Payouts"}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Quick access to the last three payouts.</p>
                </div>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-xs font-black uppercase text-indigo-600 flex items-center gap-1.5 hover:gap-2.5 transition-all tracking-wider"
                >
                  {t("viewSelection") || "Full History"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {payslips.slice(0, 3).map((ps, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/60 flex flex-col justify-between hover: transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ps.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {ps.status === 'Paid' ? t("paid") || "Paid" : t("pending") || "Pending"}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900 leading-none">{getMonthName(ps.month)} {ps.year}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{t("netTakeHome") || "Net Salary"}</p>
                      <p className="text-2xl font-black text-slate-950 mt-1">{formatCurrency(ps.netSalary)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-8">
                      <button
                        onClick={() => handleViewDetails(ps)}
                        className="py-3 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("viewDetail") || "View"}
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(ps)}
                        className="py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                      >
                        <DownloadCloud className="w-3.5 h-3.5" />
                        {t("download") || "PDF"}
                      </button>
                    </div>
                  </div>
                ))}

                {payslips.length === 0 && (
                  <div className="col-span-3 bg-white rounded-3xl p-16 border border-slate-200/60 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Shield className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900">{t("noPayslipsFound") || "No Payslips Found"}</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs">{t("noPayslipsDesc") || "Salary slips will appear here once processed by human resources."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pay History Logs */}
        {activeTab === "history" && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{t("earningsHistory") || "Earnings History Log"}</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">{t("foundSalaryRecords", { count: payslips.length }) || `Found ${payslips.length} salary records`}</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                  className="bg-transparent border-none text-xs font-black uppercase text-slate-800 tracking-wider outline-none cursor-pointer focus:ring-0"
                >
                  {[2026, 2025, 2024].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("payPeriod") || "Period"}</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("grossPay") || "Gross"}</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("reductions") || "Deductions"}</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("netPayout") || "Net Payable"}</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("status") || "Status"}</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t("action") || "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map((ps, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all duration-300">
                            <span className="text-[8px] font-black uppercase text-indigo-500 leading-none">{getMonthName(ps.month)}</span>
                            <span className="text-[10px] font-black text-slate-800 mt-0.5 leading-none">{ps.year}</span>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none">{getMonthName(ps.month)} {ps.year}</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">FY {ps.year}-{((ps.year + 1) % 100).toString().padStart(2, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-bold text-slate-700 text-sm">{formatCurrency(ps.grossSalary)}</td>
                      <td className="p-5 font-bold text-rose-500 text-sm">-{formatCurrency(ps.totalDeductions)}</td>
                      <td className="p-5 font-black text-slate-950 text-sm">{formatCurrency(ps.netSalary)}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          ps.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {ps.status === 'Paid' ? t("paid") || "Paid" : t("pending") || "Pending"}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleViewDetails(ps)}
                            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-800 active:scale-95"
                            title="View Slip Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(ps)}
                            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 active:scale-95"
                            title="Download PDF Copy"
                          >
                            <DownloadCloud className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {payslips.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-16 text-center text-slate-400 italic text-xs font-semibold">
                        No historical payroll records logged for {filters.year}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Trends & Projections */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* Bar chart */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  {t("salaryGrowthTrend") || "Salary Trends Log"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Monthly payout comparisons.</p>
              </div>

              <div className="h-[320px] w-full flex items-center justify-center">
                {payslips.length > 0 ? (
                  <Bar
                    data={{
                      labels: payslips.map(ps => getMonthName(ps.month)).reverse(),
                      datasets: [{
                        label: t("netSalary") || "Net Salary",
                        data: payslips.map(ps => ps.netSalary).reverse(),
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: '#6366f1',
                        borderWidth: 2,
                        borderRadius: 10,
                        barThickness: 24,
                      }]
                    }}
                    options={{
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          grid: { color: "#f1f5f9" },
                          ticks: { font: { size: 10, weight: "bold" }, color: "#94a3b8" }
                        },
                        x: {
                          grid: { display: false },
                          ticks: { font: { size: 10, weight: "bold" }, color: "#94a3b8" }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <BarChart3 className="w-12 h-12 opacity-25" />
                    <p className="text-xs font-semibold">Insufficient logs to compute salary progression.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Projections Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 lg:p-10 text-white relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-indigo-300 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    {t("yearlyProjection") || "Projections & Analysis"}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">Estimated tax compliance and income forecasts.</p>
                </div>

                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1.5">{t("projectedAnnualNet") || "Projected Net Annual Pay"}</p>
                  <h4 className="text-3xl font-black">{formatCurrency(stats.totalNet / (payslips.length || 1) * 12)}</h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Calculated based on average monthly take-home of {formatCurrency(stats.totalNet / (payslips.length || 1))}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{t("taxEstimated") || "Estimated Tax"}</p>
                    <p className="text-sm font-black text-slate-100">10% - 15%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{t("nextPayout") || "Next Cycle"}</p>
                    <p className="text-sm font-black text-emerald-400">Regular Cycle</p>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Financial Strategy Tip</p>
                    <p className="text-[11px] text-amber-200/80 leading-relaxed">Submit your investment tax declaration declarations early to ensure minimal tax deduction at source (TDS) on future cycles.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-side Details Modal */}
      {showModal && selectedPayslip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-hidden animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Dark Sidebar Section */}
            <div className="md:w-80 bg-gradient-to-br from-slate-900 to-indigo-950 p-8 lg:p-10 text-white flex flex-col justify-between shrink-0 relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-6 relative z-10">
                <Shield className="w-10 h-10 text-indigo-400" />
                <h3 className="text-2xl font-black tracking-tight leading-tight">Payslip <br />Breakdown</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">Verify your complete earnings breakdown and active deductions summary for this billing period.</p>
              </div>

              <div className="space-y-4 mt-8 relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pay Period</p>
                  <p className="text-sm font-black text-slate-100">{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    {selectedPayslip.status === 'Paid' ? t("paid") || "Paid" : t("pending") || "Pending"}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("payslipIdentity") || "Payslip ID"}</p>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">{selectedPayslip.payslipId}</h4>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 no-scrollbar">
                {/* Micro Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <CompactStatItem label={t("workingDays") || "Working"} value={selectedPayslip.workingDays} icon={Calendar} color="indigo" />
                  <CompactStatItem label={t("present") || "Present"} value={selectedPayslip.presentDays} icon={CheckCircle2} color="emerald" />
                  <CompactStatItem label={t("leave") || "Leaves"} value={selectedPayslip.leaveDays} icon={Briefcase} color="amber" />
                  <CompactStatItem label={t("lop") || "LOP"} value={selectedPayslip.lopDays} icon={AlertCircle} color="rose" />
                </div>

                {/* Earnings & Deductions details block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Earnings column */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      {t("earningsComponent") || "Earnings"}
                    </h5>
                    <div className="space-y-2">
                      <BreakdownLineItem label={t("basicSalary") || "Basic Salary"} value={selectedPayslip.basicSalary} />
                      {displayEarnings.map((e, idx) => (
                        <BreakdownLineItem key={idx} label={e.type} value={e.amount} />
                      ))}
                      <div className="pt-3 mt-3 border-t border-dashed border-slate-200 flex justify-between items-center font-black">
                        <span className="text-xs text-slate-900">{t("grossPay") || "Gross Total"}</span>
                        <span className="text-xs text-emerald-600">{formatCurrency(selectedPayslip.grossSalary)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions column */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                      {t("deductionsComponent") || "Deductions"}
                    </h5>
                    <div className="space-y-2">
                      {displayDeductions.map((d, idx) => (
                        <BreakdownLineItem key={idx} label={d.type} value={d.amount} isNegative />
                      ))}
                      {displayDeductions.length === 0 && (
                        <p className="text-[11px] text-slate-400 italic">{t("noDeductionsApplied") || "No Deductions Applied"}</p>
                      )}
                      <div className="pt-3 mt-3 border-t border-dashed border-slate-200 flex justify-between items-center font-black">
                        <span className="text-xs text-slate-900">{t("reductions") || "Deductions Total"}</span>
                        <span className="text-xs text-rose-500">{formatCurrency(selectedPayslip.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Payout Banner block */}
                <div className="bg-slate-900 rounded-3xl p-6 text-center text-white relative overflow-hidden">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">{t("finalNetPayout") || "Take Home Payable"}</p>
                  <h4 className="text-4xl font-black tracking-tight text-white">{formatCurrency(selectedPayslip.netSalary)}</h4>
                  <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                    {t("payoutCreditMsg", { date: format(new Date(), 'MMMM dd, yyyy') }) || "Net payable value successfully credited to your registered bank account."}
                  </p>
                </div>
              </div>

              {/* Modal buttons */}
              <div className="p-6 bg-slate-50 flex gap-4 shrink-0 border-t border-slate-100">
                <button
                  onClick={() => handleShareInfo(selectedPayslip)}
                  className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("shareInfo") || "Share info"}
                </button>
                <button
                  onClick={() => handleDownloadPDF(selectedPayslip)}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <DownloadCloud className="w-4.5 h-4.5" />
                  {t("downloadPdfReport") || "Download PDF Slip"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Micro components
function LoaderSpinner() {
  return (
    <div className="relative flex items-center justify-center w-12 h-12">
      <div className="absolute w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <Wallet className="w-5 h-5 text-indigo-600 animate-pulse" />
    </div>
  );
}

function CompactStatItem({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100/50',
    amber: 'text-amber-600 bg-amber-50 border-amber-100/50',
    rose: 'text-rose-600 bg-rose-50 border-rose-100/50'
  };

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
      <div className={`p-2 rounded-xl border ${colors[color]} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm font-black text-slate-900 leading-none mt-0.5">{value ?? "-"}</p>
      </div>
    </div>
  );
}

function BreakdownLineItem({ label, value, isNegative }) {
  return (
    <div className="flex justify-between items-center py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
      <span className="text-[11px] font-bold text-slate-600">{label}</span>
      <span className={`text-xs font-black ${isNegative ? 'text-rose-500' : 'text-slate-900'}`}>
        {isNegative ? '-' : ''}₹{value?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
      </span>
    </div>
  );
}
