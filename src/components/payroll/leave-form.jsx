"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Save,
  X,
  Plus,
  Trash2,
  User,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  CalendarRange,
  Edit3,
  Loader2,
  Info,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "@/context/SessionContext";

export default function LeaveForm({ leaveId }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const isEdit = !!leaveId;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState("");

  // Get initial values from URL params
  const urlMonth = searchParams.get("month");
  const urlYear = searchParams.get("year");
  const urlOrg = searchParams.get("org");

  const [formData, setFormData] = useState({
    employeeId: "",
    month: urlMonth ? parseInt(urlMonth) : new Date().getMonth() + 1,
    year: urlYear ? parseInt(urlYear) : new Date().getFullYear(),
    leaves: [],
    notes: "",
    status: "Draft",
  });

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [errors, setErrors] = useState({});

  // Date range state for bulk entry
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: "",
    leaveType: "Paid",
    reason: "",
  });

  // Classification modal state
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [classificationData, setClassificationData] = useState({
    paidCount: 0,
    unpaidCount: 0,
  });

  // Leave types
  const leaveTypes = [
    { value: "Paid", label: "Paid Leave", color: "green" },
    { value: "Unpaid", label: "Unpaid Leave", color: "red" },
    { value: "Half-Day Paid", label: "Half-Day Paid", color: "blue" },
    { value: "Half-Day Unpaid", label: "Half-Day Unpaid", color: "orange" },
  ];

  // Months
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

  // Years
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // Status options
  const statusOptions = [
    { value: "Draft", label: "Draft", color: "slate" },
    { value: "Approved", label: "Approved", color: "green" },
    { value: "Rejected", label: "Rejected", color: "red" },
  ];

  // Fetch employees based on organization
  const fetchEmployees = async (orgId = "") => {
    try {
      setLoadingEmployees(true);

      const params = new URLSearchParams({
        limit: "1000",
        status: "Active",
      });

      if (orgId) {
        params.append("organizationId", orgId);
      }

      const response = await fetch(`/api/v1/admin/payroll/employees?${params}`);
      const data = await response.json();
      console.log("Fetched Employees:", data);
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

  // Load existing leave record
  const fetchLeaveRecord = async () => {
    try {
      setFetchLoading(true);

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

        setSelectedEmployee(data.employeeId);

        if (data.organizationType) {
          setSelectedOrganization(data.organizationType);
          fetchEmployees(data.organizationType);
        }
      } else {
        console.error("Error fetching leave record:", data.error);
        toast.error("Error loading leave record");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching leave record:", error);
      toast.error("An error occurred while loading the leave record");
      router.back();
    } finally {
      setFetchLoading(false);
    }
  };

  // Set selected organization to logged in user's organizationId
  useEffect(() => {
    if (user?.organizationId) {
      setSelectedOrganization(user.organizationId);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    if (isEdit) {
      fetchLeaveRecord();
    } else if (selectedOrganization) {
      fetchEmployees(selectedOrganization);
    }
  }, [isEdit, leaveId, selectedOrganization]);

  // Handle organization change
  const handleOrganizationChange = (e) => {
    const org = e.target.value;
    setSelectedOrganization(org);
    setFormData((prev) => ({ ...prev, employeeId: "" }));
    setSelectedEmployee(null);
  };

  // Handle employee selection
  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    setFormData((prev) => ({ ...prev, employeeId: empId }));

    const emp = employees.find((e) => e._id === empId);
    setSelectedEmployee(emp);

    if (errors.employeeId) {
      setErrors((prev) => ({ ...prev, employeeId: "" }));
    }
  };

  // Add new leave entry (single date)
  const handleAddLeave = () => {
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

  // Generate leaves from date range and show classification modal
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

    // Check if dates already exist
    const existingDates = new Set(formData.leaves.map((l) => l.date));

    // Generate leave entries for each day in range (excluding Sundays)
    const newLeaves = [];
    const skippedSundays = [];
    const currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Skip Sundays
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

    // Show alert if Sundays were in range
    if (skippedSundays.length > 0) {
      toast.success(`⚠️ Sundays are not working days and have been excluded!\n\n${skippedSundays.length} Sunday(s) skipped: ${skippedSundays.join(", ")}`);
    }

    if (newLeaves.length === 0) {
      if (skippedSundays.length > 0) {
        toast.error("No working days in this range (only Sundays)");
      } else {
        toast.error("All dates in this range already exist");
      }
      return;
    }

    // Store pending leaves and show classification modal
    setPendingLeaves(newLeaves);
    setClassificationData({
      paidCount: newLeaves.length,
      unpaidCount: 0,
    });
    setShowClassificationModal(true);
  };

  // Apply classification to pending leaves
  const applyClassification = () => {
    const { paidCount, unpaidCount } = classificationData;

    if (paidCount + unpaidCount !== pendingLeaves.length) {
      toast.error(`Total must equal ${pendingLeaves.length} days`);
      return;
    }

    // Classify leaves: first N as paid, rest as unpaid
    const classifiedLeaves = pendingLeaves.map((leave, index) => ({
      ...leave,
      leaveType: index < paidCount ? "Paid" : "Unpaid",
    }));

    // Add to form data
    setFormData((prev) => ({
      ...prev,
      leaves: [...prev.leaves, ...classifiedLeaves],
    }));

    // Reset and close modal
    setShowClassificationModal(false);
    setPendingLeaves([]);
    setDateRange({
      fromDate: "",
      toDate: "",
      leaveType: "Paid",
      reason: "",
    });

    toast.success(`Added ${classifiedLeaves.length} leave entries (${paidCount} paid, ${unpaidCount} unpaid)`);
  };

  // Update leave entry
  const handleLeaveChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedLeaves = [...prev.leaves];
      updatedLeaves[index] = {
        ...updatedLeaves[index],
        [field]: value,
      };
      return { ...prev, leaves: updatedLeaves };
    });
  };

  // Remove leave entry
  const handleRemoveLeave = (index) => {
    setFormData((prev) => ({
      ...prev,
      leaves: prev.leaves.filter((_, i) => i !== index),
    }));
  };

  // Calculate summary
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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = "Please select an employee";
    }

    if (!formData.month || !formData.year) {
      newErrors.monthYear = "Please select month and year";
    }

    if (formData.leaves.length === 0) {
      newErrors.leaves = "Please add at least one leave entry";
    }

    const invalidLeaves = formData.leaves.some((leave) => !leave.date);
    if (invalidLeaves) {
      newErrors.leaves = "All leave entries must have a date";
    }

    const dates = formData.leaves.map((l) => l.date).filter((d) => d);
    const uniqueDates = new Set(dates);
    if (dates.length !== uniqueDates.size) {
      newErrors.leaves = "Duplicate leave dates found";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const url = isEdit
        ? `/api/v1/admin/payroll/leaves/${leaveId}`
        : "/api/v1/admin/payroll/leaves";

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Leave record ${isEdit ? "updated" : "created"} successfully!`);
        router.push("/admin/payroll/leaves");
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error saving leave record:", error);
      toast.error("An error occurred while saving the leave record");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const summary = calculateSummary();

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading leave record...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      {/* Classification Modal */}
      {showClassificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-yellow-600" />
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
                You're adding <span className="font-bold text-yellow-600">{pendingLeaves.length} days</span> of leave.
                How many should be paid vs unpaid?
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Total Days Display */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-700 font-semibold mb-2">Total Days to Add</p>
                <p className="text-4xl font-bold text-yellow-900">{pendingLeaves.length}</p>
              </div>

              {/* Paid Count */}
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
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg text-lg font-semibold text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>

              {/* Unpaid Count */}
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
                    const validUnpaid = Math.min(Math.max(0, unpaid), maxUnpaid);
                    setClassificationData({
                      paidCount: pendingLeaves.length - validUnpaid,
                      unpaidCount: validUnpaid,
                    });
                  }}
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-lg text-lg font-semibold text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                />
              </div>

              {/* Summary */}
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

              {/* Validation Message */}
              {classificationData.paidCount + classificationData.unpaidCount !== pendingLeaves.length && (
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
                className="px-6 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyClassification}
                disabled={classificationData.paidCount + classificationData.unpaidCount !== pendingLeaves.length}
                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Apply Classification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isEdit ? "Edit Leave Record" : "Add Leave Record"}
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {isEdit
                    ? "Update employee leave details"
                    : "Create a new leave record with paid/unpaid classification"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <form onSubmit={handleSubmit}>
          {/* Employee Selection */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Employee & Period
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Select employee and leave period details
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Employee Selection */}
                <div className="md:col-span-1 space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  {loadingEmployees ? (
                    <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                      <span>Loading employees...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.employeeId}
                      onChange={handleEmployeeChange}
                      disabled={isEdit || !selectedOrganization}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${isEdit || !selectedOrganization
                          ? "bg-slate-100 cursor-not-allowed"
                          : "bg-white"
                        } ${errors.employeeId
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-slate-300"
                        }`}
                    >
                      <option value="">
                        {selectedOrganization
                          ? "Select Employee"
                          : "Select organization first"}
                      </option>
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

                {/* Month Selection */}
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
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${isEdit ? "bg-slate-100 cursor-not-allowed" : "bg-white"
                      } border-slate-300`}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
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
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${isEdit ? "bg-slate-100 cursor-not-allowed" : "bg-white"
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

              {/* Selected Employee Info */}
              {selectedEmployee && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-yellow-700 font-semibold mb-1">
                        Employee ID
                      </p>
                      <p className="text-yellow-900 font-medium">
                        {selectedEmployee.employeeId}
                      </p>
                    </div>
                    <div>
                      <p className="text-yellow-700 font-semibold mb-1">
                        Organization
                      </p>
                      <p className="text-yellow-900 font-medium">
                        {selectedEmployee.organizationType || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-yellow-700 font-semibold mb-1">
                        Department
                      </p>
                      <p className="text-yellow-900 font-medium">
                        {selectedEmployee.jobDetails?.department || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-yellow-700 font-semibold mb-1">
                        Email
                      </p>
                      <p className="text-yellow-900 font-medium truncate">
                        {selectedEmployee.personalDetails?.email || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Range Entry */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CalendarRange className="w-4 h-4 text-white" />
                </div>
                Add Multiple Leaves (Date Range)
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Add date range and classify paid/unpaid distribution
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* From Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.fromDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const dayOfWeek = selectedDate.getDay();

                      if (dayOfWeek === 0) {
                        toast.error("⚠️ Sunday is not a working day! Please select a weekday (Monday-Saturday).");
                        return;
                      }

                      setDateRange((prev) => ({
                        ...prev,
                        fromDate: e.target.value,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Sundays excluded
                  </p>
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.toDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const dayOfWeek = selectedDate.getDay();

                      if (dayOfWeek === 0) {
                        toast.error("⚠️ Sunday is not a working day! Please select a weekday (Monday-Saturday).");
                        return;
                      }

                      setDateRange((prev) => ({
                        ...prev,
                        toDate: e.target.value,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Sundays excluded
                  </p>
                </div>

                {/* Reason */}
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Add Button */}
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
          </div>

          {/* Leave Entries */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  Leave Entries
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  {formData.leaves.length} leave{formData.leaves.length !== 1 ? 's' : ''} added
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLeave}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Single Leave
              </button>
            </div>

            <div className="p-6">
              {formData.leaves.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No leave entries yet
                  </h3>
                  <p className="text-slate-500 text-sm mb-6">
                    Use date range selector above or click "Add Single Leave" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.leaves
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((leave, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Date */}
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
                                const selectedDate = new Date(e.target.value);
                                const dayOfWeek = selectedDate.getDay();

                                if (dayOfWeek === 0) {
                                  toast.error("⚠️ Sunday is not a working day! Please select a weekday (Monday-Saturday).");
                                  return;
                                }

                                handleLeaveChange(
                                  index,
                                  "date",
                                  e.target.value
                                );
                              }}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                            />
                          </div>

                          {/* Leave Type */}
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-slate-700">
                              Leave Type <span className="text-red-500">*</span>
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
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                            >
                              {leaveTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Reason */}
                          <div className="md:col-span-1 space-y-2">
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
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                            />
                          </div>

                          {/* Remove Button */}
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveLeave(index)}
                              className="w-full md:w-auto px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors flex items-center justify-center gap-2 font-medium"
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
                  <span className="text-sm text-red-700">{errors.leaves}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {formData.leaves.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Leave Summary
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Overview of leave distribution
                </p>
              </div>

              <div className="p-6">
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

                <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 mb-1">
                        Total Paid (including half-days)
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        {summary.paidLeaves} days
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 mb-1">
                        Total Unpaid (including half-days)
                      </p>
                      <p className="text-lg font-bold text-red-700">
                        {summary.unpaidLeaves} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                Additional Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  placeholder="Add any additional notes or remarks..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs text-yellow-700">
                    Set to "Approved" to finalize and update annual leave balance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? "Update Leave Record" : "Create Leave Record"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}