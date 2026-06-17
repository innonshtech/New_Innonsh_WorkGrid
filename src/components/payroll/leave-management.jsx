'use client';

import { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Building,
  ChevronDown,
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  FileText,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter,
  FilterX,
  Loader2,
  Layers,
  ChevronUp,
  ChevronsUpDown,
  Building2,
  User,
  RefreshCw,
  CalendarRange,
  Edit3,
  Info,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "@/context/SessionContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaveManagement() {
  const router = useRouter();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPaidLeaves: 0,
    totalUnpaidLeaves: 0,
    totalDays: 0,
  });



  // Modal state for add/edit
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editLeaveId, setEditLeaveId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    month: selectedMonth,
    year: selectedYear,
    leaves: [],
    notes: "",
    status: "Draft",
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [errors, setErrors] = useState({});
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: "",
    leaveType: "Paid",
    reason: "",
  });
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [classificationData, setClassificationData] = useState({
    paidCount: 0,
    unpaidCount: 0,
  });

  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [editValues, setEditValues] = useState({ paid: 0, unpaid: 0 });
  const [payrollConfig, setPayrollConfig] = useState(null);

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
  const years = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "Draft", label: "Draft" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
  ];

  const leaveTypes = [
    { value: "Paid", label: "Paid Leave", color: "green" },
    { value: "Unpaid", label: "Unpaid Leave", color: "red" },
    { value: "Half-Day Paid", label: "Half-Day Paid", color: "blue" },
    { value: "Half-Day Unpaid", label: "Half-Day Unpaid", color: "orange" },
  ];



  const fetchEmployees = async (orgId = "") => {
    try {
      setLoadingEmployees(true);
      const params = new URLSearchParams({
        limit: "1000",
        status: "Active",
      });
      if (orgId) params.append("organizationId", orgId);

      const response = await fetch(`/api/v1/admin/payroll/employees?${params}`);
      const data = await response.json();
      if (response.ok) {
        setEmployees(data.data || data.employees || []);
      } else {
        console.error("Error fetching employees:", data.error);
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (selectedOrganization) {
      fetchPayrollConfig(selectedOrganization);
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (payrollConfig) {
      fetchLeaves(true); // Refresh with new config
    }
  }, [payrollConfig]);

  const fetchPayrollConfig = async (orgId) => {
    if (!orgId) return;
    try {
      const res = await fetch(`/api/v1/admin/payroll/settings?orgId=${orgId}`);
      if (res.ok) {
        const data = await res.json();
        setPayrollConfig(data);
      }
    } catch (err) {
      console.error("Error fetching payroll config:", err);
    }
  };

  const fetchLeaves = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Step 1: Fetch all active employees
      const empParams = new URLSearchParams({
        limit: "1000",
        status: "Active",
      });
      if (selectedOrganization) {
        empParams.append("organizationId", selectedOrganization);
      }

      const empResponse = await fetch(`/api/v1/admin/payroll/employees?${empParams}`);
      const empData = await empResponse.json();
      const allEmployees = empResponse.ok ? (empData.data || empData.employees || []) : [];

      console.log(`📊 Fetched ${allEmployees.length} active employees`);

      // Step 2: Fetch ALL leave records for the entire year (not just selected month)
      const leaveParams = new URLSearchParams({
        page: "1",
        limit: "10000",
        year: selectedYear.toString(),
      });
      if (selectedOrganization) {
        leaveParams.append("organizationId", selectedOrganization);
      }

      const leaveResponse = await fetch(`/api/v1/admin/payroll/leaves?${leaveParams}`);
      const leaveData = await leaveResponse.json();
      const allYearLeaves = leaveResponse.ok ? leaveData.leaves || [] : [];

      console.log(`📅 Fetched ${allYearLeaves.length} leave records for year ${selectedYear}`);

      // Step 3: Group leaves by employee
      const employeeLeaveMap = new Map();
      allYearLeaves.forEach(leave => {
        const empId = leave.employeeId?._id || leave.employeeId;
        if (!employeeLeaveMap.has(empId)) {
          employeeLeaveMap.set(empId, []);
        }
        employeeLeaveMap.get(empId).push(leave);
      });

      // Step 4: Process each employee to calculate cumulative balance
      let processedLeaves = allEmployees.map(emp => {
        const empLeaves = employeeLeaveMap.get(emp._id) || [];

        // Get MONTHLY entitled leaves (using the field from config)
        const monthlyEntitled = payrollConfig?.annualPaidLeaveQuota || 0;

        // Balance at START of this month is simply the monthly quota (no carry forward as per user request)
        const balanceAtMonthStart = monthlyEntitled;
        const usedBeforeThisMonth = 0; // Fresh start every month

        // Find leave record for current selected month
        const currentMonthLeave = empLeaves.find(l => l.month === selectedMonth);

        // Get total leaves for THIS month
        const thisMonthUsed = currentMonthLeave
          ? (currentMonthLeave.summary.totalDays || 0)
          : 0;

        // Balance at END of this month
        const balanceAtMonthEnd = balanceAtMonthStart - thisMonthUsed;

        // For Monthly mode, total used till now is just this month's usage
        const totalUsedTillNow = thisMonthUsed;

        console.log(`👤 ${emp.personalDetails.firstName} ${emp.personalDetails.lastName} - ${months[selectedMonth - 1].label} ${selectedYear}:
          📅 Selected Month: ${selectedMonth}
          💰 Monthly Quota: ${monthlyEntitled} days
          📍 This Month Used: ${thisMonthUsed.toFixed(1)} days
          🏁 Balance at Month END: ${balanceAtMonthEnd.toFixed(1)} days
          ${currentMonthLeave ? '✓ Has record for this month' : '✗ No record for this month (placeholder)'}`);


        if (currentMonthLeave) {
          // Employee has a leave record for this month
          return {
            ...currentMonthLeave,
            annualLeaveBalance: {
              totalEntitled: monthlyEntitled, // Monthly quota
              used: totalUsedTillNow, // Total used from Jan to this month
              remaining: balanceAtMonthEnd, // Balance AFTER this month
              balanceAtMonthStart: balanceAtMonthStart, // Balance before this month
              thisMonthUnpaid: thisMonthUsed, // Total used this month
            },
          };
        } else {
          // No leave record for this month - create a placeholder
          // The balance shown should be the actual remaining balance at this point
          // which equals the balance at month start (since no leaves taken this month)
          return {
            _id: `temp-${emp._id}`,
            employeeId: emp._id,
            employeeName: `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`,
            employeeCode: emp.employeeId,
            organizationType: emp.organizationType || 'Unassigned',
            organizationId: emp.jobDetails?.organizationId,
            department: emp.jobDetails?.department || 'Unassigned',
            summary: {
              paidLeaves: 0,
              unpaidLeaves: 0,
              halfDayPaidLeaves: 0,
              halfDayUnpaidLeaves: 0,
              totalDays: 0,
            },
            annualLeaveBalance: {
              totalEntitled: monthlyEntitled, // Monthly quota
              used: usedBeforeThisMonth, // Total used before this month
              remaining: balanceAtMonthStart, // IMPORTANT: Shows actual remaining balance (not 31)
              balanceAtMonthStart: balanceAtMonthStart, // Balance at start of this month
              thisMonthUnpaid: 0, // No usage this month (no record)
            },
            status: 'Draft',
            month: selectedMonth,
            year: selectedYear,
          };
        }
      });

      // Extract unique departments for the dropdown BEFORE applying filters
      const uniqueDepts = Array.from(new Set(processedLeaves.map(l => l.department).filter(Boolean))).sort();
      setDepartments(uniqueDepts);

      // Step 5: Apply filters
      if (selectedStatus) {
        processedLeaves = processedLeaves.filter(l =>
          l.status === selectedStatus || (l._id.toString().startsWith('temp-') && selectedStatus === 'Draft')
        );
      }

      if (selectedDepartment) {
        processedLeaves = processedLeaves.filter(l => l.department === selectedDepartment);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        processedLeaves = processedLeaves.filter(l =>
          l.employeeName.toLowerCase().includes(query) ||
          l.employeeCode.toLowerCase().includes(query)
        );
      }

      console.log(`✅ Processed ${processedLeaves.length} employee records for display`);

      setLeaves(processedLeaves);
      setPagination({
        page: 1,
        limit: processedLeaves.length,
        total: processedLeaves.length,
        pages: 1,
      });
      calculateStats(processedLeaves);



    } catch (error) {
      console.error("❌ Error fetching leaves:", error);
      toast.error("Failed to load leave data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLeaveRecord = async (leaveId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/leaves/${leaveId}`);
      const data = await response.json();

      if (response.ok) {
        setFormData({
          employeeId: data.employeeId._id || data.employeeId,
          month: data.month,
          year: data.year,
          leaves: data.leaves || [],
          notes: data.notes || "",
          status: data.status,
        });

        const employeeData = {
          ...data.employeeId,
          employeeId: data.employeeCode,
          employeeName: data.employeeName,
          organization: data.organizationType,
          department: data.department,
        };
        setSelectedEmployee(employeeData);

        const orgId = data.organizationId?._id || data.organizationId;
        if (orgId) {
          setSelectedOrganization(orgId);
          fetchEmployees(orgId);
        }
      } else {
        console.error("Error fetching leave record:", data.error);
        toast.error("Error loading leave record");
      }
    } catch (error) {
      console.error("Error fetching leave record:", error);
      toast.error("An error occurred while loading the leave record");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leavesData) => {
    const stats = {
      totalEmployees: leavesData.length,
      totalPaidLeaves: 0,
      totalUnpaidLeaves: 0,
      totalDays: 0,
    };

    leavesData.forEach((leave) => {
      stats.totalPaidLeaves += leave.summary.paidLeaves || 0;
      stats.totalPaidLeaves += (leave.summary.halfDayPaidLeaves || 0) * 0.5;
      stats.totalUnpaidLeaves += leave.summary.unpaidLeaves || 0;
      stats.totalUnpaidLeaves += (leave.summary.halfDayUnpaidLeaves || 0) * 0.5;
      stats.totalDays += leave.summary.totalDays || 0;
    });

    setStats(stats);
  };



  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleAddLeave = () => {
    setIsEdit(false);
    setEditLeaveId(null);
    setFormData({
      employeeId: "",
      month: selectedMonth,
      year: selectedYear,
      leaves: [],
      notes: "",
      status: "Draft",
    });
    setSelectedEmployee(null);
    setSelectedOrganization(user?.organizationId || "");
    setDateRange({ fromDate: "", toDate: "", leaveType: "Paid", reason: "" });
    setErrors({});
    fetchEmployees(user?.organizationId || "");
    setShowModal(true);
  };

  const handleEditLeave = async (leaveId) => {
    const leave = leaves.find(l => l._id === leaveId);

    // Calculate current paid/unpaid from summary
    // Note: This matches how they are displayed in the grid
    const currentPaid = (leave.summary.paidLeaves || 0) + (leave.summary.halfDayPaidLeaves || 0) * 0.5;
    const currentUnpaid = (leave.summary.unpaidLeaves || 0) + (leave.summary.halfDayUnpaidLeaves || 0) * 0.5;

    setEditingLeaveId(leaveId);
    setEditValues({
      paid: currentPaid,
      unpaid: currentUnpaid
    });

    // Pre-fill form data for potential save
    setFormData({
      employeeId: leave.employeeId,
      month: selectedMonth,
      year: selectedYear,
      leaves: [], // Will be regenerated on save
      notes: leave.notes || "",
      status: leave.status || "Draft",
    });
  };

  const handleSaveInline = async () => {
    const leave = leaves.find(l => l._id === editingLeaveId);

    // Build leaves array from inline edit values
    const newLeaves = [];

    // Add paid leaves
    for (let i = 0; i < editValues.paid; i++) {
      // Use dates from original leave if available to preserve specifics, otherwise generate new
      // Ideally we should try to preserve existing dates if count matches or is less
      // But for "quick entry", generating sequential dates might be the intended behavior if just counts are changed
      // For now, consistent with previous 'temp' logic: generate sequential dates
      // IMPROVEMENT: We could try to retain existing dates if we are just changing counts, but that's complex without full UI
      newLeaves.push({
        date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        leaveType: "Paid",
        reason: "Quick entry",
      });
    }

    // Add unpaid leaves
    for (let i = 0; i < editValues.unpaid; i++) {
      newLeaves.push({
        date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i + 15).padStart(2, '0')}`,
        leaveType: "Unpaid",
        reason: "Quick entry",
      });
    }

    const saveData = {
      employeeId: leave.employeeId._id || leave.employeeId, // Handle both object and string
      month: selectedMonth,
      year: selectedYear,
      leaves: newLeaves,
      notes: leave.notes || "Quick entry from grid",
      status: leave.status || "Draft",
    };

    const isNew = editingLeaveId.toString().startsWith('temp-');
    await saveLeaveRecord(saveData, !isNew, isNew ? null : editingLeaveId);
    setEditingLeaveId(null);
  };

  const handleDeleteLeave = async (leaveId) => {
    // Don't allow deleting temp (unsaved) records
    if (leaveId.toString().startsWith('temp-')) {
      toast.error("Cannot delete an unsaved record");
      return;
    }

    if (!confirm("Are you sure you want to delete this leave record?")) return;

    try {
      const response = await fetch(`/api/v1/admin/payroll/leaves/${leaveId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Leave record deleted successfully");
        fetchLeaves();
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting leave:", error);
      toast.error("An error occurred while deleting the leave record");
    }
  };

  const clearFilters = () => {
    setSelectedOrganization(user?.organizationId || "");
    setSelectedStatus("");
    setSelectedDepartment("");
    setSearchQuery("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters =
    selectedStatus || searchQuery || selectedDepartment;

  const getStatusBadge = (status) => {
    const badges = {
      Draft: {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-500",
      },
      Approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        dot: "bg-green-500",
      },
      Rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        dot: "bg-red-500",
      },
    };
    const config = badges[status] || badges.Draft;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
        {status}
      </span>
    );
  };

  const formatMonthYear = (month, year) => {
    const monthName = months.find((m) => m.value === month)?.label || "";
    return `${monthName} ${year}`;
  };

  const handleOrganizationChange = (e) => {
    const orgId = e.target.value;
    setSelectedOrganization(orgId);
    setFormData((prev) => ({ ...prev, employeeId: "" }));
    setSelectedEmployee(null);
    fetchEmployees(orgId);
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setFormData((prev) => ({ ...prev, employeeId: empId }));
    const emp = employees.find((e) => e._id === empId);
    setSelectedEmployee(emp);
    if (errors.employeeId) {
      setErrors((prev) => ({ ...prev, employeeId: "" }));
    }
  };

  const handleAddLeaveEntry = () => {
    const newLeave = {
      date: "",
      leaveType: "Paid",
      reason: "",
    };
    setFormData((prev) => ({
      ...prev,
      leaves: [...prev.leaves, newLeave],
    }));
  };

  const handleAddDateRange = () => {
    if (!dateRange.fromDate || !dateRange.toDate) {
      toast.error("Please select both from and to dates");
      return;
    }
    const from = new Date(dateRange.fromDate);
    const to = new Date(dateRange.toDate);
    if (from > to) {
      toast.error("From date must be before or equal to To date");
      return;
    }
    const existingDates = new Set(formData.leaves.map((l) => l.date));
    const newLeaves = [];
    const skippedSundays = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0) {
        skippedSundays.push(dateStr);
      } else if (!existingDates.has(dateStr)) {
        newLeaves.push({
          date: dateStr,
          leaveType: dateRange.leaveType,
          reason: dateRange.reason,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (skippedSundays.length > 0) {
      toast.success(`Sundays excluded: ${skippedSundays.join(", ")}`);
    }
    if (newLeaves.length === 0) {
      toast.error(
        skippedSundays.length > 0
          ? "Only Sundays in range"
          : "All dates already exist"
      );
      return;
    }

    setPendingLeaves(newLeaves);
    setClassificationData({
      paidCount: newLeaves.length,
      unpaidCount: 0,
    });
    setShowClassificationModal(true);
  };

  const applyClassification = () => {
    const { paidCount, unpaidCount } = classificationData;
    if (paidCount + unpaidCount !== pendingLeaves.length) {
      toast.error(`Total must equal ${pendingLeaves.length} days`);
      return;
    }
    const classifiedLeaves = pendingLeaves.map((leave, index) => ({
      ...leave,
      leaveType: index < paidCount ? "Paid" : "Unpaid",
    }));
    setFormData((prev) => ({
      ...prev,
      leaves: [...prev.leaves, ...classifiedLeaves],
    }));
    setShowClassificationModal(false);
    setPendingLeaves([]);
    setDateRange({ fromDate: "", toDate: "", leaveType: "Paid", reason: "" });
    toast.success(`Added ${classifiedLeaves.length} leave entries`);
  };

  const handleLeaveChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedLeaves = [...prev.leaves];
      updatedLeaves[index] = { ...updatedLeaves[index], [field]: value };
      return { ...prev, leaves: updatedLeaves };
    });
  };

  const handleRemoveLeave = (index) => {
    setFormData((prev) => ({
      ...prev,
      leaves: prev.leaves.filter((_, i) => i !== index),
    }));
  };

  const calculateSummary = () => {
    let totalDays = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let halfDayPaid = 0;
    let halfDayUnpaid = 0;

    formData.leaves.forEach((leave) => {
      if (!leave.date) return;
      if (leave.leaveType === "Paid") {
        paidLeaves += 1;
        totalDays += 1;
      } else if (leave.leaveType === "Unpaid") {
        unpaidLeaves += 1;
        totalDays += 1;
      } else if (leave.leaveType === "Half-Day Paid") {
        halfDayPaid += 1;
        totalDays += 0.5;
      } else if (leave.leaveType === "Half-Day Unpaid") {
        halfDayUnpaid += 1;
        totalDays += 0.5;
      }
    });

    return {
      totalDays: totalDays.toFixed(1),
      paidLeaves: (paidLeaves + halfDayPaid * 0.5).toFixed(1),
      unpaidLeaves: (unpaidLeaves + halfDayUnpaid * 0.5).toFixed(1),
      fullPaid: paidLeaves,
      fullUnpaid: unpaidLeaves,
      halfDayPaid,
      halfDayUnpaid,
    };
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeId)
      newErrors.employeeId = "Please select an employee";
    if (!formData.month || !formData.year)
      newErrors.monthYear = "Please select month and year";
    if (formData.leaves.length === 0)
      newErrors.leaves = "Please add at least one leave entry";
    const invalidLeaves = formData.leaves.some((leave) => !leave.date);
    if (invalidLeaves) newErrors.leaves = "All leave entries must have a date";
    const dates = formData.leaves.map((l) => l.date).filter((d) => d);
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size)
      newErrors.leaves = "Duplicate leave dates found";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveLeaveRecord = async (data, isEdit, leaveId) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/v1/admin/payroll/leaves/${leaveId}` : "/api/v1/admin/payroll/leaves";
      const method = isEdit ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (response.ok) {
        toast.success(`Leave record ${isEdit ? "updated" : "created"} successfully!`);
        fetchLeaves();
        if (showModal) setShowModal(false);
      } else {
        toast.error(`Error: ${responseData.error}`);
      }
    } catch (error) {
      console.error("Error saving leave record:", error);
      toast.error("An error occurred while saving the leave record");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    await saveLeaveRecord(formData, isEdit, editLeaveId);
  };

  const summary = calculateSummary();

  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrganization(user.organizationId);
      fetchPayrollConfig(user.organizationId);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchLeaves();
  }, [
    selectedOrganization,
    selectedMonth,
    selectedYear,
    selectedStatus,
    selectedDepartment,
    searchQuery,
  ]);

  const renderLeaveRow = (leave, index) => {
    // Generate simple initials avatar bubble
    const getInitials = (name) => {
      if (!name) return "EE";
      return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
      <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors group/row">
        <td className="px-4 py-3 text-center text-slate-500 text-xs font-medium">
          {(pagination.page - 1) * pagination.limit + index + 1}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xs font-bold group-hover/row:scale-105 transition-transform">
              {getInitials(leave.employeeName)}
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800 tracking-tight">
                {leave.employeeName}
              </p>
              <span className="inline-flex px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider">
                ID: {leave.employeeCode}
              </span>
            </div>
          </div>
        </td>

        <td className="px-4 py-3">
          <span className="text-xs font-semibold text-slate-655">
            {leave.department}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          {editingLeaveId === leave._id ? (
            <input
              type="number"
              step="1"
              min="0"
              value={editValues.paid}
              onChange={(e) => setEditValues(prev => ({ ...prev, paid: parseInt(e.target.value) || 0 }))}
              className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-100">
              {(
                (leave.summary.paidLeaves || 0) +
                (leave.summary.halfDayPaidLeaves || 0) * 0.5
              ).toFixed(1)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {editingLeaveId === leave._id ? (
            <input
              type="number"
              step="1"
              min="0"
              value={editValues.unpaid}
              onChange={(e) => setEditValues(prev => ({ ...prev, unpaid: parseInt(e.target.value) || 0 }))}
              className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          ) : (
            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-rose-50 text-rose-700 rounded-xl font-bold text-xs border border-rose-100">
              {(
                (leave.summary.unpaidLeaves || 0) +
                (leave.summary.halfDayUnpaidLeaves || 0) * 0.5
              ).toFixed(1)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs border border-indigo-100">
            {editingLeaveId === leave._id
              ? (editValues.paid + editValues.unpaid).toFixed(1)
              : (leave.summary.totalDays || 0).toFixed(1)}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <div className="inline-flex flex-col items-center justify-center bg-slate-50/50 border border-slate-100 rounded-xl p-2 min-w-[5.5rem]">
            <div>
              <p className={`text-base font-extrabold tracking-tight ${(leave.annualLeaveBalance.remaining || 0) < 5
                ? 'text-rose-600'
                : (leave.annualLeaveBalance.remaining || 0) < 10
                  ? 'text-amber-600'
                  : 'text-emerald-600'
                }`}>
                {editingLeaveId === leave._id
                  ? Math.max(0, (leave.annualLeaveBalance.balanceAtMonthStart || 0) - editValues.unpaid).toFixed(1)
                  : (leave.annualLeaveBalance.remaining || 0).toFixed(1)
                }
              </p>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">Remaining</span>

            {/* Detailed breakdown */}
            <div className="space-y-0.5 pt-1.5 border-t border-slate-100 w-full mt-1.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500">
                <span>Quota:</span>
                <span>{leave.annualLeaveBalance.totalEntitled || payrollConfig?.annualPaidLeaveQuota || 31}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold">
                <span className="text-slate-500">YTD Used:</span>
                <span className="text-rose-500">{(leave.annualLeaveBalance.used || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {getStatusBadge(leave.status)}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {editingLeaveId === leave._id ? (
              <>
                <button
                  onClick={handleSaveInline}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100"
                  title="Save"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingLeaveId(null)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-rose-100"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleEditLeave(leave._id)}
                  className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                {!leave._id.toString().startsWith('temp-') && (
                  <button
                    onClick={() => handleDeleteLeave(leave._id)}
                    className="p-2 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Classification Modal */}
      {showClassificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  Classify Leave Days
                </h3>
                <button
                  onClick={() => setShowClassificationModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-slate-600 text-sm mt-2">
                You're adding{" "}
                <span className="font-bold text-indigo-600">
                  {pendingLeaves.length} days
                </span>{" "}
                of leave. How many should be paid vs unpaid?
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4 text-center">
                <p className="text-sm text-indigo-700 font-semibold mb-2">
                  Total Days to Add
                </p>
                <p className="text-4xl font-bold text-indigo-900">
                  {pendingLeaves.length}
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Paid Leave Days
                </label>
                <input
                  type="number"
                  min="0"
                  max={pendingLeaves.length}
                  value={classificationData.paidCount}
                  onChange={(e) => {
                    const paid = parseInt(e.target.value) || 0;
                    const maxPaid = pendingLeaves.length;
                    const validPaid = Math.min(Math.max(0, paid), maxPaid);
                    setClassificationData({
                      paidCount: validPaid,
                      unpaidCount: pendingLeaves.length - validPaid,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg text-lg font-semibold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Unpaid Leave Days
                </label>
                <input
                  type="number"
                  min="0"
                  max={pendingLeaves.length}
                  value={classificationData.unpaidCount}
                  onChange={(e) => {
                    const unpaid = parseInt(e.target.value) || 0;
                    const maxUnpaid = pendingLeaves.length;
                    const validUnpaid = Math.min(
                      Math.max(0, unpaid),
                      maxUnpaid
                    );
                    setClassificationData({
                      paidCount: pendingLeaves.length - validUnpaid,
                      unpaidCount: validUnpaid,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-lg font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Paid Days</p>
                    <p className="text-2xl font-bold text-green-600">
                      {classificationData.paidCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Unpaid Days</p>
                    <p className="text-2xl font-bold text-red-600">
                      {classificationData.unpaidCount}
                    </p>
                  </div>
                </div>
              </div>
              {classificationData.paidCount + classificationData.unpaidCount !==
                pendingLeaves.length && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      Total must equal {pendingLeaves.length} days
                    </p>
                  </div>
                )}
            </div>
            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowClassificationModal(false)}
                className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={applyClassification}
                disabled={
                  classificationData.paidCount +
                  classificationData.unpaidCount !==
                  pendingLeaves.length
                }
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Apply Classification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal - keeping existing modal code */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full my-8">
            {/* Modal content - keeping all existing modal JSX */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  {isEdit ? "Edit Leave Record" : "Add Leave Record"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-slate-600 text-sm mt-1">
                {isEdit
                  ? "Update employee leave details"
                  : "Create a new leave record with paid/unpaid classification"}
              </p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Employee Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Select Employee <span className="text-red-500">*</span>
                    </label>
                    {loadingEmployees ? (
                      <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        <span>Loading employees...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.employeeId}
                        onChange={handleEmployeeChange}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white ${errors.employeeId
                          ? "border-red-300"
                          : "border-slate-300"
                          }`}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.personalDetails.firstName}{" "}
                            {emp.personalDetails.lastName} ({emp.employeeId})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.employeeId && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.employeeId}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          month: parseInt(e.target.value),
                        }))
                      }
                      disabled={isEdit}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${isEdit ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                        } border-slate-300`}
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          year: parseInt(e.target.value),
                        }))
                      }
                      disabled={isEdit}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${isEdit ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                        } border-slate-300`}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">
                          Employee ID
                        </p>
                        <p className="text-indigo-900 font-medium">
                          {selectedEmployee.employeeId}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">
                          Organization
                        </p>
                        <p className="text-indigo-900 font-medium">
                          {selectedEmployee.organizationType || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">
                          Department
                        </p>
                        <p className="text-indigo-900 font-medium">
                          {selectedEmployee.jobDetails?.department || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-indigo-700 font-semibold mb-1">
                          Email
                        </p>
                        <p className="text-indigo-900 font-medium truncate">
                          {selectedEmployee.personalDetails?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Range Entry */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CalendarRange className="w-5 h-5 text-purple-600" />
                    Add Multiple Leaves (Date Range)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.fromDate}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          if (selectedDate.getDay() === 0) {
                            toast.error("Sunday is not a working day!");
                            return;
                          }
                          setDateRange((prev) => ({
                            ...prev,
                            fromDate: e.target.value,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.toDate}
                        onChange={(e) => {
                          const selectedDate = new Date(e.target.value);
                          if (selectedDate.getDay() === 0) {
                            toast.error("Sunday is not a working day!");
                            return;
                          }
                          setDateRange((prev) => ({
                            ...prev,
                            toDate: e.target.value,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={dateRange.reason}
                        onChange={(e) =>
                          setDateRange((prev) => ({
                            ...prev,
                            reason: e.target.value,
                          }))
                        }
                        placeholder="Reason for leaves"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddDateRange}
                        className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add & Classify
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leave Entries */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    Leave Entries
                    <span className="text-sm text-slate-600 ml-2">
                      {formData.leaves.length} leave
                      {formData.leaves.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  {formData.leaves.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                      <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm">
                        No leave entries yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {formData.leaves
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((leave, index) => (
                          <div
                            key={index}
                            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                  Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={
                                    leave.date ? leave.date.split("T")[0] : ""
                                  }
                                  onChange={(e) => {
                                    const selectedDate = new Date(
                                      e.target.value
                                    );
                                    if (selectedDate.getDay() === 0) {
                                      toast.error(
                                        "Sunday is not a working day!"
                                      );
                                      return;
                                    }
                                    handleLeaveChange(
                                      index,
                                      "date",
                                      e.target.value
                                    );
                                  }}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                  Leave Type{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={leave.leaveType}
                                  onChange={(e) =>
                                    handleLeaveChange(
                                      index,
                                      "leaveType",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  {leaveTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-slate-700">
                                  Reason
                                </label>
                                <input
                                  type="text"
                                  value={leave.reason}
                                  onChange={(e) =>
                                    handleLeaveChange(
                                      index,
                                      "reason",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Reason for leave"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLeave(index)}
                                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-2 font-medium"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  {errors.leaves && (
                    <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">
                        {errors.leaves}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleAddLeaveEntry}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Single Leave
                  </button>
                </div>

                {/* Summary */}
                {formData.leaves.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Leave Summary
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                          <span className="text-2xl font-bold text-blue-700">
                            {summary.totalDays}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Total Days
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-xl flex items-center justify-center border border-green-200">
                          <span className="text-2xl font-bold text-green-700">
                            {summary.fullPaid}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Paid Leaves
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-xl flex items-center justify-center border border-red-200">
                          <span className="text-2xl font-bold text-red-700">
                            {summary.fullUnpaid}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Unpaid Leaves
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center border border-blue-200">
                          <span className="text-2xl font-bold text-blue-700">
                            {summary.halfDayPaid}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Half-Day Paid
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 bg-orange-100 rounded-xl flex items-center justify-center border border-orange-200">
                          <span className="text-2xl font-bold text-orange-700">
                            {summary.halfDayUnpaid}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          Half-Day Unpaid
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEdit ? "Update Leave Record" : "Create Leave Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-14">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Leave & Quota Operations
            </h1>
            <p className="text-slate-500 text-sm">
              Track employee leaves with monthly quota ({payrollConfig?.annualPaidLeaveQuota || 0} days), manage paid and unpaid adjustments, and organize multi-organization team scheduling.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAddLeave}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" /> Add Leave Record
            </button>
          </div>
        </div>





        {/* Leave Records Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Table Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-white">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Leave Records</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Search employee by name or ID..."
                  className="w-full sm:w-[240px] bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-300 transition-colors"
                />
              </div>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 transition-colors cursor-pointer min-w-[140px]"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 transition-colors cursor-pointer min-w-[120px]"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(parseInt(e.target.value));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 transition-colors cursor-pointer"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-300 transition-colors cursor-pointer"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchLeaves(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-indigo-600 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 disabled:opacity-50 transition-all font-medium text-xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-600" : "text-slate-400"}`}
                />
                Refresh
              </button>
            </div>
          </div>


          {loading ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center p-4 border border-slate-100 rounded-lg gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No employees found
              </h3>
              <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? "Try adjusting your filters."
                  : "No active employees in the system."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                >
                  <FilterX className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                  <tr className="">
                    <th className="text-center px-4 py-4 min-w-[40px] text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      #
                    </th>
                    <th className="text-left px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Employee
                    </th>
                    <th className="text-left px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Department
                    </th>
                    <th className="text-center px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Paid Leaves
                    </th>
                    <th className="text-center px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Unpaid Leaves
                    </th>
                    <th className="text-center px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Days
                    </th>
                    <th className="text-center px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Monthly Balance
                    </th>
                    <th className="text-center px-4 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="text-right px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {leaves.map((leave, index) => renderLeaveRow(leave, index))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

