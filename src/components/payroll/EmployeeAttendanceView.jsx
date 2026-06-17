"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar as CalendarIcon,
  UserCheck,
  Clock,
  Plus,
  Search,
  Filter,
  Loader2,
  User,
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Send,
  XCircle,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import { format } from "date-fns";

export default function EmployeeAttendanceView() {
  const { user } = useSession();
  const { t } = useLanguage();

  const formatTime = (time) => {
    if (!time) return "--:--";
    return new Date(time).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const handleMonthChange = (direction) => {
    if (direction === "next") {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    }
  };

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [clockStatus, setClockStatus] = useState("loading"); // loading, checked-in, checked-out, none
  const [clockLoading, setClockLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Live Timer
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const timerRef = useRef(null);

  // Month navigation
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Tabs: 'dashboard', 'history', 'regularize', 'overtime'
  const [activeTab, setActiveTab] = useState("dashboard");

  // Regularization Panel States
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [approverSearch, setApproverSearch] = useState("");
  const [showApproverDropdown, setShowApproverDropdown] = useState(false);
  const [regData, setRegData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "Absent Correction",
    reason: "",
    approverId: "",
    halfDaySlot: "None",
    requestedTimeStart: "09:00",
    requestedTimeEnd: "18:00"
  });

  // Overtime Panel States
  const [otRequests, setOtRequests] = useState([]);
  const [loadingOT, setLoadingOT] = useState(false);
  const [showOTModal, setShowOTModal] = useState(false);
  const [otData, setOtData] = useState({
    date: new Date().toISOString().split("T")[0],
    hours: "2",
    reason: "",
    approverId: ""
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
    { value: 12, label: "December" }
  ];

  // Fetch Attendance Records
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      params.append("startDate", startDate.toISOString());
      params.append("endDate", endDate.toISOString());
      params.append("limit", "1000");

      const res = await fetch(`/api/v1/employee/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const records = data.attendance || [];
        setAttendance(records);
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Today's Clock In Status
  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/v1/employee/payroll/attendance?employeeId=${user.id}&date=${today}`);
      if (res.ok) {
        const data = await res.json();
        const record = data.attendance?.[0];
        if (record) {
          setTodayRecord(record);
          if (record.checkIn && !record.checkOut) {
            setClockStatus("checked-in");
          } else if (record.checkIn && record.checkOut) {
            setClockStatus("checked-out");
          } else {
            setClockStatus("none");
          }
        } else {
          setClockStatus("none");
        }
      }
    } catch (error) {
      console.error("Error checking today's attendance:", error);
      setClockStatus("none");
    }
  };

  // Fetch Regularization Requests
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch("/api/v1/employee/attendance/regularize");
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching regularizations:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch Overtime Requests
  const fetchOTRequests = async () => {
    try {
      setLoadingOT(true);
      const res = await fetch("/api/v1/employee/payroll/overtime");
      if (res.ok) {
        const data = await res.json();
        setOtRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching overtime:", error);
    } finally {
      setLoadingOT(false);
    }
  };

  // Fetch Approvers
  const fetchApprovers = async () => {
    try {
      const res = await fetch("/api/v1/employee/leaves/approvers");
      if (res.ok) {
        const data = await res.json();
        setApprovers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching approvers:", error);
    }
  };

  // Geolocation helper
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              coordinates: [position.coords.longitude, position.coords.latitude],
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            reject(error);
          },
          { timeout: 8000 }
        );
      }
    });
  };

  // Handle Clock In
  const handleClockIn = async () => {
    setClockLoading(true);
    setLocationError(null);
    let location = null;

    try {
      location = await getLocation();
    } catch (error) {
      console.error("Location error during clock-in:", error);
      let errorMsg = "Could not verify location.";
      if (error.code === 1) errorMsg = "Location permission was denied.";
      toast.error(errorMsg);
      setLocationError(errorMsg);
    }

    try {
      const res = await fetch("/api/v1/employee/payroll/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: user.id,
          date: new Date().toISOString(),
          status: "Present",
          checkIn: new Date().toISOString(),
          location: location,
          attendanceMethod: "Web",
          deviceId: navigator.userAgent
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clock in");

      if (location && data.attendance?.isGeofenceVerified === false) {
        toast.error("Clocked in, but you are outside the designated office zone!", { duration: 5000 });
      } else {
        toast.success("Clocked in successfully! Have a great shift!");
      }

      setTodayRecord(data.attendance);
      setClockStatus("checked-in");
      fetchAttendance();
    } catch (error) {
      toast.error(error.message || "An error occurred during clock in.");
    } finally {
      setClockLoading(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    setClockLoading(true);
    let location = null;

    try {
      location = await getLocation();
    } catch (error) {
      console.error("Location error during clock-out:", error);
    }

    try {
      const res = await fetch("/api/v1/employee/payroll/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: user.id,
          date: new Date().toISOString(),
          checkOut: new Date().toISOString(),
          status: "Present",
          location: location
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clock out");

      toast.success("Clocked out successfully! Great work today.");
      setTodayRecord(data.attendance);
      setClockStatus("checked-out");
      fetchAttendance();
    } catch (error) {
      toast.error(error.message || "An error occurred during clock out.");
    } finally {
      setClockLoading(false);
    }
  };

  // Handle regularization submission
  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regData.reason || !regData.approverId) {
      toast.error("Please provide a reason and select a manager");
      return;
    }

    try {
      const payload = { ...regData };
      if (regData.type === "Half-Day" && regData.requestedTimeStart && regData.requestedTimeEnd) {
        payload.requestedTime = `${regData.requestedTimeStart} - ${regData.requestedTimeEnd}`;
      }

      const res = await fetch("/api/v1/employee/attendance/regularize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Regularization request submitted!");
        setShowRegModal(false);
        setRegData({
          date: new Date().toISOString().split("T")[0],
          type: "Absent Correction",
          reason: "",
          approverId: "",
          halfDaySlot: "None",
          requestedTimeStart: "09:00",
          requestedTimeEnd: "18:00"
        });
        setApproverSearch("");
        fetchRequests();
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle Overtime submission
  const handleOTSubmit = async (e) => {
    e.preventDefault();
    if (!otData.reason || !otData.approverId || !otData.hours) {
      toast.error("Please complete all overtime details");
      return;
    }

    try {
      const res = await fetch("/api/v1/employee/payroll/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(otData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Overtime request logged successfully!");
        setShowOTModal(false);
        setOtData({
          date: new Date().toISOString().split("T")[0],
          hours: "2",
          reason: "",
          approverId: ""
        });
        fetchOTRequests();
      } else {
        throw new Error(data.error || "Failed to log overtime request");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Live Timer logic
  useEffect(() => {
    if (clockStatus === "checked-in" && todayRecord?.checkIn) {
      const startTime = new Date(todayRecord.checkIn).getTime();

      const updateTimer = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, now - startTime);

        const secs = Math.floor((diff / 1000) % 60);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const hrs = Math.floor((diff / (1000 * 60 * 60)));

        const formatted = [
          hrs.toString().padStart(2, "0"),
          mins.toString().padStart(2, "0"),
          secs.toString().padStart(2, "0")
        ].join(":");

        setElapsedTime(formatted);
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime("00:00:00");
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clockStatus, todayRecord]);

  // Initial Fetches
  useEffect(() => {
    if (user?.id) {
      checkTodayAttendance();
      fetchAttendance();
      fetchRequests();
      fetchApprovers();
      fetchOTRequests();
    }
  }, [user, selectedMonth, selectedYear]);

  // Stats Calculations
  const metrics = useMemo(() => {
    const present = attendance.filter((r) => r.status === "Present").length;
    const halfDay = attendance.filter((r) => r.status === "Half-day").length;
    const leaves = attendance.filter((r) => r.status === "Leave").length;
    const absents = attendance.filter((r) => r.status === "Absent").length;
    const lates = attendance.filter((r) => r.lateMinutes > 0).length;

    const totalHours = attendance.reduce((sum, r) => sum + (parseFloat(r.totalHours) || 0), 0);
    const overtime = attendance.reduce((sum, r) => sum + (parseFloat(r.overtimeHours) || 0), 0);

    return {
      present,
      halfDay,
      leaves,
      absents,
      lates,
      totalHours: totalHours.toFixed(1),
      overtime: overtime.toFixed(1)
    };
  }, [attendance]);

  // Calendar cells mapping
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // Sunday=0, Monday=1
    // Offset Sunday to end if we want Monday start, but let's stick to standard Sunday start
    const cells = [];

    // Empty spaces before first day
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: "", record: null });
    }

    // Days grid
    for (let d = 1; d <= daysInMonth; d++) {
      // Find matching attendance record
      const match = attendance.find((r) => {
        const recordDate = new Date(r.date);
        return (
          recordDate.getDate() === d &&
          recordDate.getMonth() + 1 === selectedMonth &&
          recordDate.getFullYear() === selectedYear
        );
      });
      cells.push({ day: d, record: match });
    }

    return cells;
  }, [attendance, selectedMonth, selectedYear]);

  // Get status color helper for calendar cells
  const getCellStatusClass = (record) => {
    if (!record) return "bg-slate-50 border-slate-100 hover:border-slate-300";
    switch (record.status) {
      case "Present":
        return "bg-emerald-50/50 border-emerald-200 text-emerald-800 hover:bg-emerald-50 ring-1 ring-emerald-100";
      case "Half-day":
        return "bg-amber-50/50 border-amber-200 text-amber-800 hover:bg-amber-50 ring-1 ring-amber-100";
      case "Leave":
        return "bg-violet-50/50 border-violet-200 text-violet-800 hover:bg-violet-50 ring-1 ring-violet-100";
      case "Absent":
        return "bg-rose-50/50 border-rose-200 text-rose-800 hover:bg-rose-50 ring-1 ring-rose-100";
      case "WFH":
        return "bg-teal-50/50 border-teal-200 text-teal-800 hover:bg-teal-50 ring-1 ring-teal-100";
      case "Weekend":
        return "bg-slate-100/60 border-slate-200 text-slate-500 cursor-default";
      case "Holiday":
        return "bg-fuchsia-50/50 border-fuchsia-200 text-fuchsia-800 hover:bg-fuchsia-50 ring-1 ring-fuchsia-100";
      default:
        return "bg-slate-50 border-slate-100 hover:border-slate-300";
    }
  };

  // Filtered Approvers
  const filteredApprovers = useMemo(() => {
    if (!approverSearch) return approvers;
    return approvers.filter((emp) =>
      `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName}`
        .toLowerCase()
        .includes(approverSearch.toLowerCase())
    );
  }, [approvers, approverSearch]);

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Rejected: "bg-rose-50 text-rose-700 border-rose-200"
    };
    return `px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
      styles[status] || "bg-slate-50 text-slate-600 border-slate-200"
    }`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] pb-16">
      <Toaster position="top-right" richColors closeButton />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* Module Hero */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4 mt-2">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Attendance Management
                </h1>
                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                    Track attendance records, shift activities, regularization requests and attendance history.
                </p>
            </div>
        </div>

        {/* Dynamic Top Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-3xl border border-slate-200/60 max-w-fit no-scrollbar">
          {[
            { id: "dashboard", label: "My Dashboard", icon: Layers },
            { id: "history", label: "History Log", icon: CalendarIcon },
            { id: "regularize", label: "Regularization", icon: ArrowRightLeft },
            { id: "overtime", label: "Overtime Log", icon: Clock }
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

        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Clock Widget + Quick Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Glass Clock Widget */}
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 lg:p-10 text-white relative overflow-hidden flex flex-col justify-between min-h-[350px]">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full -mr-40 -mt-40 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-40 -mb-40 blur-3xl"></div>

                <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 text-indigo-300">
                      Digital Time Punch
                    </span>
                    <h2 className="text-3xl font-black tracking-tight mt-4">
                      {clockStatus === "checked-in" ? "Shift is Active" : clockStatus === "checked-out" ? "Shift Completed" : "Ready to Clock In"}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      {clockStatus === "checked-in"
                        ? `Clocked in at ${formatTime(todayRecord?.checkIn)}`
                        : clockStatus === "checked-out"
                        ? `Shift completed at ${formatTime(todayRecord?.checkOut)}`
                        : "Ensure your location settings are allowed for verification."}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged Today</p>
                    <p className="text-4xl font-mono font-black mt-2 text-indigo-3000_0_15px_rgba(129,140,248,0.3)]">
                      {elapsedTime}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex flex-wrap gap-4 items-center justify-between mt-12 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <MapPin className={`w-5 h-5 ${clockStatus === "checked-in" ? "text-emerald-400" : "text-slate-400"}`} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Geofencing Status</p>
                      <p className="text-xs font-bold mt-0.5">
                        {clockStatus === "checked-in" && todayRecord?.isGeofenceVerified === false
                          ? "Outside Office Boundary"
                          : "Office Zone Calibrated"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {clockStatus === "none" && (
                      <button
                        onClick={handleClockIn}
                        disabled={clockLoading}
                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Clock In
                      </button>
                    )}

                    {clockStatus === "checked-in" && (
                      <button
                        onClick={handleClockOut}
                        disabled={clockLoading}
                        className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 animate-pulse"
                      >
                        {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Clock Out
                      </button>
                    )}

                    {clockStatus === "checked-out" && (
                      <div className="px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest cursor-default">
                        Shift Finished 🎉
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insights Card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 flex flex-col justify-between">
                <div>
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                    Monthly Compliance
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-4 leading-tight">Attendance Summary</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Review your status logs for the current calendar period.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Hours</p>
                    <p className="text-2xl font-black text-slate-950 mt-1">{metrics.totalHours}h</p>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Overtime</p>
                    <p className="text-2xl font-black text-indigo-600 mt-1">+{metrics.overtime}h</p>
                  </div>
                </div>

                <div className="flex gap-2 items-center text-[10px] font-bold text-slate-400 mt-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/60">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Maintain 8 hours average shift time to avoid late deductions.</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { label: "Present Days", value: metrics.present, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Half-Days", value: metrics.halfDay, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                { label: "On Leaves", value: metrics.leaves, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
                { label: "Absents", value: metrics.absents, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
                { label: "Late Penalties", value: metrics.lates, color: "text-red-700", bg: "bg-red-50", border: "border-red-100" }
              ].map((m, idx) => (
                <div key={idx} className={`bg-white rounded-3xl p-5 border ${m.border} transition-transform hover:-translate-y-0.5`}>
                  <div className="flex justify-between items-start">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                    <span className={`w-2.5 h-2.5 rounded-full ${m.color.replace("text-", "bg-")}`} />
                  </div>
                  <p className={`text-3xl font-black mt-4 leading-none ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Stunning Month View Calendar Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Attendance Month-Grid</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Click arrows to navigate months and view status cards.</p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => handleMonthChange("prev")}
                    className="p-2 bg-white border border-slate-200/60 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black uppercase text-slate-800 tracking-widest min-w-[120px] text-center">
                    {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
                  </span>
                  <button
                    onClick={() => handleMonthChange("next")}
                    className="p-2 bg-white border border-slate-200/60 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid Calendar */}
              <div className="grid grid-cols-7 gap-3 text-center">
                {/* Weekday Names */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                  <div key={dayName} className="text-[10px] font-black uppercase tracking-wider text-slate-400 py-2">
                    {dayName}
                  </div>
                ))}

                {/* Day Cells */}
                {calendarCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`min-h-[90px] p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                      cell.day ? getCellStatusClass(cell.record) : "bg-slate-50/20 border-transparent cursor-default"
                    }`}
                  >
                    {cell.day ? (
                      <>
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-black leading-none">{cell.day}</span>
                          {cell.record && (
                            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-80">
                              {cell.record.status}
                            </span>
                          )}
                        </div>

                        {cell.record ? (
                          <div className="text-left mt-2 space-y-0.5">
                            {cell.record.checkIn && (
                              <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                In: {formatTime(cell.record.checkIn).replace(" AM", "").replace(" PM", "")}
                              </p>
                            )}
                            {cell.record.checkOut && (
                              <p className="text-[9px] font-semibold leading-none truncate text-slate-600">
                                Out: {formatTime(cell.record.checkOut).replace(" AM", "").replace(" PM", "")}
                              </p>
                            )}
                            {cell.record.totalHours && (
                              <p className="text-[8px] font-bold leading-none text-indigo-500 mt-1">
                                {parseFloat(cell.record.totalHours).toFixed(1)}h logged
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-left mt-2">
                            <p className="text-[8px] text-slate-300 italic font-medium leading-none">No punch logs</p>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100 justify-center">
                {[
                  { label: "Present", color: "bg-emerald-500" },
                  { label: "Half-Day", color: "bg-amber-500" },
                  { label: "Weekend / Holiday", color: "bg-slate-300" },
                  { label: "On Leave", color: "bg-violet-500" },
                  { label: "Absent", color: "bg-rose-500" }
                ].map((leg) => (
                  <div key={leg.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${leg.color}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{leg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: History Log */}
        {activeTab === "history" && (
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6 animate-in fade-in duration-500">
            <div>
              <h3 className="text-xl font-black text-slate-900">Attendance History Log</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">View and audit all historical punches logged.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Punch Status</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock In</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Out</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Hours</th>
                    <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-black text-slate-900 text-sm">
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                          record.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          record.status === "Absent" ? "bg-rose-50 text-rose-700 border-rose-100" :
                          record.status === "Half-day" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          record.status === "WFH" ? "bg-teal-50 text-teal-700 border-teal-100" :
                          "bg-slate-50 text-slate-600 border-slate-100"
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="p-5 font-medium text-slate-700 text-sm">{formatTime(record.checkIn)}</td>
                      <td className="p-5 font-medium text-slate-700 text-sm">{formatTime(record.checkOut)}</td>
                      <td className="p-5 font-bold text-slate-900 text-sm">{record.totalHours ? `${parseFloat(record.totalHours).toFixed(1)} hrs` : "N/A"}</td>
                      <td className="p-5 font-bold text-indigo-600 text-sm">{record.overtimeHours ? `+${parseFloat(record.overtimeHours).toFixed(1)} hrs` : "N/A"}</td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center p-12 text-slate-400 italic">No attendance records found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Regularization Request Center */}
        {activeTab === "regularize" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* List Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Regularization Center</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium font-mono uppercase tracking-wider">Waiver and correction request directory</p>
                </div>

                <button
                  onClick={() => setShowRegModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95"
                >
                  <Plus size={16} /> Raise Request
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Correction Date</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Correction Type</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description Reason</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingRequests ? (
                      <tr>
                        <td colSpan="4" className="text-center p-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></td>
                      </tr>
                    ) : myRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5 font-black text-slate-900 text-sm">
                          {format(new Date(req.date), "MMM dd, yyyy")}
                        </td>
                        <td className="p-5">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {req.type}
                          </span>
                        </td>
                        <td className="p-5 font-medium text-slate-600 text-sm max-w-sm truncate">
                          "{req.reason}"
                        </td>
                        <td className="p-5 text-center">
                          <span className={getStatusBadge(req.status)}>{req.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!loadingRequests && myRequests.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center p-12 text-slate-400 italic">No regularization requests raised yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Overtime Request Log */}
        {activeTab === "overtime" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* OT Log List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Overtime Log Directory</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium font-mono uppercase tracking-wider">Log additional working hours for incentives</p>
                </div>

                <button
                  onClick={() => setShowOTModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 active:scale-95"
                >
                  <Plus size={16} /> Log Overtime
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Worked</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hours Logged</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged Reason</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingOT ? (
                      <tr>
                        <td colSpan="4" className="text-center p-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" /></td>
                      </tr>
                    ) : otRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5 font-black text-slate-900 text-sm">
                          {format(new Date(req.date), "MMM dd, yyyy")}
                        </td>
                        <td className="p-5 font-bold text-indigo-600 text-sm">
                          +{req.hours} hours
                        </td>
                        <td className="p-5 font-medium text-slate-600 text-sm max-w-sm truncate">
                          "{req.reason}"
                        </td>
                        <td className="p-5 text-center">
                          <span className={getStatusBadge(req.status)}>{req.status}</span>
                        </td>
                      </tr>
                    ))}
                    {!loadingOT && otRequests.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center p-12 text-slate-400 italic">No overtime logs submitted yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium Modal 1: Raise Regularization Request */}
      {showRegModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/60">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Raise Regularization</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Correct absent markings, late punches, or missing logs.</p>
            </div>

            <form onSubmit={handleRegSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Date</label>
                  <input
                    type="date"
                    required
                    value={regData.date}
                    onChange={(e) => setRegData({ ...regData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correction Type</label>
                  <select
                    value={regData.type}
                    onChange={(e) => setRegData({ ...regData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                  >
                    <option value="Absent Correction">Absent Correction</option>
                    <option value="Late Waive">Late Waive Request</option>
                    <option value="Punch Correction">Punch Correction</option>
                    <option value="Half-Day">Half-Day Slot Adjust</option>
                  </select>
                </div>
              </div>

              {regData.type === "Half-Day" && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="col-span-3">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Half-Day Slot</label>
                    <select
                      value={regData.halfDaySlot}
                      onChange={(e) => setRegData({ ...regData, halfDaySlot: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="First Half">First Half Slot</option>
                      <option value="Second Half">Second Half Slot</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Manager Search select block */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designate Approving Manager</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search managers by name..."
                    value={approverSearch}
                    onChange={(e) => {
                      setApproverSearch(e.target.value);
                      setShowApproverDropdown(true);
                    }}
                    onFocus={() => setShowApproverDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {showApproverDropdown && (
                  <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl max-h-[160px] overflow-y-auto mt-1 p-2 space-y-1">
                    {filteredApprovers.map((mgr) => (
                      <button
                        key={mgr._id}
                        type="button"
                        onClick={() => {
                          setRegData({ ...regData, approverId: mgr._id });
                          setApproverSearch(`${mgr.personalDetails?.firstName} ${mgr.personalDetails?.lastName}`);
                          setShowApproverDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 rounded-xl flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600">
                          {mgr.personalDetails?.firstName?.[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {mgr.personalDetails?.firstName} {mgr.personalDetails?.lastName}
                          </p>
                          <p className="text-[9px] text-slate-400">{mgr.jobDetails?.designation || "Manager"}</p>
                        </div>
                      </button>
                    ))}
                    {filteredApprovers.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-3">No matching managers found</p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correction Reason / Notes</label>
                <textarea
                  required
                  rows="3"
                  value={regData.reason}
                  onChange={(e) => setRegData({ ...regData, reason: e.target.value })}
                  placeholder="Ex: Punch machine device was faulty, or checking in late due to client-visit..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Premium Modal 2: Log Overtime Request */}
      {showOTModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200/60">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900">Log Overtime Request</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Log additional working hours for incentive calculation.</p>
            </div>

            <form onSubmit={handleOTSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Date</label>
                  <input
                    type="date"
                    required
                    value={otData.date}
                    onChange={(e) => setOtData({ ...otData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Incentive Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={otData.hours}
                    onChange={(e) => setOtData({ ...otData, hours: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Manager Selection for OT */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designate Approving Manager</label>
                <select
                  required
                  value={otData.approverId}
                  onChange={(e) => setOtData({ ...otData, approverId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Select Approver</option>
                  {approvers.map((mgr) => (
                    <option key={mgr._id} value={mgr._id}>
                      {mgr.personalDetails?.firstName} {mgr.personalDetails?.lastName} ({mgr.jobDetails?.designation || "Manager"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Work Details / Justification</label>
                <textarea
                  required
                  rows="3"
                  value={otData.reason}
                  onChange={(e) => setOtData({ ...otData, reason: e.target.value })}
                  placeholder="Ex: Resolved high priority ticket #204, or finished sprint task deliverables..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOTModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Log Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
