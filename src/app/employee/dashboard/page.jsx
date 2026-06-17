"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    ShieldCheck,
    Calculator,
    Download,
    Eye,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    Search,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    PlusCircle,
    Info,
    Wallet,
    Percent,
    Trophy,
    Clock,
    CalendarDays,
    Building,
    History,
    FilePlus2,
    X,
    Users,
    Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import ESSLeaveManagement from "@/components/payroll/ess-leave-management";
import ESSTalentDashboard from "@/components/talent/ess-talent-dashboard";
import MyTasks from "@/components/tasks/my-tasks";
import { CheckSquare } from "lucide-react";

/* ═══ Premium Tab Button ═══ */
const TabButton = ({ active, label, icon: Icon, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group relative flex items-center gap-2 px-3.5 py-2 transition-all duration-200 rounded-lg whitespace-nowrap font-['Google_Sans','Product_Sans',sans-serif] font-medium text-[10px] sm:text-[12px] tracking-tight ${active
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            : 'bg-transparent text-[#667085] hover:bg-[#F5F8FF] hover:text-blue-600'
            }`}
    >
        <div className={`flex items-center justify-center p-1 rounded-md transition-colors duration-200 ${active ? 'bg-white text-blue-600' : 'text-[#667085] group-hover:text-blue-600'
            }`}>
            <Icon className="w-3.5 h-3.5" />
        </div>
        {label}
    </button>
);

/* ─── Glass Card ─── */
const Card = ({ children, className = "" }) => (
    <div className={`bg-white/80 backdrop-blur-xl rounded-[1.5rem] border border-white/  transition-all duration-500 ${className}`}>
        {children}
    </div>
);

/* ─── Premium Stat Card ─── */
const StatCard = ({ title, value, sub, icon: Icon, color = "indigo" }) => {
    const configs = {
        indigo: { bg: "from-indigo-500/10 to-violet-500/10", icon: "bg-blue-100 text-blue-600", ring: "ring-blue-500/10" },
        emerald: { bg: "from-emerald-500/10 to-teal-500/10", icon: "bg-emerald-100 text-emerald-600", ring: "ring-emerald-500/10" },
        amber: { bg: "from-amber-500/10 to-orange-500/10", icon: "bg-amber-100 text-amber-600", ring: "ring-amber-500/10" },
    };
    const c = configs[color];
    return (
        <Card className={`p-7 bg-gradient-to-br ${c.bg} border-none ring-1 ${c.ring}`}>
            <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${c.icon}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h4>
                    <p className="text-3xl font-black text-slate-900 leading-tight mt-1">{value}</p>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{sub}</p>
                </div>
            </div>
        </Card>
    );
};

/* ─── Circular Progress Ring ─── */
const CircularProgress = ({ percent, size = 80, stroke = 6, color = "#6366f1" }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
            <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                className="transition-all duration-1000 ease-out" />
        </svg>
    );
};

function ESSDashboardContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const { user, loading: sessionLoading } = useSession();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(tabParam || "overview");

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);
    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState(null);
    const [payslips, setPayslips] = useState([]);
    const [investments, setInvestments] = useState(null);
    const [taskStats, setTaskStats] = useState({ total: 0, pending: 0 });
    const [payrollConfig, setPayrollConfig] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);

    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const defaultFY = (() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const fyStart = month >= 4 ? year : year - 1;
        return `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
    })();
    const [selectedFY, setSelectedFY] = useState(defaultFY);
    const [previewSlip, setPreviewSlip] = useState(null);
    const [userRoster, setUserRoster] = useState([]);
    const [otRequests, setOtRequests] = useState([]);
    const [coRequests, setCoRequests] = useState([]);
    const [coBalance, setCoBalance] = useState(0);

    // Timesheet States
    const [projects, setProjects] = useState([]);
    const [timesheet, setTimesheet] = useState(null);
    const [timesheetEntries, setTimesheetEntries] = useState([]);
    const [teamLeaves, setTeamLeaves] = useState([]);
    const [loadingTeamLeaves, setLoadingTeamLeaves] = useState(false);
    const [weekStartDate, setWeekStartDate] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [isSavingTimesheet, setIsSavingTimesheet] = useState(false);


    const fetchRequests = async (empId) => {
        try {
            if (!empId) return;
            const [otRes, coRes] = await Promise.all([
                fetch(`/api/v1/employee/payroll/overtime?employeeId=${empId}`),
                fetch(`/api/v1/employee/payroll/comp-off?employeeId=${empId}`)
            ]);
            if (otRes.ok && otRes.headers.get('content-type')?.includes('application/json')) {
                const otData = await otRes.json();
                if (otData.success) setOtRequests(otData.requests);
            }
            if (coRes.ok && coRes.headers.get('content-type')?.includes('application/json')) {
                const coData = await coRes.json();
                if (coData.success) {
                    setCoRequests(coData.requests);
                    setCoBalance(coData.balance);
                }
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    const fetchTeamAvailability = async () => {
        try {
            setLoadingTeamLeaves(true);
            const res = await fetch('/api/v1/employee/leaves/team-availability');
            if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
                const data = await res.json();
                if (data.success) setTeamLeaves(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching team leaves:", error);
        } finally {
            setLoadingTeamLeaves(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/v1/employee/tasks/projects?status=Active');
            if (res.ok) {
                const data = await res.json();
                if (data.success) setProjects(data.projects);
            }
        } catch (error) {
            console.error("Error fetching projects", error);
        }
    };

    const fetchTimesheet = async (empId, weekDate) => {
        try {
            const res = await fetch(`/api/v1/employee/tasks/timesheets?employeeId=${empId}&weekStartDate=${weekDate.toISOString()}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setTimesheet(data.timesheet);
                    setTimesheetEntries(data.entries || []);
                    return;
                }
            }
            setTimesheet(null);
            setTimesheetEntries([]);
        } catch (error) {
            console.error("Error fetching timesheet", error);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData(user.id);
            fetchUserRoster(user.id);
            fetchRequests(user.id);
            fetchProjects();
            fetchTimesheet(user.id, weekStartDate);
            fetchTeamAvailability();
        } else if (!sessionLoading && !user) {
            setLoading(false);
        }
    }, [user, sessionLoading, weekStartDate]);



    const changeWeek = (offset) => {
        const newDate = new Date(weekStartDate);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setWeekStartDate(newDate);
    };

    const handleSaveTimesheet = async (isSubmit = false) => {
        setIsSavingTimesheet(true);
        try {
            const res = await fetch('/api/v1/employee/tasks/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee: user.id,
                    weekStartDate: weekStartDate.toISOString(),
                    entries: timesheetEntries,
                    status: isSubmit ? 'Submitted' : 'Draft'
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    toast.success(`Timesheet ${isSubmit ? 'Submitted' : 'Saved'}`);
                    fetchTimesheet(user.id, weekStartDate);
                } else {
                    toast.error(data.error || "Failed to save");
                }
            }
        } catch (error) {
            toast.error("Failed to save timesheet");
        } finally {
            setIsSavingTimesheet(false);
        }
    };

    const addTimesheetEntry = () => {
        setTimesheetEntries([...timesheetEntries, {
            project: '',
            task: '',
            date: new Date(weekStartDate).toISOString(),
            hours: 0,
            description: ''
        }]);
    };

    const updateTimesheetEntry = (index, field, value) => {
        const newEntries = [...timesheetEntries];
        newEntries[index][field] = value;
        setTimesheetEntries(newEntries);
    };

    const removeTimesheetEntry = (index) => {
        setTimesheetEntries(timesheetEntries.filter((_, i) => i !== index));
    };

    const fetchUserRoster = async (empId) => {
        try {
            const start = new Date().toISOString();
            const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            const res = await fetch(`/api/v1/employee/payroll/roster?employeeId=${empId}&startDate=${start}&endDate=${end}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) setUserRoster(data.roster || []);
            }
        } catch (error) {
            console.error("Failed to fetch roster", error);
        }
    };

    const handleDownload = (filename, content) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Downloaded ${filename}`);
    };

    const handleDownloadPDF = async (slip) => {
        try {
            const jsPDF = (await import("jspdf/dist/jspdf.es.min.js")).default;
            const autoTable = (await import("jspdf-autotable")).default;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.setTextColor(79, 70, 229);
            doc.text("PAYROLL SYSTEM", 105, 15, { align: "center" });

            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text(`Payslip for ${getMonthName(slip.month)} ${slip.year}`, 105, 25, { align: "center" });

            // Employee Info
            autoTable(doc, {
                startY: 35,
                head: [['Employee Details', '']],
                body: [
                    ['Name', `${employee?.personalDetails?.firstName || ''} ${employee?.personalDetails?.lastName || ''}`],
                    ['Employee ID', employee?.employeeId || 'N/A'],
                    ['Designation', employee?.jobDetails?.designation || 'N/A'],
                    ['PAN', employee?.salaryDetails?.panNumber || 'N/A']
                ],
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
            });

            // Salary Breakdown
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 10,
                head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
                body: [
                    ['Basic Salary', `Rs. ${slip.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 'Tax Deducted (TDS)', `Rs. ${slip.taxDeduction?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || 0}`],
                    ['Allowances', `Rs. ${((slip.grossSalary || 0) - (slip.basicSalary || 0))?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, '', ''],
                    ['Gross Earnings', `Rs. ${slip.grossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 'Total Deductions', `Rs. ${slip.taxDeduction?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || 0}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });

            // Net Pay
            const finalY = doc.lastAutoTable.finalY + 15;
            doc.setFillColor(240, 253, 244);
            doc.rect(14, finalY, 182, 15, 'F');
            doc.setFontSize(12);
            doc.setTextColor(21, 128, 61);
            doc.setFont("helvetica", "bold");
            doc.text(`Net Payable: Rs. ${slip.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}`, 105, finalY + 10, { align: "center" });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont("helvetica", "normal");
            doc.text("** This is a computer generated payslip and does not require a signature **", 105, finalY + 30, { align: "center" });

            doc.save(`Payslip_${slip.month}_${slip.year}.pdf`);
            toast.success("Payslip PDF Downloaded");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    const fetchDashboardData = async (employeeId) => {
        try {
            setLoading(true);
            const [empRes, slipsRes, invRes] = await Promise.all([
                fetch(`/api/v1/employee/payroll/employees/${employeeId}`),
                fetch(`/api/v1/employee/payroll/payslip?employeeId=${employeeId}`),
                fetch(`/api/v1/employee/payroll/investments?employeeId=${employeeId}&financialYear=2025-26`)
            ]);

            let empData = null;
            if (empRes.ok && empRes.headers.get('content-type')?.includes('application/json')) {
                empData = await empRes.json();
                setEmployee(empData);
            }
            if (slipsRes.ok && slipsRes.headers.get('content-type')?.includes('application/json')) {
                const slipsData = await slipsRes.json();
                setPayslips(slipsData.payslips || []);
            }
            if (invRes.ok && invRes.headers.get('content-type')?.includes('application/json')) {
                const invData = await invRes.json();
                setInvestments(invData);
            }

            // Fetch tasks to get count
            const taskRes = await fetch('/api/v1/employee/tasks');
            if (taskRes.ok) {
                const taskData = await taskRes.json();
                if (taskData.success) {
                    const tasks = taskData.data || [];
                    setTaskStats({
                        total: tasks.length,
                        pending: tasks.filter(t => t.status !== 'Completed').length
                    });
                }
            }

            // Fetch Payroll settings using organizationId from employee details or user session
            const orgId = user?.organizationId || empData?.jobDetails?.organizationId;
            if (orgId) {
                const settingsRes = await fetch(`/api/v1/employee/payroll/settings?orgId=${orgId}`);
                if (settingsRes.ok && settingsRes.headers.get('content-type')?.includes('application/json')) {
                    const settingsData = await settingsRes.json();
                    setPayrollConfig(settingsData);
                }
            }

            // Fetch Attendance data for the current month
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
            const attendanceRes = await fetch(`/api/v1/employee/payroll/attendance?employeeId=${employeeId}&startDate=${firstDay}&endDate=${lastDay}`);
            if (attendanceRes.ok && attendanceRes.headers.get('content-type')?.includes('application/json')) {
                const attData = await attendanceRes.json();
                if (attData.success) {
                    setAttendanceList(attData.attendance || []);
                }
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const [form80C, setForm80C] = useState({ ppf: 0, elss: 0, lic: 0, others: 0 });
    const [form80D, setForm80D] = useState({ mediclaimSelf: 0 });
    const [hraData, setHraData] = useState({ annualRent: 0, landlordPan: '' });

    useEffect(() => {
        if (investments?.sections) {
            setForm80C(investments.sections.section80C || { ppf: 0, elss: 0, lic: 0, others: 0 });
            setForm80D(investments.sections.section80D || { mediclaimSelf: 0 });
            setHraData(investments.sections.hra || { annualRent: 0, landlordPan: '' });
        }
    }, [investments]);

    if (loading || sessionLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const latestPayslip = payslips[0] || null;

    // Calculate Dynamic YTD metrics based on selectedFY
    const activeYearPayslips = payslips.filter(slip => {
        const fyStart = slip.month >= 4 ? slip.year : slip.year - 1;
        const fyString = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
        return fyString === selectedFY;
    });
    const totalYTDEarnings = activeYearPayslips.reduce((acc, p) => acc + (p.netSalary || 0), 0);
    const annualCTC = (employee?.payslipStructure?.totalEarnings || employee?.payslipStructure?.basicSalary || 0) * 12;
    const progressPercent = annualCTC > 0 ? Math.min(Math.round((totalYTDEarnings / annualCTC) * 100), 100) : 0;

    // Calculate dynamic Upcoming Payday and Countdown
    const nextPayday = (() => {
        const payDaySetting = payrollConfig?.paymentDay || 1;
        const today = new Date();
        let year = today.getFullYear();
        let month = today.getMonth();

        const getLastDay = (y, m) => new Date(y, m + 1, 0).getDate();

        let currentMonthPayday = Math.min(payDaySetting, getLastDay(year, month));
        let paydayDate = new Date(year, month, currentMonthPayday);
        paydayDate.setHours(0, 0, 0, 0);

        let todayZero = new Date(today);
        todayZero.setHours(0, 0, 0, 0);

        if (todayZero >= paydayDate) {
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
            let nextMonthPayday = Math.min(payDaySetting, getLastDay(year, month));
            paydayDate = new Date(year, month, nextMonthPayday);
        }
        return paydayDate;
    })();

    const daysRemaining = (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = nextPayday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    })();

    // Calculate month attendance/roster stats
    const presentDays = attendanceList.filter(a => a.status === 'Present').length;
    const absentDays = attendanceList.filter(a => a.status === 'Absent').length;
    const leaveDays = attendanceList.filter(a => a.status === 'Leave' || a.status === 'Half-day').length;
    const totalLoggedDays = attendanceList.filter(a => ['Present', 'Absent', 'Leave', 'Half-day'].includes(a.status)).length;
    const presentRatio = totalLoggedDays > 0 ? Math.round((presentDays / totalLoggedDays) * 100) : 0;

    // Construct dynamic Recent Payroll Events feed
    const dynamicEvents = (() => {
        const list = [];

        // 1. Payslips Events
        payslips.forEach(slip => {
            list.push({
                type: 'payslip',
                title: `${getMonthName(slip.month)} ${slip.year} Payslip Generated`,
                date: new Date(slip.paymentDate || slip.createdAt),
                data: slip,
                action: () => handleDownloadPDF(slip),
                badge: slip.status || 'Published'
            });
        });

        // 2. Investment Approvals
        if (investments && (investments.updatedAt || investments.createdAt)) {
            list.push({
                type: 'investment',
                title: `Tax Investment Declaration ${investments.status || 'Submitted'}`,
                date: new Date(investments.updatedAt || investments.createdAt),
                data: investments,
                badge: investments.status || 'Pending'
            });
        }

        return list.sort((a, b) => b.date - a.date).slice(0, 5);
    })();

    const handleSaveDeclaration = async (submit = false) => {
        try {
            const res = await fetch('/api/v1/employee/payroll/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: user?.id,
                    financialYear: "2025-26",
                    sections: {
                        section80C: form80C,
                        section80D: form80D,
                        hra: hraData
                    },
                    submit
                })
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success(submit ? "Declaration submitted for review!" : "Draft saved successfully");
            fetchDashboardData(user?.id);
        } catch (error) {
            toast.error(error.message);
        }
    };

    function getMonthName(monthNumber) {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', month: 'long' });
    }

    const safeFormatDate = (year, month) => {
        if (!year || !month) return 'N/A';
        try {
            const date = new Date(year, month - 1, 1);
            return format(date, 'MMM yyyy');
        } catch (e) {
            return 'N/A';
        }
    };

    const StatusBadge = ({ status, label }) => {
        const styles = {
            'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
            'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
            'Earn': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Use': 'bg-blue-50 text-indigo-700 border-indigo-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}>
                {label || status}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Standard Hero */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 mt-2">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            Employee Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 truncate">
                            Access your daily work summary, attendance insights, tasks, announcements and productivity metrics.
                        </p>
                    </div>
                </div>

                {/* ✨ Premium Tab Navigation ✨ */}
                <div className="bg-white rounded-2xl border border-[#E9EEF5] p-1.5">
                    <nav className="flex gap-1.5 px-1 overflow-x-auto no-scrollbar">
                        <TabButton active={activeTab === "overview"} label={t("overview")} icon={LayoutDashboard} onClick={() => setActiveTab("overview")} />
                        <TabButton active={activeTab === "payslips"} label={t("payslipsGallery")} icon={FileText} onClick={() => setActiveTab("payslips")} />
                        <TabButton active={activeTab === "tax"} label={t("taxAndInvestments")} icon={ShieldCheck} onClick={() => setActiveTab("tax")} />
                        <TabButton active={activeTab === "projection"} label={t("salaryProjection")} icon={Calculator} onClick={() => setActiveTab("projection")} />
                        <TabButton active={activeTab === "leaves"} label={t("myLeaves")} icon={Calendar} onClick={() => setActiveTab("leaves")} />
                        <TabButton active={activeTab === "talent"} label={t("talentMatrix")} icon={Trophy} onClick={() => setActiveTab("talent")} />
                        <TabButton active={activeTab === 'shifts'} onClick={() => setActiveTab('shifts')} icon={Clock} label={t("myShifts")} />
                        <TabButton active={activeTab === 'ot-coff'} onClick={() => setActiveTab('ot-coff')} icon={History} label={t("otAndCOff")} />
                        <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={CheckSquare} label={t("myTasks") || "My Tasks"} />
                    </nav>
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/*              OVERVIEW TAB                   */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* ─── Left Column ─── */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Summary Cards Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Latest Pay Card */}
                                <Card className="relative overflow-hidden p-7 sm:col-span-2 border border-slate-200">
                                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/50 rounded-full -ml-12 -mb-12 blur-2xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">{t("latestPay")}</span>
                                        </div>
                                        <h3 className="text-4xl font-black tracking-tight text-slate-900">₹{latestPayslip?.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || '0'}</h3>
                                        <p className="text-slate-500 text-sm font-medium mt-1">{t("disbursedFor")} {latestPayslip ? safeFormatDate(latestPayslip.year, latestPayslip.month) : 'N/A'}</p>
                                        <div className="mt-8 pt-5 border-t border-slate-100 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-semibold">{t("gross")}: ₹{latestPayslip?.grossSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || '0'}</span>
                                            <button type="button" onClick={() => setActiveTab("payslips")} className="flex items-center gap-1.5 font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-full transition-all hover:bg-blue-100">{t("viewBreakdown")} <ChevronRight className="w-3 h-3" /></button>
                                        </div>
                                    </div>
                                </Card>

                                {/* YTD Earnings Card */}
                                <Card className="p-7">
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="p-3 bg-emerald-50 rounded-2xl">
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t("totalYTDEarnings")}</span>
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="flex-1">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">₹{totalYTDEarnings.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h3>
                                            <p className="text-slate-500 text-sm font-medium mt-1">{t("forFinancialYear")} {selectedFY}</p>
                                        </div>
                                        <div className="relative">
                                            <CircularProgress percent={progressPercent} size={72} stroke={5} color="#10b981" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-black text-emerald-600">{progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Active Tasks Card */}
                                <Card className="p-7 cursor-pointer group hover:ring-2 hover:ring-indigo-200 transition-all" onClick={() => setActiveTab('tasks')}>
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="p-3 bg-rose-50 rounded-2xl group-hover: transition-">
                                            <CheckSquare className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{t("activeTasks")}</span>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900">{taskStats.pending}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{t("pendingTasks") || "Pending Tasks"}</p>
                                    <div className="mt-6 pt-5 border-t border-slate-100/80 flex justify-between items-center text-xs">
                                        <span className="text-slate-400 font-semibold">{t("totalTasks") || "Total"}: {taskStats.total}</span>
                                        <span className="flex items-center gap-1.5 text-blue-600 font-bold group-hover:gap-2.5 transition-all">{t("viewAll")} <ChevronRight className="w-3 h-3" /></span>
                                    </div>
                                </Card>
                            </div>

                            {/* Recent Payroll Events */}
                            <Card className="overflow-hidden">
                                <div className="p-6 border-b border-slate-100/80 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-xl">
                                            <History className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h3 className="font-black text-slate-900">{t("recentPayrollEvents")}</h3>
                                    </div>
                                    <button onClick={() => setShowPolicyModal(true)} className="text-xs text-blue-600 font-bold hover:underline px-3 py-1.5 bg-blue-50 rounded-full transition-colors hover:bg-blue-100">{t("checkPolicy")}</button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {dynamicEvents.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <History className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                                            <p className="text-sm font-bold">{t("noRecentEvents") || "No recent payroll events"}</p>
                                        </div>
                                    ) : (
                                        dynamicEvents.map((evt, idx) => (
                                            <div key={idx} className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-all duration-200 group">
                                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${evt.type === 'payslip'
                                                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600'
                                                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600'
                                                    }`}>
                                                    {evt.type === 'payslip' ? <FileText className="w-5 h-5" /> : <Percent className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{evt.title}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">{format(evt.date, 'MMMM dd, yyyy')}</p>
                                                </div>
                                                {evt.type === 'payslip' ? (
                                                    <button onClick={evt.action} className="p-2.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <div className={`px-3 py-1 text-[10px] font-black rounded-full tracking-wider ${evt.badge === 'Approved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : evt.badge === 'Rejected'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {evt.badge}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* ─── Right Column ─── */}
                        <div className="space-y-4">
                            {/* Payday Countdown */}
                            <Card className="p-7 bg-gradient-to-br from-indigo-50/80 via-violet-50/50 to-purple-50/30 border-indigo-100/50 relative overflow-hidden">
                                <div className="absolute -right-6 -bottom-6 opacity-[0.04]">
                                    <Wallet className="w-36 h-36 text-indigo-900" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-5">
                                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2.5">
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                                            </span>
                                            {t("nextPaydayCountdown") || "Next Payday"}
                                        </h4>
                                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <CircularProgress percent={Math.min(100, ((30 - daysRemaining) / 30) * 100)} size={80} stroke={6} color="#6366f1" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xl font-black text-indigo-900">{daysRemaining}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-blue-600">
                                                {daysRemaining === 1 ? t("dayRemaining") || "day left" : t("daysRemaining") || "days left"}
                                            </p>
                                            <p className="text-[11px] text-slate-500 font-medium mt-1">
                                                {t("expectedOn") || "Expected on"}: <span className="font-bold text-slate-700">{format(nextPayday, 'MMM dd, yyyy')}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Tax Tip Widget */}
                            <Card className="p-7 bg-gradient-to-br from-blue-50/60 to-sky-50/40">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <AlertTriangle className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-sm">{t("taxSeasonReminder")}</h4>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed mb-5">
                                    {t("taxSeasonReminderSub")}
                                </p>
                                <button
                                    onClick={() => setActiveTab("tax")}
                                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2"
                                >
                                    {t("uploadProofs")} <ArrowUpRight className="w-3 h-3" />
                                </button>
                            </Card>

                            {/* My Shifts / Schedule Widget */}
                            <Card className="p-7">
                                <div className="flex items-center justify-between mb-5">
                                    <h4 className="font-black text-slate-900 text-sm">
                                        {userRoster.length > 0 ? t("myUpcomingShifts") : t("standardSchedule")}
                                    </h4>
                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {userRoster.length > 0 ? (
                                        userRoster.slice(0, 3).map((r, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100/80 hover:bg-slate-50/50 transition-all group">
                                                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 text-[10px] font-bold border border-indigo-100/50">
                                                    <span className="text-indigo-400 leading-none">{format(new Date(r.date), 'MMM')}</span>
                                                    <span className="text-indigo-700 leading-none mt-0.5">{format(new Date(r.date), 'dd')}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-900">{r.shiftId?.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{r.shiftId?.startTime} - {r.shiftId?.endTime}</p>
                                                </div>
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.shiftId?.color || '#4f46e5' }} />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-5 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 rounded-2xl border border-indigo-100/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-slate-200/50">
                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{employee?.jobDetails?.defaultShift?.name || t("generalShift")}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">
                                                        {employee?.jobDetails?.defaultShift?.startTime || "09:00"} - {employee?.jobDetails?.defaultShift?.endTime || "18:00"}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-blue-600 font-semibold mt-3 bg-white/60 p-2 rounded-lg text-center">
                                                {employee?.jobDetails?.defaultShift ? t("defaultShiftAssigned") : t("standardWorkingHours")}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Attendance Stats */}
                                <div className="mt-6 pt-6 border-t border-slate-100/80 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h5 className="font-black text-slate-700 text-xs uppercase tracking-[0.1em]">
                                            {format(new Date(), 'MMMM')} Attendance
                                        </h5>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                            {totalLoggedDays} {totalLoggedDays === 1 ? 'Day' : 'Days'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-100/60 text-center">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Present</p>
                                            <p className="text-xl font-black text-emerald-700 mt-0.5">{presentDays}</p>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50/50 rounded-xl border border-rose-100/60 text-center">
                                            <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider">Absent</p>
                                            <p className="text-xl font-black text-rose-700 mt-0.5">{absentDays}</p>
                                        </div>
                                        <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-xl border border-amber-100/60 text-center">
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Leaves</p>
                                            <p className="text-xl font-black text-amber-700 mt-0.5">{leaveDays}</p>
                                        </div>
                                    </div>

                                    {/* Present Ratio */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                            <span>Present Ratio</span>
                                            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{presentRatio}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${presentRatio}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-slate-400 mt-5 text-center font-medium italic">{t("contactHRChangeRequest")}</p>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*              TASKS TAB                      */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === 'tasks' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <MyTasks />
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*           PAYSLIPS GALLERY TAB              */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "payslips" && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("historicPayslips")}</h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Download and preview your salary slips</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-1.5">
                                <select
                                    value={selectedFY}
                                    onChange={(e) => setSelectedFY(e.target.value)}
                                    className="text-xs font-bold bg-transparent border-none focus:ring-0 pr-8 text-slate-700"
                                >
                                    {(() => {
                                        const today = new Date();
                                        const year = today.getFullYear();
                                        const month = today.getMonth() + 1;
                                        const fyStart = month >= 4 ? year : year - 1;
                                        const yearsList = [];
                                        for (let i = 0; i < 4; i++) {
                                            const start = fyStart - i;
                                            const end = (start + 1).toString().slice(-2);
                                            yearsList.push(`${start}-${end}`);
                                        }
                                        return yearsList.map(fy => (
                                            <option key={fy} value={fy}>FY {fy}</option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {payslips.filter(slip => {
                                const fyStart = slip.month >= 4 ? slip.year : slip.year - 1;
                                const fyString = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
                                return fyString === selectedFY;
                            }).map((slip, idx) => (
                                <Card key={slip._id} className="overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                    <div className={`h-1.5 ${idx === 0 ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-slate-200 to-slate-300'} group-hover:h-2 transition-all duration-300`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-5">
                                            <div>
                                                <h4 className="font-black text-slate-900 text-lg">{getMonthName(slip.month)} {slip.year}</h4>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-mono mt-1">{slip.payslipId}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-slate-900">₹{slip.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                                <p className="text-[10px] text-emerald-600 font-black tracking-wider">DISBURSED</p>
                                            </div>
                                        </div>
                                        <div className="py-4 border-y border-slate-100/60 flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Basic: ₹{slip.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                            <span className="text-slate-500 font-medium">Tax: ₹{slip.taxDeduction || 0}</span>
                                        </div>
                                        <div className="mt-5 flex gap-2.5">
                                            <button
                                                onClick={() => setPreviewSlip(slip)}
                                                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-200/60"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(slip)}
                                                className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 transition-all border border-indigo-100/60"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {payslips.filter(slip => {
                                const fyStart = slip.month >= 4 ? slip.year : slip.year - 1;
                                const fyString = `${fyStart}-${(fyStart + 1).toString().slice(-2)}`;
                                return fyString === selectedFY;
                            }).length === 0 && (
                                    <div className="col-span-full p-16 text-center">
                                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-400 font-bold">No payslips found for {selectedFY}</p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*         TAX & INVESTMENTS TAB               */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "tax" && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 md:p-10">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="p-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl text-blue-600">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t("declarationForFY")} 2025-26</h2>
                                    <p className="text-slate-500 text-sm font-medium">{t("submitTaxInvestmentsSub")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Form Left */}
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2.5">
                                            Section 80C
                                            <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-full">(Max ₹1.5L)</span>
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Provider Fund (PPF)</label>
                                                <input
                                                    type="number"
                                                    value={form80C.ppf || 0}
                                                    onChange={(e) => setForm80C({ ...form80C, ppf: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                    className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">ELSS Mutual Funds</label>
                                                <input
                                                    type="number"
                                                    value={form80C.elss || 0}
                                                    onChange={(e) => setForm80C({ ...form80C, elss: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                    className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">LIC/Life Insurance</label>
                                                <input
                                                    type="number"
                                                    value={form80C.lic || 0}
                                                    onChange={(e) => setForm80C({ ...form80C, lic: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                    className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2.5">
                                            Section 80D
                                            <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-full">(Health Ins.)</span>
                                        </h4>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Mediclaim (Self/Family)</label>
                                            <input
                                                type="number"
                                                value={form80D.mediclaimSelf || 0}
                                                onChange={(e) => setForm80D({ ...form80D, mediclaimSelf: parseInt(e.target.value) || 0 })}
                                                placeholder="0"
                                                className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Form Right */}
                                <div className="space-y-8 lg:border-l lg:border-slate-100 lg:pl-12">
                                    <div>
                                        <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2.5">
                                            HRA Exemption
                                            <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-full">(House Rent)</span>
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Annual House Rent Paid</label>
                                                <input
                                                    type="number"
                                                    value={hraData.annualRent || 0}
                                                    onChange={(e) => setHraData({ ...hraData, annualRent: parseInt(e.target.value) || 0 })}
                                                    placeholder="0"
                                                    className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold text-blue-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Landlord PAN</label>
                                                <input
                                                    type="text"
                                                    value={hraData.landlordPan || ''}
                                                    onChange={(e) => setHraData({ ...hraData, landlordPan: e.target.value })}
                                                    placeholder="ABCDE1234F"
                                                    className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm uppercase font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-7 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200/60">
                                        <h4 className="font-black text-slate-900 mb-5 text-center">Summary</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Total Declared</span>
                                                <span className="font-black text-slate-900">₹{((form80C.ppf || 0) + (form80C.elss || 0) + (form80C.lic || 0) + (form80C.others || 0) + (form80D.mediclaimSelf || 0) + (hraData.annualRent || 0)).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Status</span>
                                                <span className={`font-black ${investments?.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>{investments?.status || t("notStarted")}</span>
                                            </div>
                                            <div className="flex gap-3 pt-3">
                                                <button
                                                    onClick={() => handleSaveDeclaration(false)}
                                                    className="flex-1 py-3.5 bg-white border border-slate-200/80 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                                                >
                                                    {t("saveDraft")}
                                                </button>
                                                <button
                                                    onClick={() => handleSaveDeclaration(true)}
                                                    className="flex-[2] py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2"
                                                >
                                                    {t("submit")} <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*          SALARY PROJECTION TAB              */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "projection" && (
                    <div className="max-w-4xl mx-auto py-16 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto">
                            <Calculator className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t("comingSoon")}</h2>
                        <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                            {t("whatIfCalculatorSub")}
                        </p>
                        <div className="flex justify-center gap-4 pt-4">
                            <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/60 text-xs font-bold text-slate-400 flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" /> {t("newTaxRegime")}
                            </div>
                            <div className="px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/60 text-xs font-bold text-slate-400 flex items-center gap-2">
                                <PlusCircle className="w-4 h-4" /> {t("oldTaxRegime")}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*              LEAVES TAB                     */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "leaves" && (
                    <ESSLeaveManagement employeeId={user?.id} payrollConfig={payrollConfig} />
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*           TALENT MATRIX TAB                 */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === "talent" && (
                    <ESSTalentDashboard employeeId={user?.id} />
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*             OT & C-OFF TAB                  */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === 'ot-coff' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard
                                title={t("coffBalance")}
                                value={`${employee?.compOffBalance || 0} Days`}
                                sub={t("availableToUse")}
                                icon={Calendar}
                                color="emerald"
                            />
                            <StatCard
                                title={t("pendingOT")}
                                value={otRequests.filter(r => r.status === 'Pending').length}
                                sub={t("requiresApproval")}
                                icon={Clock}
                                color="amber"
                            />
                            <StatCard
                                title={t("approvedOT")}
                                value={`${otRequests.filter(r => r.status === 'Approved').reduce((acc, r) => acc + r.hours, 0)} Hrs`}
                                sub={t("thisMonth")}
                                icon={TrendingUp}
                                color="indigo"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* OT Requests */}
                            <Card className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{t("overtimeRequests")}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{t("trackRequestExtraHours")}</p>
                                    </div>
                                    <button
                                        onClick={() => window.openOTModal()}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
                                    >
                                        <FilePlus2 size={16} /> {t("requestOT")}
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {otRequests.length > 0 ? otRequests.map((r, i) => (
                                        <div key={i} className="p-4 bg-gradient-to-r from-slate-50/80 to-white rounded-2xl border border-slate-200/80 flex items-center justify-between hover: transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-slate-200/60">
                                                    <Clock className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{format(new Date(r.date), 'MMM dd, yyyy')}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">{r.hours} Hours • {r.reason}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={r.status === 'Pending' ? 'Half Day' : r.status === 'Approved' ? 'Present' : 'Absent'} label={r.status} />
                                        </div>
                                    )) : (
                                        <div className="text-center py-16 text-slate-400">
                                            <History className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                                            <p className="text-sm font-bold">{t("noOTFound")}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* C-Off Requests */}
                            <Card className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">{t("compensatoryOffs")}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{t("earnAndUseCOff")}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => window.openCOModal('Earn')}
                                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold hover:from-emerald-600 hover:to-teal-700 transition-all"
                                        >
                                            {t("earn")}
                                        </button>
                                        <button
                                            onClick={() => window.openCOModal('Use')}
                                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
                                        >
                                            {t("use")}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {coRequests.length > 0 ? coRequests.map((r, i) => (
                                        <div key={i} className="p-4 bg-gradient-to-r from-slate-50/80 to-white rounded-2xl border border-slate-200/80 flex items-center justify-between hover: transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${r.type === 'Earn' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-blue-50 border-slate-200 text-blue-600'}`}>
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{format(new Date(r.date), 'MMM dd, yyyy')}</p>
                                                    <p className="text-[11px] text-slate-500 font-medium">
                                                        <span className={`font-bold ${r.type === 'Earn' ? 'text-emerald-600' : 'text-blue-600'}`}>[{r.type}]</span> {r.days} Day • {r.reason}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge status={r.status === 'Pending' ? 'Half Day' : r.status === 'Approved' ? 'Present' : 'Absent'} label={r.status} />
                                        </div>
                                    )) : (
                                        <div className="text-center py-16 text-slate-400">
                                            <Calendar className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                                            <p className="text-sm font-bold">{t("noCOffFound")}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/*             MY SHIFTS TAB                   */}
                {/* ═══════════════════════════════════════════ */}
                {activeTab === 'shifts' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="p-8 md:p-10">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t("shiftInformation")}</h3>
                                    <p className="text-slate-500 font-medium">{t("assignedWorkingHoursSub")}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-7 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-2xl border border-slate-200/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-5">{t("defaultShift")}</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-slate-200/60">
                                                <Building className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900">{employee?.jobDetails?.defaultShift?.name || t("generalShift")}</p>
                                                <p className="text-sm font-semibold text-slate-500">
                                                    {employee?.jobDetails?.defaultShift?.startTime || "09:00 AM"} - {employee?.jobDetails?.defaultShift?.endTime || "06:00 PM"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-7 bg-gradient-to-br from-indigo-50/60 to-violet-50/40 rounded-2xl border border-indigo-100/50">
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.15em] mb-5">{t("shiftDetails")}</h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">{t("weeklyOffs")}</span>
                                                <span className="font-bold text-slate-900">Saturday, Sunday</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">{t("workingDays")}</span>
                                                <span className="font-bold text-slate-900">9 Hours / Day</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">{t("gracePeriod")}</span>
                                                <span className="font-bold text-slate-900">15 Minutes</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-7 bg-white rounded-2xl border border-slate-200/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-5">{t("upcomingRoster")}</h4>
                                        {userRoster.length > 0 ? (
                                            <div className="space-y-3">
                                                {userRoster.slice(0, 5).map((r, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100/80 hover:bg-slate-50/50 transition-all">
                                                        <div className="w-11 h-11 rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-violet-50 text-[10px] font-bold border border-indigo-100/50">
                                                            <span className="text-indigo-400 leading-none">{format(new Date(r.date), 'MMM')}</span>
                                                            <span className="text-indigo-700 leading-none mt-0.5">{format(new Date(r.date), 'dd')}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-bold text-slate-900">{r.shiftId?.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">{r.shiftId?.startTime} - {r.shiftId?.endTime}</p>
                                                        </div>
                                                        <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100/60">Confirmed</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10">
                                                <CalendarDays className="w-14 h-14 text-slate-200 mx-auto mb-3" />
                                                <p className="text-sm font-bold text-slate-400">{t("noRosterAssigned")}</p>
                                                <p className="text-[11px] text-slate-400 mt-1 font-medium">{t("followingStandardSchedule")}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/*           POLICY MODAL                      */}
            {/* ═══════════════════════════════════════════ */}
            {showPolicyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{t("payrollPolicy")} 2025-26</h3>
                                <p className="text-xs text-slate-500 font-medium">{t("effectiveFrom")} April 1st, 2025</p>
                            </div>
                            <button onClick={() => setShowPolicyModal(false)} className="p-2.5 hover:bg-slate-200/60 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-7 max-h-[60vh] overflow-y-auto space-y-5 text-sm text-slate-600 leading-relaxed">
                            <p><strong className="text-slate-900">1. {t("paymentCycle")}:</strong> Salaries are processed on the last working day of every month. Pay slips are available for download by the 1st of the following month.</p>
                            <p><strong className="text-slate-900">2. {t("taxDeductionsTDS")}:</strong> TDS is deducted based on the investment declaration submitted by the employee. You can switch between Old and New Tax Regimes at the start of the financial year.</p>
                            <p><strong className="text-slate-900">3. {t("reimbursements")}:</strong> All expense claims must be submitted by the 20th of the month to be included in that month's payout. Late submissions will be processed in the subsequent cycle.</p>
                            <p><strong className="text-slate-900">4. {t("leavesAndLOP")}:</strong> Unpaid leaves (Loss of Pay) will be deducted from the gross salary on a pro-rata basis. Leave balances are updated daily.</p>
                            <p><strong className="text-slate-900">5. {t("variablePay")}:</strong> Performance bonuses and incentives are disbursed quarterly based on the company's performance appraisal policy.</p>
                        </div>
                        <div className="p-7 border-t border-slate-100 bg-slate-50/50 text-right">
                            <button
                                onClick={() => handleDownload('Payroll_Policy_2025.txt', 'Full Payroll Policy Content...')}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                {t("downloadPolicy")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/*         PAYSLIP PREVIEW MODAL               */}
            {/* ═══════════════════════════════════════════ */}
            {previewSlip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">{t("payslipPreview")}</h3>
                                <p className="text-xs text-slate-500 font-medium">{getMonthName(previewSlip.month)} {previewSlip.year}</p>
                            </div>
                            <button onClick={() => setPreviewSlip(null)} className="p-2.5 hover:bg-slate-200/60 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-7 space-y-6">
                            <div className="text-center p-7 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100/50">
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">{t("netPay")}</p>
                                <h2 className="text-4xl font-black text-indigo-900 tracking-tight">₹{previewSlip.netSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</h2>
                                <p className="text-[10px] text-slate-400 mt-3 font-mono bg-white/60 inline-block px-3 py-1 rounded-full">ID: {previewSlip.payslipId}</p>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between text-sm p-4 bg-slate-50/80 rounded-xl">
                                    <span className="text-slate-600 font-medium">{t("basicSalary")}</span>
                                    <span className="font-black text-slate-900">₹{previewSlip.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                                <div className="flex justify-between text-sm p-4 bg-slate-50/80 rounded-xl">
                                    <span className="text-slate-600 font-medium">{t("taxDeduction")}</span>
                                    <span className="font-black text-rose-600">- ₹{previewSlip.taxDeduction?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100/50">
                                    <span className="font-black text-slate-900">{t("grossEarnings")}</span>
                                    <span className="font-black text-emerald-700">₹{((previewSlip.basicSalary || 0)).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-7 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                            <button
                                onClick={() => setPreviewSlip(null)}
                                className="flex-1 py-3 bg-white border border-slate-200/80 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition-all"
                            >
                                {t("close")}
                            </button>
                            <button
                                onClick={() => handleDownloadPDF(previewSlip)}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-xs hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> {t("download")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modals for OT and CO */}
            <OTRequestModal employeeId={user?.id} onSuccess={fetchRequests} />
            <CORequestModal employeeId={user?.id} onSuccess={fetchRequests} balance={employee?.compOffBalance || 0} />
        </div>
    );
}

export default function ESSDashboard() {
    return (
        <Suspense fallback={
            <div className="flex h-[80vh] items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                </div>
            </div>
        }>
            <ESSDashboardContent />
        </Suspense>
    );
}

function safeFormatDate(y, m) {
    if (!y || !m || isNaN(m)) return 'N/A';
    try {
        return format(new Date(y, m - 1, 1), 'MMMM yyyy');
    } catch (e) {
        return 'N/A';
    }
}

function getMonthName(m) {
    if (!m || isNaN(m)) return '';
    try {
        return format(new Date(2000, m - 1, 1), "MMMM");
    } catch {
        return '';
    }
}

const OTRequestModal = ({ employeeId, onSuccess }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ date: format(new Date(), 'yyyy-MM-dd'), hours: 1, reason: '' });

    useEffect(() => {
        window.openOTModal = () => setIsOpen(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/payroll/overtime', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee: employeeId, ...formData })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("OT Request Submitted");
                setIsOpen(false);
                onSuccess(employeeId);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <h3 className="text-lg font-black text-slate-900">{t("requestOT")}</h3>
                    <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-slate-200/60 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Hours</label>
                        <input
                            type="number"
                            required
                            min="0.5"
                            step="0.5"
                            value={formData.hours}
                            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Reason</label>
                        <textarea
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none h-24 resize-none transition-all"
                            placeholder={t("whyWorkLate")}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl text-sm hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? t("submitting") : t("submitRequest")}
                    </button>
                </form>
            </div>
        </div>
    );
};

const CORequestModal = ({ employeeId, onSuccess, balance }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('Earn'); // 'Earn' or 'Use'
    const [formData, setFormData] = useState({ date: format(new Date(), 'yyyy-MM-dd'), days: 1, reason: '' });

    useEffect(() => {
        window.openCOModal = (modalType) => {
            setType(modalType);
            setIsOpen(true);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (type === 'Use' && formData.days > balance) {
            toast.error("Insufficient C-Off balance");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/payroll/comp-off', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee: employeeId, type, ...formData })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`C-Off ${type === 'Earn' ? 'Request' : 'Leave'} Submitted`);
                setIsOpen(false);
                onSuccess(employeeId);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-indigo-50/30">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">{type === 'Earn' ? t("earnCompOff") : t("useCompOff")}</h3>
                        <p className="text-xs text-slate-500 font-medium">{type === 'Earn' ? t("workedHolidayWeekend") : `${t("currentBalance")}: ${balance} Days`}</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2.5 hover:bg-slate-200/60 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-7 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Days</label>
                        <input
                            type="number"
                            required
                            min="0.5"
                            max={type === 'Use' ? balance : 5}
                            step="0.5"
                            value={formData.days}
                            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Reason</label>
                        <textarea
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full p-3.5 bg-slate-50/80 border border-slate-200/60 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 outline-none h-24 resize-none transition-all"
                            placeholder={type === 'Earn' ? t("mentionHolidayWorked") : t("reasonForLeave")}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50 ${type === 'Earn' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                    >
                        {loading ? t("submitting") : t("submitRequest")}
                    </button>
                </form>
            </div>
        </div>
    );
};

