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
  Zap
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { toast } from "react-hot-toast";
import { format } from "date-fns";
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const TabButton = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all duration-300 border-b-2 ${active
      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
    {label}
  </button>
);

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-3xl border border-slate-200 hover: transition-all duration-300 ${className}`}>
    {children}
  </div>
);

export default function MyPayslipPage() {
  const { user } = useSession();
  const { t } = useLanguage();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: "",
    status: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchPayslips();
    }
  }, [user, filters]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        employee: user.id,
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/v1/admin/payroll/payslip?${queryParams}`);
      const data = await response.json();
      if (response.ok) {
        setPayslips(data.payslips || []);
      }
    } catch (error) {
      toast.error(t("failedFetchSalary"));
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
    if (!latestPayslip) return null;
    return {
      labels: [t("takeHome"), t("deductions")],
      datasets: [{
        data: [latestPayslip.netSalary, latestPayslip.totalDeductions],
        backgroundColor: ['#4f46e5', '#f43f5e'],
        hoverOffset: 10,
        borderWidth: 0,
        spacing: 5,
        borderRadius: 10
      }]
    };
  }, [latestPayslip]);

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
        head: [['Payslip ID', 'Status']],
        body: [
          [slip.payslipId, slip.status]
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
      toast.success(t("payslipPdfDownloaded"));
    } catch (e) {
      console.error(e);
      toast.error(t("failedGeneratePdf"));
    }
  };

  const handleShareInfo = async (slip) => {
    if (!slip) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Payslip for ${getMonthName(slip.month)} ${slip.year}`,
          text: `Here is the payslip information for ${getMonthName(slip.month)} ${slip.year}. Net Salary: ${formatCurrency(slip.netSalary)}.`,
          url: window.location.href, // Or a specific link to the payslip if available
        });
        toast.success("Successfully shared payslip info.");
      } else {
        toast.error("Web Share API is not supported in your browser.");
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(`Payslip for ${getMonthName(slip.month)} ${slip.year}. Net Salary: ${formatCurrency(slip.netSalary)}.`);
        toast.success("Info copied to clipboard instead.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading && payslips.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400/20 rounded-full -ml-40 -mb-40 blur-3xl"></div>

            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  {t("latestPayoutReceived")}
                </span>
                <h1 className="text-5xl font-black tracking-tighter mt-6">
                  {latestPayslip ? formatCurrency(latestPayslip.netSalary) : '₹0'}
                </h1>
                <p className="text-indigo-100 mt-2 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t("for")} {latestPayslip ? `${getMonthName(latestPayslip.month)} ${latestPayslip.year}` : t("notAvailable")}
                </p>
              </div>

              <div className="mt-12 flex flex-wrap gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">{t("yearToDateNet")}</p>
                  <p className="text-2xl font-black">{formatCurrency(stats.totalNet)}</p>
                </div>
                <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">{t("totalDeductions")}</p>
                  <p className="text-2xl font-black text-rose-300">{formatCurrency(stats.totalDeductions)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Analysis Widget */}
          <Card className="p-8 border-none bg-white flex flex-col items-center justify-center text-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{t("salaryBreakdown")}</h3>
            <div className="w-full h-48 flex items-center justify-center relative">
              {doughnutData ? (
                <>
                  <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t("gross")}</p>
                    <p className="text-lg font-black text-slate-900 leading-none">
                      {latestPayslip ? (latestPayslip.netSalary / latestPayslip.grossSalary * 100).toFixed(0) : 0}%
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <PieChart className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-medium">{t("noDataAvailable")}</p>
                </div>
              )}
            </div>
            <div className="w-full mt-6 grid grid-cols-2 gap-4">
              <div className="text-left p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("earnings")}</p>
                <p className="text-xs font-black text-slate-900">{latestPayslip ? formatCurrency(latestPayslip.grossSalary) : '₹0'}</p>
              </div>
              <div className="text-left p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("taxDed")}</p>
                <p className="text-xs font-black text-rose-500">{latestPayslip ? formatCurrency(latestPayslip.totalDeductions) : '₹0'}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard Navigation */}
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden mb-8">
          <nav className="flex px-4 overflow-x-auto no-scrollbar">
            <TabButton
              active={activeTab === "overview"}
              label={t("overview")}
              icon={LayoutDashboard}
              onClick={() => setActiveTab("overview")}
            />
            <TabButton
              active={activeTab === "history"}
              label={t("payHistory")}
              icon={Clock}
              onClick={() => setActiveTab("history")}
            />
            <TabButton
              active={activeTab === "analytics"}
              label={t("salaryTrends")}
              icon={BarChart3}
              onClick={() => setActiveTab("analytics")}
            />
          </nav>
        </div>

        {/* Tab: Overview / Recent Payslips */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("recentPayouts")}</h2>
              <button onClick={() => setActiveTab("history")} className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all">
                {t("viewSelection")} <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {payslips.slice(0, 3).map((ps, i) => (
                <Card key={i} className="group p-8 border-none hover: hover: transition-all transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                      <Wallet className="w-7 h-7" />
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ps.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                      {ps.status === 'Paid' ? t("paid") : t("pending")}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1">{latestPayslip ? `${getMonthName(ps.month)} ${ps.year}` : t("notAvailable")}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">{t("netTakeHome")}</p>

                  <p className="text-3xl font-black text-slate-900 tracking-tighter mb-8">
                    {formatCurrency(ps.netSalary)}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleViewDetails(ps)}
                      className="py-3 px-4 bg-slate-50 text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> {t("viewDetail")}
                    </button>
                    <button onClick={() => handleDownloadPDF(ps)} className="py-3 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
                      <DownloadCloud className="w-4 h-4" /> {t("download")}
                    </button>
                  </div>
                </Card>
              ))}
              {payslips.length === 0 && (
                <Card className="col-span-full p-20 text-center flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{t("noPayslipsFound")}</h3>
                  <p className="text-slate-400 mt-2 max-w-xs mx-auto">{t("noPayslipsDesc")}</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab: History List */}
        {activeTab === "history" && (
          <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-none">
            <div className="p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("earningsHistory")}</h2>
                <p className="text-sm text-slate-500 mt-1">{t("foundSalaryRecords", { count: payslips.length })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
                  >
                    {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("payPeriod")}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("grossPay")}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("reductions")}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("netPayout")}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("status")}</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t("action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payslips.map((ps, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-all duration-300">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white border border-slate-200 rounded-2xl group-hover:border-indigo-200 group-hover:scale-110 transition-all duration-500">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{getMonthName(ps.month)} {ps.year}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">FY {ps.year}-{((ps.year + 1) % 100).toString().padStart(2, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 font-bold text-slate-700">{formatCurrency(ps.grossSalary)}</td>
                      <td className="p-6 font-bold text-rose-500">-{formatCurrency(ps.totalDeductions)}</td>
                      <td className="p-6">
                        <span className="text-base font-black text-slate-900">{formatCurrency(ps.netSalary)}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${ps.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                          {ps.status === 'Paid' ? t("paid") : t("pending")}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleViewDetails(ps)} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadPDF(ps)} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all">
                            <DownloadCloud className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab: Analytics */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-10">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                {t("salaryGrowthTrend")}
              </h3>
              <div className="h-[350px]">
                <Bar
                  data={{
                    labels: payslips.map(ps => getMonthName(ps.month)).reverse(),
                    datasets: [{
                      label: t("netSalary"),
                      data: payslips.map(ps => ps.netSalary).reverse(),
                      backgroundColor: 'rgba(79, 70, 229, 0.4)',
                      borderColor: 'rgb(79, 70, 229)',
                      borderWidth: 3,
                      borderRadius: 12,
                      barThickness: 24,
                    }]
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                />
              </div>
            </Card>
            <Card className="p-10 bg-gradient-to-br from-slate-900 to-indigo-950 text-white border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-amber-400" />
                {t("yearlyProjection")}
              </h3>
              <div className="space-y-8 relative z-10">
                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">{t("projectedAnnualNet")}</p>
                  <h4 className="text-4xl font-black">₹{(stats.totalNet / (payslips.length || 1) * 12).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h4>
                  <p className="text-xs text-indigo-200/60 mt-2 font-medium">{t("basedOnAverage")} {formatCurrency(stats.totalNet / (payslips.length || 1))}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">{t("taxEstimated")}</p>
                    <p className="text-xl font-bold">10-15%</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">{t("nextPayout")}</p>
                    <p className="text-xl font-bold">{t("expected")}</p>
                  </div>
                </div>

                <div className="p-6 bg-amber-400/10 rounded-[2rem] border border-amber-400/20 flex items-start gap-4">
                  <div className="p-3 bg-amber-400 rounded-2xl flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-indigo-900" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-100">Growth Insight</p>
                    <p className="text-xs text-amber-100/60 mt-1 leading-relaxed">Your salary has remained consistent over the last {payslips.length} months. Ensure your investment declarations are up to date for maximum tax savings.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Premium Detail Modal */}
      {showModal && selectedPayslip && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-hidden">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Left Sidebar Info */}
            <div className="hidden md:flex md:w-80 bg-indigo-600 p-10 text-white flex-col justify-between">
              <div>
                <Shield className="w-12 h-12 text-white/50 mb-8" />
                <h3 className="text-3xl font-black leading-tight">Payslip <br />Breakdown</h3>
                <p className="text-indigo-100/60 mt-4 text-sm font-medium">Review your earnings and deductions in detail for this period.</p>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">{t("payPeriod")}</p>
                  <p className="text-lg font-black">{getMonthName(selectedPayslip.month)} {selectedPayslip.year}</p>
                </div>
                <div className="p-5 bg-white/10 rounded-[2rem] border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">{t("status")}</p>
                  <p className="text-lg font-black">{selectedPayslip.status === 'Paid' ? t("paid") : t("pending")}</p>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("payslipIdentity")}</p>
                  <h4 className="text-xl font-black text-slate-900">{selectedPayslip.payslipId}</h4>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-full transition-colors overflow-hidden">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                {/* Items Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" /> {t("earningsComponent")}
                    </h5>
                    <div className="space-y-2">
                      <BreakdownItem label={t("basicSalary")} value={selectedPayslip.basicSalary} />
                      {displayEarnings.map((e, idx) => (
                        <BreakdownItem key={idx} label={e.type} value={e.amount} />
                      ))}
                      <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900">{t("grossPay")}</span>
                        <span className="text-sm font-black text-emerald-600">{formatCurrency(selectedPayslip.grossSalary)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingDown className="w-3 h-3 text-rose-500" /> {t("deductionsComponent")}
                    </h5>
                    <div className="space-y-2">
                      {displayDeductions.map((d, idx) => (
                        <BreakdownItem key={idx} label={d.type} value={d.amount} isNegative />
                      ))}
                      {displayDeductions.length === 0 && <p className="text-xs text-slate-400 italic">{t("noDeductionsApplied")}</p>}
                      <div className="pt-4 mt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-900">{t("reductions")}</span>
                        <span className="text-sm font-black text-rose-500">{formatCurrency(selectedPayslip.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Payout Highlight */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">{t("finalNetPayout")}</p>
                  <h4 className="text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform duration-500">{formatCurrency(selectedPayslip.netSalary)}</h4>
                  <p className="text-xs text-slate-400 mt-4 max-w-md">{t("payoutCreditMsg", { date: format(new Date(), 'MMM dd, yyyy') })}</p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 flex gap-4">
                <button onClick={() => handleShareInfo(selectedPayslip)} className="flex-1 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-black text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" /> {t("shareInfo")}
                </button>
                <button onClick={() => handleDownloadPDF(selectedPayslip)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-[1.5rem] text-sm font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                  <DownloadCloud className="w-5 h-5" /> {t("downloadPdfReport")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CompactStat({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50'
  };
  return (
    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-black text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}

function BreakdownItem({ label, value, isNegative }) {
  return (
    <div className="flex justify-between items-center py-2 px-3 hover:bg-slate-50 rounded-xl transition-all">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className={`text-xs font-black ${isNegative ? 'text-rose-500' : 'text-slate-900'}`}>
        {isNegative ? '-' : ''}₹{value?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
      </span>
    </div>
  );
}