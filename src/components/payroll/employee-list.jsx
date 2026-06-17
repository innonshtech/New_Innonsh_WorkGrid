'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Users, Calendar,
  Building, TrendingUp, Grid3X3, List, ChevronDown, Briefcase, RefreshCw, X,
  Truck, Warehouse, Package, BarChart3, Settings, Bell, MapPin, Phone, Mail,
  FilterX, AlertCircle, CheckCircle, CheckCircle2,
  Download, ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Building2,
  Layers, ChevronUp, Clock
} from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel } from '@/utils/exportToExcel';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { EnterprisePageHeader } from "@/components/ui/enterprise/EnterprisePageHeader";
import { EnterpriseSectionCard } from "@/components/ui/enterprise/EnterpriseSectionCard";
import { EnterpriseButton } from "@/components/ui/enterprise/EnterpriseButton";
import { EnterpriseKpiCard } from "@/components/ui/enterprise/EnterpriseKpiCard";
import { EnterpriseStatusBadge } from "@/components/ui/enterprise/EnterpriseStatusBadge";
import { EnterpriseIconContainer } from "@/components/ui/enterprise/EnterpriseIconContainer";
import { EnterpriseTableWrapper } from "@/components/ui/enterprise/EnterpriseTableWrapper";
import { EnterpriseEmptyState } from "@/components/ui/enterprise/EnterpriseEmptyState";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [viewMode, setViewMode] = useState('grid');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const router = useRouter();

  // Lifecycle Modal State
  const [lifecycleModal, setLifecycleModal] = useState({
    isOpen: false,
    employee: null,
    action: 'Promotion' // Promotion, Transfer, Exit
  });
  const [lifecycleLoading, setLifecycleLoading] = useState(false);
  const [lifecycleData, setLifecycleData] = useState({
    effectiveDate: '',
    reason: '',
    comments: '',
    newDetails: {}
  });

  useEffect(() => {
    setLifecycleData(prev => ({
      ...prev,
      effectiveDate: new Date().toISOString().split('T')[0]
    }));
  }, []);

  // NEW: Organization grouping
  const [groupByOrganization, setGroupByOrganization] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(9);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchEmployees();
  }, [debouncedSearchTerm, departmentFilter, statusFilter, organizationFilter, roleFilter]);


  const fetchEmployees = async () => {
    try {
      setLoading(!employees.length);
      setRefreshing(employees.length > 0);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (departmentFilter) params.append('department', departmentFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (organizationFilter) params.append('organization', organizationFilter);
      if (roleFilter) params.append('role', roleFilter);

      // Fetch all employees for client-side pagination
      params.append('limit', '1000');

      const response = await fetch(`/api/v1/admin/payroll/employees?${params}`);
      const data = await response.json();

      if (response.ok) {
        const employeesList = data.data || data.employees || [];
        setEmployees(employeesList);
        // Auto-expand all organizations initially when grouping is enabled
        if (groupByOrganization) {
          const orgs = {};
          employeesList.forEach(emp => {
            const orgName = emp.organizationType || emp.jobDetails?.organizationId?.name || 'Unassigned';
            orgs[orgName] = true;
          });
          setExpandedOrgs(orgs);
        }
      } else {
        setError(data.error || 'Failed to fetch employees');
        console.error('Failed to fetch employees:', data.error);
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Group employees by organization
  const groupedEmployees = (() => {
    if (!groupByOrganization) return null;

    const groups = {};
    employees.forEach(employee => {
      const orgName = employee.organizationType || employee.jobDetails?.organizationId?.name || 'Unassigned';
      if (!groups[orgName]) {
        groups[orgName] = [];
      }
      groups[orgName].push(employee);
    });

    // Sort organizations alphabetically, but keep "Unassigned" at the end
    const sortedOrgs = Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return sortedOrgs.map(orgName => ({
      name: orgName,
      employees: groups[orgName],
      count: groups[orgName].length,
      activeCount: groups[orgName].filter(e => e.status === 'Active').length
    }));
  })();

  // Pagination calculations
  const paginationData = (() => {
    const totalEmployees = employees.length;
    const totalPages = Math.ceil(totalEmployees / employeesPerPage);

    // Calculate current page employees
    const startIndex = (currentPage - 1) * employeesPerPage;
    const endIndex = startIndex + employeesPerPage;
    const currentEmployees = employees.slice(startIndex, endIndex);

    return {
      totalEmployees,
      totalPages,
      currentEmployees,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalEmployees),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  })();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter, statusFilter, organizationFilter, employeesPerPage, groupByOrganization]);

  // Toggle organization expansion
  const toggleOrgExpansion = (orgName) => {
    setExpandedOrgs(prev => ({
      ...prev,
      [orgName]: !prev[orgName]
    }));
  };

  // Expand/Collapse all organizations
  const expandAllOrgs = () => {
    const allExpanded = {};
    groupedEmployees?.forEach(org => {
      allExpanded[org.name] = true;
    });
    setExpandedOrgs(allExpanded);
  };

  const collapseAllOrgs = () => {
    setExpandedOrgs({});
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEmployeesPerPageChange = (value) => {
    setEmployeesPerPage(Number(value));
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { totalPages } = paginationData;
    const current = currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (const i of range) {
      if (i - prev > 1) {
        rangeWithDots.push("...");
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  // Export functionality
  const handleExport = async () => {
    try {
      setExportLoading(true);

      const exportData = employees.map(employee => ({
        'Employee ID': employee.employeeId || 'N/A',
        'First Name': employee.personalDetails?.firstName || 'N/A',
        'Last Name': employee.personalDetails?.lastName || 'N/A',
        'Full Name': `${employee.personalDetails?.firstName || ''} ${employee.personalDetails?.lastName || ''}`.trim(),
        'Email': employee.personalDetails?.email || 'N/A',
        'DOB': employee.personalDetails?.dateOfBirth ? new Date(employee.personalDetails.dateOfBirth).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : 'N/A',
        'Phone': employee.personalDetails?.phone || 'N/A',
        'Organization': employee.organizationType || employee.jobDetails?.organizationId?.name || 'N/A',
        'Department': employee.jobDetails?.department || 'N/A',
        'Work Location': employee.jobDetails?.workLocation || 'N/A',
        'Employment Type': employee.jobDetails?.employmentType || 'N/A',
        'Salary': employee.salaryDetails?.basicSalary ? `$${employee.salaryDetails.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}` : 'N/A',
        'Status': employee.status || 'N/A',
        'Join Date': employee.personalDetails?.dateOfJoining ?
          new Date(employee.personalDetails.dateOfJoining).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : 'N/A',
        'Address': employee.personalDetails?.address ?
          `${employee.personalDetails.address.street || ''}, ${employee.personalDetails.address.city || ''}, ${employee.personalDetails.address.state || ''}, ${employee.personalDetails.address.zipCode || ''}`.trim() : 'N/A'
      }));

      if (exportData.length > 0) {
        exportToExcel(exportData, 'employee_directory');
        toast.success("Employee Data Export Successfully.");
      } else {
        toast.error('No employee data available to export');
      }

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting employee data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/v1/admin/payroll/employees/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEmployees(employees.filter(emp => emp._id !== id));
        if (paginationData.currentEmployees.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('An error occurred while deleting employee');
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      Active: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500'
      },
      Inactive: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-500'
      },
      Suspended: {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      },
      Terminated: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        dot: 'bg-red-500'
      },
    };
    return statusConfig[status] || statusConfig.Inactive;
  };

  const getStatusBadge = (status) => {
    return <EnterpriseStatusBadge status={status} activeState="Active" />;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      Logistics: Truck,
      Warehouse: Warehouse,
      Procurement: Package,
      Inventory: BarChart3,
      Distribution: MapPin,
      Operations: Settings,
      Planning: Calendar
    };
    return icons[department] || Building;
  };

  const handleLifecycleSubmit = async (e) => {
    e.preventDefault();
    if (!lifecycleModal.employee || !lifecycleData.effectiveDate || !lifecycleData.reason) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLifecycleLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/employees/${lifecycleModal.employee._id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: lifecycleModal.action,
          effectiveDate: lifecycleData.effectiveDate,
          reason: lifecycleData.reason,
          comments: lifecycleData.comments,
          newDetails: lifecycleData.newDetails,
          performedBy: "ADMIN_USER_ID" // Placeholder, real ID should come from auth
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to process lifecycle action");

      toast.success(`${lifecycleModal.action} processed successfully`);
      setLifecycleModal({ ...lifecycleModal, isOpen: false });
      fetchEmployees();
    } catch (error) {
      console.error("Lifecycle error:", error);
      toast.error(error.message);
    } finally {
      setLifecycleLoading(false);
    }
  };

  // Extract unique departments, statuses, and organizations
  const departments = [...new Set(employees.map(emp => emp.jobDetails?.department).filter(Boolean))];
  const statuses = [...new Set(employees.map(emp => emp.status).filter(Boolean))];
  const organizations = [...new Set(employees.map(emp =>
    emp.organizationType || emp.jobDetails?.organizationId?.name
  ).filter(Boolean))];

  const hasActiveFilters = searchTerm || departmentFilter || statusFilter || organizationFilter || roleFilter;

  // Employee Card Component (to avoid duplication)
  const EmployeeCard = ({ employee }) => {
    const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover: transition-">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-sm">
                  {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-500 font-medium">ID: {employee.employeeId}</p>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    employee.role === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {employee.role || 'employee'}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                <DeptIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{employee?.category}</p>
                <p className="text-xs text-slate-500">{employee.jobDetails?.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-600">
                  Joined {employee.personalDetails?.dateOfJoining ?
                    new Date(employee.personalDetails.dateOfJoining).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short',
                      year: 'numeric'
                    }) : 'N/A'}
                </p>
              </div>
            </div>

            {employee.jobDetails?.teamId?.name && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Team</p>
                  <p className="text-xs font-bold text-slate-700">{employee.jobDetails.teamId.name}</p>
                </div>
              </div>
            )}

            {employee.jobDetails?.location && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">{employee.jobDetails.location}</p>
                </div>
              </div>
            )}

            {employee.jobDetails?.defaultShift && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{employee.jobDetails.defaultShift.name}</p>
                  <p className="text-[10px] text-slate-500">{employee.jobDetails.defaultShift.startTime} - {employee.jobDetails.defaultShift.endTime}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {getStatusBadge(employee.status)}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setLifecycleModal({ isOpen: true, employee, action: 'Promotion' })}
                className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                title="Lifecycle Action"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <Link
                href={`/admin/employees/${employee._id}`}
                className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/employees/${employee._id}/edit`}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDelete(employee._id)}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalEmployees, hasPrevious, hasNext } = paginationData;

    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalEmployees}</span> employees
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={employeesPerPage}
              onChange={(e) => handleEmployeesPerPageChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={6}>6</option>
              <option value={9}>9</option>
              <option value={12}>12</option>
              <option value={18}>18</option>
              <option value={24}>24</option>
            </select>
          </div>

          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              <div key={index}>
                {page === "..." ? (
                  <span className="flex items-center justify-center h-9 w-9 text-sm text-slate-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`h-9 w-9 flex items-center justify-center text-sm font-medium border transition-colors rounded-md ${currentPage === page
                      ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {page}
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext}
            className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <EnterprisePageHeader 
          title="Employee Directory"
          subtitle="Manage your organizational workforce and team operations"
          icon={Users}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <EnterpriseButton
                variant="secondary"
                onClick={handleExport}
                disabled={exportLoading || employees.length === 0}
                icon={exportLoading ? Loader2 : Download}
              >
                {exportLoading ? "Exporting..." : "Export"}
              </EnterpriseButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="inline-flex">
                    <EnterpriseButton icon={Plus}>
                      Add Employee
                      <ChevronDown className="w-4 h-4 opacity-90 ml-1" />
                    </EnterpriseButton>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[14rem] z-50">
                  <DropdownMenuLabel>Add Employee</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin/employees/new")}>
                    One By One
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/admin/employees/bulk")}>
                    Bulk Upload (Excel)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnterpriseKpiCard
              title="Total Employees"
              value={employees.length}
              subtitle="Active workforce"
              icon={Users}
              trend={{ value: "100%", label: "Total", isPositive: true }}
            />
            <EnterpriseKpiCard
              title="Active Staff"
              value={employees.filter(e => e.status === 'Active').length}
              subtitle="Currently working"
              icon={CheckCircle}
              trend={{ value: "Active", label: "Status", isPositive: true }}
            />
            <EnterpriseKpiCard
              title="Departments"
              value={departments.length}
              subtitle="Business units"
              icon={Building}
              trend={{ value: "Units", label: "Group", isPositive: true }}
            />
          </div>
        )}

        {/* Group by Organization Toggle Box removed */}

        {/* Controls Panel */}
        <EnterpriseSectionCard className="p-0 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  {groupByOrganization ? 'Organizations' : `Team Directory (${paginationData.totalEmployees})`}
                </h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200">
                    Filtered Results
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <EnterpriseButton
                  variant="secondary"
                  onClick={fetchEmployees}
                  disabled={refreshing}
                  icon={RefreshCw}
                  iconClassName={refreshing ? 'animate-spin' : ''}
                >
                  Refresh
                </EnterpriseButton>

                {!groupByOrganization && (
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      title="Grid view"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'table' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      title="Table view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Employees</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              {/* NEW: Organization Filter */}
              {organizations.length > 1 && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                  <select
                    value={organizationFilter}
                    onChange={(e) => setOrganizationFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1 flex items-end">
                {hasActiveFilters && (
                  <EnterpriseButton
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setDepartmentFilter('');
                      setStatusFilter('');
                      setOrganizationFilter('');
                      setRoleFilter('');
                    }}
                    className="w-full justify-center"
                    title="Clear all filters"
                    icon={FilterX}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Error Loading Employees</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : employees.length === 0 ? (
              <EnterpriseEmptyState
                icon={hasActiveFilters ? FilterX : Users}
                title={hasActiveFilters ? 'No employees match your criteria' : 'No employees found'}
                description={hasActiveFilters
                    ? 'Try adjusting your search terms or filters to find the employees you\'re looking for.'
                    : 'Get started by adding your first employee to build your supply chain team directory.'}
                action={hasActiveFilters ? (
                  <EnterpriseButton variant="secondary" onClick={() => {
                      setSearchTerm('');
                      setDepartmentFilter('');
                      setStatusFilter('');
                      setOrganizationFilter('');
                      setRoleFilter('');
                  }}>
                    Clear All Filters
                  </EnterpriseButton>
                ) : (
                  <EnterpriseButton onClick={() => router.push("/admin/employees/new")}>
                    Add First Employee
                  </EnterpriseButton>
                )}
              />
            ) : groupByOrganization ? (
              /* ORGANIZATION-WISE GROUPED VIEW */
              <div className="space-y-4">
                {groupedEmployees?.map((org) => (
                  <div key={org.name} className="border border-slate-200 rounded-xl overflow-hidden">
                    {/* Organization Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
                      <div className="p-4 flex items-center justify-between">
                        <button
                          onClick={() => toggleOrgExpansion(org.name)}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                            {expandedOrgs[org.name] ? (
                              <ChevronUp className="w-5 h-5 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-600" />
                            )}
                          </div>

                          <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>

                          <div className="text-left">
                            <h3 className="font-semibold text-slate-900 text-lg">
                              {org.name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-slate-600">
                                {org.count} employee{org.count !== 1 ? 's' : ''}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-sm text-green-600">
                                {org.activeCount} active
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Organization Employees */}
                    {expandedOrgs[org.name] && (
                      <div className="p-6 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {org.employees.map((employee) => (
                            <EmployeeCard key={employee._id} employee={employee} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* NORMAL VIEW (Grid or Table) */
              <>
                {viewMode === 'grid' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {paginationData.currentEmployees.map((employee) => (
                        <EmployeeCard key={employee._id} employee={employee} />
                      ))}
                    </div>
                    <Pagination />
                  </>
                ) : (
                  <>
                    <EnterpriseTableWrapper>
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Dept / Team</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Position</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Shift</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                            <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {paginationData.currentEmployees.map((employee) => {
                            const DeptIcon = getDepartmentIcon(employee.jobDetails?.department);
                            return (
                              <tr key={employee._id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                                      <span className="text-white font-semibold text-xs">
                                        {getInitials(employee.personalDetails?.firstName, employee.personalDetails?.lastName)}
                                      </span>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 text-sm">
                                        {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
                                      </p>
                                      <p className="text-xs text-slate-500">{employee.employeeId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-slate-50 rounded flex items-center justify-center border border-blue-100">
                                        <DeptIcon className="w-3 h-3 text-blue-600" />
                                      </div>
                                      <span className="text-slate-900 text-sm font-medium">{employee.jobDetails?.department || 'N/A'}</span>
                                    </div>
                                    {employee.jobDetails?.teamId?.name && (
                                      <div className="flex items-center gap-2 ml-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                        <span className="text-[11px] text-slate-500 font-medium">{employee.jobDetails.teamId.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-slate-900 text-sm">{employee.jobDetails?.designation || 'N/A'}</td>
                                <td className="py-4 px-6">
                                  {employee.jobDetails?.defaultShift ? (
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold text-indigo-700">{employee.jobDetails.defaultShift.name}</span>
                                      <span className="text-[10px] text-slate-500">{employee.jobDetails.defaultShift.startTime}-{employee.jobDetails.defaultShift.endTime}</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">Not Assigned</span>
                                  )}
                                </td>
                                <td className="py-4 px-6">{getStatusBadge(employee.status)}</td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => setLifecycleModal({ isOpen: true, employee, action: 'Promotion' })}
                                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                      title="Lifecycle Action"
                                    >
                                      <TrendingUp className="w-4 h-4" />
                                    </button>
                                    <a
                                      href={`/payroll/employees/${employee._id}`}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </a>
                                    <a
                                      href={`/payroll/employees/${employee._id}/edit`}
                                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </a>
                                    <button
                                      onClick={() => handleDelete(employee._id)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </EnterpriseTableWrapper>
                    <Pagination />
                  </>
                )}
              </>
            )}
          </div>
        </EnterpriseSectionCard>
      </div>
      {/* Lifecycle Modal */}
      {lifecycleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Employee Lifecycle</h3>
                  <p className="text-xs text-slate-500">{lifecycleModal.employee?.personalDetails?.firstName} {lifecycleModal.employee?.personalDetails?.lastName}</p>
                </div>
              </div>
              <button
                onClick={() => setLifecycleModal({ ...lifecycleModal, isOpen: false })}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleLifecycleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Action Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Promotion', 'Transfer', 'Exit'].map(action => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => setLifecycleModal({ ...lifecycleModal, action })}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${lifecycleModal.action === action
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={lifecycleData.effectiveDate}
                    onChange={(e) => setLifecycleData({ ...lifecycleData, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Reason</label>
                  <select
                    required
                    value={lifecycleData.reason}
                    onChange={(e) => setLifecycleData({ ...lifecycleData, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Select Reason</option>
                    {lifecycleModal.action === 'Promotion' && (
                      <>
                        <option value="Merit Based">Merit Based</option>
                        <option value="Annual Review">Annual Review</option>
                        <option value="Restructuring">Restructuring</option>
                      </>
                    )}
                    {lifecycleModal.action === 'Transfer' && (
                      <>
                        <option value="Branch Opening">Branch Opening</option>
                        <option value="Relocation Request">Relocation Request</option>
                        <option value="Project Assignment">Project Assignment</option>
                      </>
                    )}
                    {lifecycleModal.action === 'Exit' && (
                      <>
                        <option value="Resignation">Resignation</option>
                        <option value="Termination">Termination</option>
                        <option value="Retirement">Retirement</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {lifecycleModal.action === 'Promotion' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Designation</label>
                  <input
                    type="text"
                    placeholder="Enter new designation..."
                    onChange={(e) => setLifecycleData({
                      ...lifecycleData,
                      newDetails: { ...lifecycleData.newDetails, designation: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {lifecycleModal.action === 'Transfer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Work Location</label>
                  <input
                    type="text"
                    placeholder="Enter new location..."
                    onChange={(e) => setLifecycleData({
                      ...lifecycleData,
                      newDetails: { ...lifecycleData.newDetails, workLocation: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Comments (Optional)</label>
                <textarea
                  rows="3"
                  value={lifecycleData.comments}
                  onChange={(e) => setLifecycleData({ ...lifecycleData, comments: e.target.value })}
                  placeholder="Enter any additional notes..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setLifecycleModal({ ...lifecycleModal, isOpen: false })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={lifecycleLoading}
                  className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {lifecycleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirm {lifecycleModal.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
