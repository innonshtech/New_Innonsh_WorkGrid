"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  UserCheck,
  UserX,
  Clock,
  Users,
  Plus,
  Search,
  Filter,
  Loader2,
  User,
  Layers,
  ChevronDown,
  ChevronUp,
  Building2,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  History,
  Sparkles,
  Send,
  XCircle,
  Cpu,
  ArrowRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AttendanceAnalytics from "./attendance/AttendanceAnalytics";
import AttendanceInsights from "./attendance/AttendanceInsights";
import AttendanceFilters from "./attendance/AttendanceFilters";
import AttendanceTable from "./attendance/AttendanceTable";
import MonthlyAttendanceTable from "./attendance/MonthlyAttendanceTable";
import EmployeeDetailsDrawer from "./attendance/EmployeeDetailsDrawer";
import { useSession } from "@/context/SessionContext";
import { exportToExcel } from "@/utils/exportToExcel";
import MarkAttendance from "./attendance/MarkAttendance";
import EmployeeAttendanceInline from "./attendance/EmployeeAttendanceInline";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function AttendanceDashboard() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  // View mode: 'weekly' or 'monthly'
  const [viewMode, setViewMode] = useState("weekly");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Organization grouping state
  const [groupByOrganization, setGroupByOrganization] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState({});
  
  // Regularization States
  const [showRegModal, setShowRegModal] = useState(false);
  const [regData, setRegData] = useState({
      date: new Date(),
      type: 'Absent Correction',
      reason: '',
      approverId: '',
      halfDaySlot: 'None',
      requestedTimeStart: '',
      requestedTimeEnd: ''
  });

  const [regLoading, setRegLoading] = useState(false);
  const [allEmployeesForSelect, setAllEmployeesForSelect] = useState([]);
  const [approverSearchTerm, setApproverSearchTerm] = useState('');
  const [approverDropdownOpen, setApproverDropdownOpen] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [otRequests, setOtRequests] = useState([]);
  const [loadingOT, setLoadingOT] = useState(false);
  // New Filter States
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { user } = useSession();
  const isAdminView = user?.role === "admin" || user?.role === "super_admin" || user?.permissions?.includes("attendance.view");
  const isEmployeeView = !isAdminView;

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
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchOrganizations = async () => {
    if (isEmployeeView) return; // Employees don't need to fetch all orgs
    try {
      const baseUrl = '/api/v1/admin';

      const response = await fetch(`${baseUrl}/organizations?limit=1000`);
      const data = await response.json();

      if (response.ok) {
        const orgs = data.organizations
          .filter((org) => org.name)
          .map((org) => ({
            value: org._id,
            label: org.name,
            name: org.name,
          }));

        setOrganizations(orgs);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    if (isEmployeeView) return; // Employees don't need to fetch all employees
    try {
      const params = new URLSearchParams({
        limit: "1000",
        status: "Active",
      });

      if (selectedOrganization) {
        params.append("organizationId", selectedOrganization);
      }

      const baseUrl = '/api/v1/admin';
      const response = await fetch(`${baseUrl}/employees?${params}`);
      const data = await response.json();


      if (isAdminView) {
        setEmployees(data.data || data.employees || []);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    }
  };

  // Fetch attendance based on view mode
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (viewMode === "daily") {
        params.append("date", selectedDate);
      } else if (viewMode === "weekly") {
        // Weekly view - get start (Monday) and end (Sunday) of the week containing selectedDate
        const curr = new Date(selectedDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        
        const startDate = new Date(curr.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(curr.setDate(diff + 6));
        endDate.setHours(23, 59, 59, 999);
        
        params.append("startDate", startDate.toISOString());
        params.append("endDate", endDate.toISOString());
      } else {
        // Monthly view
        const startDate = new Date(selectedYear, selectedMonth - 1, 1);
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
        params.append("startDate", startDate.toISOString());
        params.append("endDate", endDate.toISOString());
      }

      if (selectedOrganization) {
        params.append("organizationId", selectedOrganization);
      }

      params.append("limit", "1000"); // Ensure we get all records for the month/week
      const baseUrl = isEmployeeView ? '/api/v1/employee' : '/api/v1/admin';
      const response = await fetch(
        `${baseUrl}/attendance?${params.toString()}`
      );
      const data = await response.json();

      if (isAdminView) {
        const filteredAttendance = data.attendance || [];
        console.log("Fetched attendance:", filteredAttendance);
        setAttendance(filteredAttendance);
      } else if (user?.role === "employee" || user?.role === "attendance_only") {
        // Employees see their own records returned by /api/v1/employee/attendance
        const myAttendance = (data.attendance || []).filter(record => 
          record.employee?._id === user.id || record.employee === user.id
        );
        setAttendance(myAttendance);
      } else {
        setAttendance([]);
      }

    } catch (error) {
      console.error("Error fetching attendance:", error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (user) fetchEmployees();
  }, [user, selectedOrganization]);

  useEffect(() => {
    if (viewMode === "weekly") {
      fetchAttendance();
    }
  }, [selectedDate, selectedOrganization, viewMode]);

  useEffect(() => {
    if (viewMode === "monthly") {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, selectedOrganization, viewMode]);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/v1/employee/attendance/regularize');
      const data = await res.json();
      if (res.ok) {
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchOTRequests = async () => {
    if (user?.role !== 'employee') return;
    try {
      setLoadingOT(true);
      const response = await fetch('/api/v1/employee/payroll/overtime');
      const data = await response.json();

      if (response.ok) {
        setOtRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching OT requests:", error);
    } finally {
      setLoadingOT(false);
    }
  };

  const fetchAllEmployeesForApprover = async () => {
      try {
          const res = await fetch('/api/v1/employee/leaves/approvers');
          const data = await res.json();
          setAllEmployeesForSelect(data.data || []);
      } catch (error) {
          console.error("Error fetching employees for approver list:", error);
      }
  };

  const submitRegularization = async () => {
      if (!regData.reason || !regData.approverId) {
          toast.error("Please provide a reason and select an approver");
          return;
      }
      try {
          setRegLoading(true);
          
          const payload = { ...regData };
          if (regData.type === 'Half-Day' && regData.requestedTimeStart && regData.requestedTimeEnd) {
              payload.requestedTime = `${regData.requestedTimeStart} - ${regData.requestedTimeEnd}`;
          }

          const res = await fetch('/api/v1/employee/attendance/regularize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
              toast.success("Request submitted successfully");
              setShowRegModal(false);
              setRegData({ date: new Date(), type: 'Absent Correction', reason: '', approverId: '', halfDaySlot: 'None', requestedTimeStart: '', requestedTimeEnd: '' });
              setApproverSearchTerm('');
              fetchMyRequests();
          } else {
              throw new Error(data.error || "Failed to submit request");
          }
      } catch (error) {
          toast.error(error.message);
      } finally {
          setRegLoading(false);
      }
  };

  // Helper function to get organization name from record
  const getOrganizationName = (record) => {
    if (record.employee?.jobDetails?.organizationId?.name) {
      return record.employee.jobDetails.organizationId.name;
    }
    if (record.employee?.jobDetails?.organizationType) {
      return record.employee.jobDetails.organizationType;
    }
    return "Unassigned";
  };

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  // Get monthly attendance data grouped by employee
  const getMonthlyAttendanceByEmployee = () => {
    const employeeMap = {};

    attendance.forEach((record) => {
      const empId = record.employee?._id;
      if (!empId) return;

      if (!employeeMap[empId]) {
        employeeMap[empId] = {
          employee: record.employee,
          organization: getOrganizationName(record),
          records: {},
          stats: {
            totalPresent: 0,
            totalAbsent: 0,
            totalLeave: 0,
            totalHours: 0,
            totalOvertime: 0,
          },
        };
      }

      const dateObj = new Date(record.date);
      const day = dateObj.getDate();
      // console.log(`Debug: Date: ${record.date}, Parsed Day: ${day}, Status: ${record.status}`);
      employeeMap[empId].records[day] = record;

      // Update stats
      if (record.status === "Present") employeeMap[empId].stats.totalPresent++;
      else if (record.status === "Absent")
        employeeMap[empId].stats.totalAbsent++;
      else if (record.status === "Leave") employeeMap[empId].stats.totalLeave++;

      if (record.totalHours) {
        employeeMap[empId].stats.totalHours += parseFloat(record.totalHours);
      }

      if (record.overtimeHours) {
        employeeMap[empId].stats.totalOvertime += parseFloat(
          record.overtimeHours
        );
      }
    });

    return Object.values(employeeMap);
  };

  // Group monthly attendance by organization
  const getGroupedMonthlyAttendance = () => {
    const employeeData = getMonthlyAttendanceByEmployee();
    const grouped = {};

    employeeData.forEach((empData) => {
      const orgName = empData.organization;

      if (!grouped[orgName]) {
        grouped[orgName] = {
          name: orgName,
          employees: [],
          count: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLeave: 0,
          totalHours: 0,
          totalOvertime: 0,
        };
      }

      grouped[orgName].employees.push(empData);
      grouped[orgName].count++;
      grouped[orgName].totalPresent += empData.stats.totalPresent;
      grouped[orgName].totalAbsent += empData.stats.totalAbsent;
      grouped[orgName].totalLeave += empData.stats.totalLeave;
      grouped[orgName].totalHours += empData.stats.totalHours;
      grouped[orgName].totalOvertime += empData.stats.totalOvertime;
    });

    return Object.values(grouped).sort((a, b) => {
      if (a.name === "Unassigned") return 1;
      if (b.name === "Unassigned") return -1;
      return a.name.localeCompare(b.name);
    });
  };

  // Group attendance by organization (for daily view)
  const getGroupedAttendance = () => {
    const grouped = {};

    attendance.forEach((record) => {
      const orgName = getOrganizationName(record);

      if (!grouped[orgName]) {
        grouped[orgName] = {
          name: orgName,
          records: [],
          count: 0,
          present: 0,
          absent: 0,
          leave: 0,
        };
      }

      grouped[orgName].records.push(record);
      grouped[orgName].count++;

      if (record.status === "Present") grouped[orgName].present++;
      else if (record.status === "Absent") grouped[orgName].absent++;
      else if (record.status === "Leave") grouped[orgName].leave++;
    });

    const groupedArray = Object.values(grouped).sort((a, b) => {
      if (a.name === "Unassigned") return 1;
      if (b.name === "Unassigned") return -1;
      return a.name.localeCompare(b.name);
    });

    return groupedArray;
  };

  // Toggle organization expansion
  const toggleOrganization = (orgName) => {
    setExpandedOrgs((prev) => ({
      ...prev,
      [orgName]: !prev[orgName],
    }));
  };

  // Toggle employee expansion (for monthly view)
  const toggleEmployee = (empId) => {
    setExpandedEmployees((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  // Expand/Collapse all
  const expandAllOrganizations = () => {
    const allExpanded = {};
    if (viewMode === "daily") {
      getGroupedAttendance().forEach((org) => {
        allExpanded[org.name] = true;
      });
    } else {
      getGroupedMonthlyAttendance().forEach((org) => {
        allExpanded[org.name] = true;
      });
    }
    setExpandedOrgs(allExpanded);
  };

  const collapseAllOrganizations = () => {
    setExpandedOrgs({});
  };

  const expandAllEmployees = () => {
    const allExpanded = {};
    getMonthlyAttendanceByEmployee().forEach((empData) => {
      allExpanded[empData.employee._id] = true;
    });
    setExpandedEmployees(allExpanded);
  };

  const collapseAllEmployees = () => {
    setExpandedEmployees({});
  };

  // Toggle grouping mode
  const handleGroupToggle = () => {
    const newGroupState = !groupByOrganization;
    setGroupByOrganization(newGroupState);

    if (newGroupState) {
      setTimeout(() => {
        expandAllOrganizations();
      }, 100);
    }
  };

  // Calculate statistics
  const calculateStatistics = () => {
    const recordsToUse = attendance;
    
    if (viewMode === "daily") {
      const presentToday = recordsToUse.filter(
        (record) => record.status === "Present" || record.status === "Half-day"
      ).length;
      const absentToday = recordsToUse.filter(
        (record) => record.status === "Absent"
      ).length;
      const leaveToday = recordsToUse.filter(
        (record) => record.status === "Leave"
      ).length;
      const lateToday = recordsToUse.filter(
        (record) => record.lateMinutes > 0
      ).length;
      const missingPunches = recordsToUse.filter(
        (record) => record.checkIn && !record.checkOut
      ).length;

      return {
        present: presentToday,
        absent: absentToday,
        leave: leaveToday,
        total: employees.length,
        late: lateToday,
        missingPunches: missingPunches,
        overtimeCount: recordsToUse.filter(r => r.overtimeHours > 0).length,
        attendancePercentage: employees.length > 0 ? ((presentToday / employees.length) * 100).toFixed(1) : 0
      };
    } else {
      // Monthly stats
      const employeeData = getMonthlyAttendanceByEmployee();
      const totalPresent = employeeData.reduce(
        (sum, emp) => sum + emp.stats.totalPresent,
        0
      );
      const totalAbsent = employeeData.reduce(
        (sum, emp) => sum + emp.stats.totalAbsent,
        0
      );
      const totalLeave = employeeData.reduce(
        (sum, emp) => sum + emp.stats.totalLeave,
        0
      );
      const totalHours = employeeData.reduce(
        (sum, emp) => sum + emp.stats.totalHours,
        0
      );
      const totalOvertime = employeeData.reduce(
        (sum, emp) => sum + emp.stats.totalOvertime,
        0
      );

      return {
        present: totalPresent,
        absent: totalAbsent,
        leave: totalLeave,
        total: employeeData.length,
        totalHours: totalHours.toFixed(1),
        totalOvertime: totalOvertime.toFixed(1),
        late: employeeData.filter(e => Object.values(e.records).some(r => r.lateMinutes > 0)).length,
        missingPunches: employeeData.filter(e => Object.values(e.records).some(r => r.checkIn && !r.checkOut)).length,
        overtimeCount: employeeData.filter(e => e.stats.totalOvertime > 0).length,
        attendancePercentage: employeeData.length > 0 ? ((totalPresent / (employeeData.length * (viewMode === "weekly" ? 7 : 30))) * 100).toFixed(1) : 0
      };
    }
  };

  // Prepare data for insights
  const prepareTrendData = () => {
    // Last 7 days or current month days
    const data = [];
    if (viewMode === 'weekly') {
        // Mocking some trend for weekly view if not enough history
        return [
            { date: 'Mon', present: 45 },
            { date: 'Tue', present: 52 },
            { date: 'Wed', present: 48 },
            { date: 'Thu', present: 61 },
            { date: 'Fri', present: 55 },
            { date: 'Sat', present: 30 },
            { date: 'Sun', present: 10 },
        ];
    }
    
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    for (let i = 1; i <= daysInMonth; i++) {
        const presentCount = attendance.filter(r => new Date(r.date).getDate() === i && r.status === 'Present').length;
        data.push({ date: i.toString(), present: presentCount });
    }
    return data;
  };

  const prepareDeptData = () => {
    const depts = {};
    attendance.forEach(r => {
        const dept = r.employee?.jobDetails?.department || 'Other';
        if (!depts[dept]) depts[dept] = { name: dept, present: 0, absent: 0 };
        if (r.status === 'Present') depts[dept].present++;
        else if (r.status === 'Absent') depts[dept].absent++;
    });
    return Object.values(depts);
  };

  const prepareRatioData = () => {
    const stats = calculateStatistics();
    return [
      { name: 'Present', value: stats.present },
      { name: 'Absent', value: stats.absent },
      { name: 'On Leave', value: stats.leave },
    ];
  };

  const stats = calculateStatistics();

  // Filter attendance
  const filteredAttendance = attendance.filter((record) => {
    const fullName =
      `${record.employee?.personalDetails?.firstName} ${record.employee?.personalDetails?.lastName}`.toLowerCase();
    const employeeId = record.employee?.employeeId?.toLowerCase() || "";
    const department = record.employee?.jobDetails?.department || "";
    
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         employeeId.includes(searchTerm.toLowerCase());
    const matchesDept = !selectedDepartment || department === selectedDepartment;
    const matchesStatus = !selectedStatus || record.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const uniqueDepartments = [...new Set(employees.map(e => e.jobDetails?.department).filter(Boolean))];

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  // Export function
  const handleExport = async (format = 'excel') => {
    try {
      setExportLoading(true);
      let exportData = [];

      if (viewMode === "weekly") {
        const employeeData = getMonthlyAttendanceByEmployee();
        exportData = employeeData.map((empData) => ({
            "Employee ID": empData.employee?.employeeId || "N/A",
            "Employee Name": `${empData.employee?.personalDetails?.firstName || ""
              } ${empData.employee?.personalDetails?.lastName || ""}`.trim(),
            Organization: empData.organization,
            "Total Present": empData.stats.totalPresent,
            "Total Absent": empData.stats.totalAbsent,
            "Total Leave": empData.stats.totalLeave,
            "Total Hours": empData.stats.totalHours.toFixed(2),
            "Overtime Hours": empData.stats.totalOvertime.toFixed(2),
        }));
      } else {
        const employeeData = getMonthlyAttendanceByEmployee();
        exportData = employeeData.map((empData) => ({
            "Employee ID": empData.employee?.employeeId || "N/A",
            "Employee Name": `${empData.employee?.personalDetails?.firstName || ""
              } ${empData.employee?.personalDetails?.lastName || ""}`.trim(),
            Organization: empData.organization,
            "Total Present": empData.stats.totalPresent,
            "Total Absent": empData.stats.totalAbsent,
            "Total Leave": empData.stats.totalLeave,
            "Total Hours": empData.stats.totalHours.toFixed(2),
            "Overtime Hours": empData.stats.totalOvertime.toFixed(2),
        }));
      }

      const filename = `attendance_${viewMode}_${new Date().getTime()}`;

      if (format === 'excel') {
        exportToExcel(exportData, filename);
      } else if (format === 'csv') {
        const csvContent = "data:text/csv;charset=utf-8," + 
          [Object.keys(exportData[0]).join(","), ...exportData.map(row => Object.values(row).join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
      } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const autoTable = (await import('jspdf-autotable')).default;
        const doc = new jsPDF();
        doc.text("Attendance Report", 14, 15);
        autoTable(doc, {
          head: [Object.keys(exportData[0])],
          body: exportData.map(row => Object.values(row)),
          startY: 20,
        });
        doc.save(`${filename}.pdf`);
      }

      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Error exporting data");
    } finally {
      setExportLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    return new Date(time).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      Present: "bg-green-50 text-green-700 border-green-200",
      Absent: "bg-red-50 text-red-700 border-red-200",
      "Half-day": "bg-yellow-50 text-yellow-700 border-yellow-200",
      Leave: "bg-slate-50 text-blue-700 border-blue-200",
      Weekend: "bg-slate-50 text-slate-700 border-slate-200",
      Holiday: "bg-purple-50 text-purple-700 border-purple-200",
      WFH: "bg-teal-50 text-teal-700 border-teal-200",
    };

    const color = statusConfig[status] || statusConfig.Absent;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${color}`}
      >
        {status}
      </span>
    );
  };

  // Month navigation
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">
            Loading attendance data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Simple Text Header matching Image 2 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {isAdminView ? "Attendance Management" : "My Attendance Dashboard"}
            </h1>
            <p className="text-slate-500 text-sm">
              {isAdminView 
                ? "Track and manage employee attendance records, handle status corrections, and export complete statutory logs." 
                : "View clock-in schedules, analyze monthly hours, and submit regularization requests instantly."
              }
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                router.push(isEmployeeView ? "/employee/attendance/add-attendance" : "/admin/attendance/add-attendance")
              }
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Attendance Record
            </button>
          </div>
        </div>

        {/* Mark Attendance Section (Visible only for employees) */}
        {!isAdminView && (
          <div className="mb-8">
            <MarkAttendance onAttendanceMarked={fetchAttendance} />
          </div>
        )}



        {/* Employee Details Side Drawer */}
        <EmployeeDetailsDrawer 
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          record={selectedRecord}
        />

        {/* WEEKLY, MONTHLY & DAILY VIEW CONTENT */}
        {(viewMode === "monthly" || viewMode === "weekly" || viewMode === "daily") && (
          <MonthlyAttendanceTable
            employeeData={getMonthlyAttendanceByEmployee()}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            months={months}
            years={years}
            onRefresh={fetchAttendance}
            refreshing={loading}
            onViewDetails={(empData) => {
              setSelectedRecord(empData.records?.[0] || null);
              setIsDrawerOpen(true);
            }}
            onRegularize={(empData) => {
              setRegData({ ...regData, type: 'Absent Correction' });
              setShowRegModal(true);
            }}
          />
        )}

      {isEmployeeView && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <History className="w-5 h-5" />
                      </div>
                      <div>
                          <h2 className="text-lg font-black text-slate-900">My Requests</h2>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Track pending and approved corrections</p>
                      </div>
                  </div>
              </div>
              <div className="p-0 overflow-x-auto">
                  {loadingRequests ? (
                      <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                  ) : myRequests.length === 0 ? (
                      <div className="p-8 text-center text-sm font-medium text-slate-500">No requests submitted yet.</div>
                  ) : (
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-100">
                                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">Reason</th>
                                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Approver</th>
                                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {myRequests.map((req) => (
                                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="p-4">
                                          <p className="text-sm font-bold text-slate-900">{new Date(req.date).toDateString()}</p>
                                          {req.type === 'Half-Day' && (
                                              <p className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 inline-block px-1.5 rounded mt-1">{req.halfDaySlot}</p>
                                          )}
                                      </td>
                                      <td className="p-4">
                                          <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-700">{req.type}</span>
                                      </td>
                                      <td className="p-4 max-w-[200px]">
                                          <p className="text-xs text-slate-600 font-medium truncate" title={req.reason}>{req.reason}</p>
                                      </td>
                                      <td className="p-4">
                                          <p className="text-xs font-bold text-slate-700">{req.approver?.personalDetails?.firstName} {req.approver?.personalDetails?.lastName}</p>
                                      </td>
                                      <td className="p-4 text-right">
                                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
                                              req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                              req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                              'bg-amber-50 text-amber-600 border border-amber-100'
                                          }`}>
                                              {req.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>
      )}




      {showRegModal && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
                  <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                  <History className="w-6 h-6" />
                              </div>
                              <div>
                                  <h3 className="text-xl font-black text-slate-900">Attendance Request</h3>
                                  <p className="text-xs text-slate-500 font-medium">Digital Correction & Half-Day Workflow</p>
                              </div>
                          </div>
                          <button onClick={() => setShowRegModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                              <XCircle className="w-6 h-6 text-slate-400" />
                          </button>
                      </div>

                      <div className="space-y-6">
                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                  Your request will be sent to the selected approver. Once approved, 
                                  your attendance for <strong>{new Date(regData.date).toDateString()}</strong> will be updated.
                              </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Type</label>
                                  <select 
                                      value={regData.type}
                                      onChange={(e) => setRegData({...regData, type: e.target.value})}
                                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                  >
                                      <option value="Absent Correction">Absent Correction (Present)</option>
                                      <option value="Half-Day">Half-Day (Paid)</option>
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Date</label>
                                  <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed">
                                      {new Date(regData.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                  </div>
                              </div>
                          </div>

                          {regData.type === 'Half-Day' && (
                              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Half-Day Slot</label>
                                      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                                          <button 
                                              type="button"
                                              onClick={() => setRegData({...regData, halfDaySlot: 'First Half'})}
                                              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${regData.halfDaySlot === 'First Half' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500'}`}
                                          >
                                              1st Half
                                          </button>
                                          <button 
                                              type="button"
                                              onClick={() => setRegData({...regData, halfDaySlot: 'Second Half'})}
                                              className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${regData.halfDaySlot === 'Second Half' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500'}`}
                                          >
                                              2nd Half
                                          </button>
                                      </div>
                                  </div>
                                  <div className="space-y-1.5">
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Requested Time (Opt)</label>
                                      <div className="flex items-center gap-2">
                                          <input 
                                              type="time"
                                              value={regData.requestedTimeStart || ''}
                                              onChange={(e) => setRegData({...regData, requestedTimeStart: e.target.value})}
                                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                          />
                                          <span className="text-slate-400 font-bold text-sm">to</span>
                                          <input 
                                              type="time"
                                              value={regData.requestedTimeEnd || ''}
                                              onChange={(e) => setRegData({...regData, requestedTimeEnd: e.target.value})}
                                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                          />
                                      </div>
                                  </div>
                              </div>
                          )}

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Search & Select Approver</label>
                              <div className="relative">
                                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                      type="text"
                                      placeholder="Search by name or ID..."
                                      value={approverSearchTerm}
                                      onChange={(e) => {
                                          setApproverSearchTerm(e.target.value);
                                          setApproverDropdownOpen(true);
                                      }}
                                      onFocus={() => setApproverDropdownOpen(true)}
                                      onBlur={() => setTimeout(() => setApproverDropdownOpen(false), 200)}
                                      className="w-full pl-10 pr-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                  />
                                  {approverDropdownOpen && (
                                      <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl max-h-48 overflow-y-auto">
                                          {allEmployeesForSelect
                                              .filter(emp => 
                                                  `${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName} ${emp.employeeId}`
                                                  .toLowerCase()
                                                  .includes(approverSearchTerm.toLowerCase())
                                              )
                                              .map(emp => (
                                                  <button
                                                      key={emp._id}
                                                      type="button"
                                                      onClick={() => {
                                                          setRegData({...regData, approverId: emp._id});
                                                          setApproverSearchTerm(`${emp.personalDetails?.firstName} ${emp.personalDetails?.lastName} (${emp.employeeId || 'No ID'})`);
                                                          setApproverDropdownOpen(false);
                                                      }}
                                                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors last:border-0"
                                                  >
                                                      <p className="text-sm font-bold text-slate-900">{emp.personalDetails?.firstName} {emp.personalDetails?.lastName}</p>
                                                      <p className="text-[10px] uppercase font-bold text-slate-500">{emp.employeeId || 'No ID'} • {emp.jobDetails?.designation || 'Staff'}</p>
                                                  </button>
                                              ))
                                          }
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Reason for Adjustment</label>
                              <textarea 
                                  value={regData.reason}
                                  onChange={(e) => setRegData({...regData, reason: e.target.value})}
                                  placeholder="Ex: My internet was down in the morning, or forgot to check in..."
                                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none min-h-[100px] transition-all"
                              />
                          </div>
                      </div>

                      <div className="pt-8 flex gap-4">
                          <button
                              onClick={() => setShowRegModal(false)}
                              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
                          >
                              Cancel
                          </button>
                          <button
                              onClick={submitRegularization}
                              disabled={regLoading}
                              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                          >
                              {regLoading ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                  <>
                                      Submit Request
                                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </>
                              )}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  </div>
);
}


