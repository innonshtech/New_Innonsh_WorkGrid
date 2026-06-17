'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Download, FileText,
  Calendar, User, CreditCard, CheckCircle, Clock, AlertCircle, ChevronDown,
  RefreshCw, Settings, BarChart3, TrendingUp, DollarSign, FilterX,
  ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Building2, Layers,
  ChevronUp, Package
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PayslipList() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // NEW: Organization grouping
  const [groupByOrganization, setGroupByOrganization] = useState(false);
  const [expandedOrgs, setExpandedOrgs] = useState({});

  // Export by employee type modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalData, setExportModalData] = useState({ orgName: '', orgPayslips: [] });
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [selectedEmployeeType, setSelectedEmployeeType] = useState('all');
  const [loadingEmployeeTypes, setLoadingEmployeeTypes] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch employee types for organization from payslips
  const fetchEmployeeTypesForOrg = (orgPayslips) => {
    try {
      setLoadingEmployeeTypes(true);

      // Extract unique employee types from payslips with multiple fallbacks
      const empTypes = new Set();
      if (orgPayslips && Array.isArray(orgPayslips)) {
        orgPayslips.forEach((payslip, index) => {
          // Try multiple paths to extract employee type
          const empType =
            payslip.employeeType ||
            payslip.employee?.employeeType ||
            payslip.employee?.jobDetails?.employeeType ||
            payslip.employee?.category;

          // Detailed logging for debugging
          console.log(`Payslip ${index} (${payslip.employee?.employeeId}):`, {
            storedEmployeeType: payslip.employeeType,
            employeeEmpType: payslip.employee?.employeeType,
            jobDetailsEmpType: payslip.employee?.jobDetails?.employeeType,
            category: payslip.employee?.category,
            finalValue: empType,
            fullEmployee: payslip.employee
          });

          if (empType) {
            empTypes.add(empType);
          }
        });
      }

      const sortedTypes = Array.from(empTypes).sort();
      console.log('Extracted employee types from payslips:', sortedTypes);
      console.log('Total unique employee types found:', sortedTypes.length);
      console.log('Total payslips processed:', orgPayslips?.length);
      setEmployeeTypes(sortedTypes);
      setSelectedEmployeeType('all');

      if (sortedTypes.length === 0) {
        toast('No employee types found in payslips for this organization', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error extracting employee types:', error);
      toast.error('Failed to load employee types');
      setEmployeeTypes([]);
    } finally {
      setLoadingEmployeeTypes(false);
    }
  };

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayslips();
  }, [debouncedSearchTerm, monthFilter, yearFilter, statusFilter, organizationFilter]);

  const fetchPayslips = async () => {
    try {
      setLoading(!payslips.length);
      setRefreshing(payslips.length > 0);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (organizationFilter) params.append('organization', organizationFilter);
      params.append('limit', '1000'); // Fetch more payslips to ensure all are loaded

      const response = await fetch(`/api/v1/admin/payroll/payslip?${params}`);
      const data = await response.json();

      console.log("data", data);

      if (response.ok) {
        setPayslips(data.payslips || []);
        console.log('Fetched payslips:', data.payslips?.length);
        // Auto-expand all organizations initially when grouping is enabled
        if (groupByOrganization) {
          const orgs = {};
          (data.payslips || []).forEach(payslip => {
            const orgName = payslip.organizationName || 'Unassigned';
            orgs[orgName] = true;
          });
          setExpandedOrgs(orgs);
        }
      } else {
        setError(data.error || 'Failed to fetch payslips');
        console.error('Failed to fetch payslips:', data.error);
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Group payslips by organization
  const groupedPayslips = (() => {
    if (!groupByOrganization) return null;

    const groups = {};
    payslips.forEach(payslip => {
      const orgName = payslip.organizationName || 'Unassigned';
      if (!groups[orgName]) {
        groups[orgName] = [];
      }
      groups[orgName].push(payslip);
    });

    // Sort organizations alphabetically, but keep "Unassigned" at the end
    const sortedOrgs = Object.keys(groups).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return sortedOrgs.map(orgName => {
      const orgPayslips = groups[orgName];
      const totalNetSalary = orgPayslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);
      const totalGrossSalary = orgPayslips.reduce((sum, p) => sum + (p.grossSalary || 0), 0);

      return {
        name: orgName,
        payslips: orgPayslips,
        count: orgPayslips.length,
        totalNetSalary,
        totalGrossSalary,
        paidCount: orgPayslips.filter(p => p.status === 'Paid').length,
      };
    });
  })();

  // Pagination calculations
  const paginationData = (() => {
    const totalItems = payslips.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Calculate current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = payslips.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentItems,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, totalItems),
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    };
  })();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, monthFilter, yearFilter, statusFilter, organizationFilter, itemsPerPage, groupByOrganization]);

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
    groupedPayslips?.forEach(org => {
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

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
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

  // Export Organization Payslip Summary to PDF - FORMAL COMPANY STYLE
  // Export Organization Payslip Summary to PDF - FORMAL COMPANY STYLE
  // Export Organization Payslip Summary to PDF - FORMAL COMPANY STYLE
  // ================== HELPERS ==================
  const money = (v = 0) => Number(v || 0).toFixed(2);
  const intVal = (v = 0) => Number(v || 0).toFixed(0);
  const hours = (v = 0) => Number(v || 0).toFixed(1);

  const TEXT_FONT = "helvetica";
  const NUMBER_FONT = "courier";

  // ================== FINAL EXPORT FUNCTION ==================
  const handleExportOrgSummary = async (orgName, orgPayslips, employeeTypeFilter = 'all') => {
    const toastId = toast.loading("Generating professional payroll PDF...");
    try {
      setExportLoading(true);

      // Filter payslips by employee type if specified
      let filteredPayslips = orgPayslips;
      if (employeeTypeFilter !== 'all') {
        filteredPayslips = orgPayslips.filter(p => {
          // Use stored employeeType from payslip first, then fallback
          const empType =
            p.employeeType ||
            p.employee?.employeeType ||
            p.employee?.jobDetails?.employeeType ||
            p.employee?.category;
          return empType === employeeTypeFilter;
        });
      }

      if (filteredPayslips.length === 0) {
        toast.error("No payslips found for selected employee type");
        setExportLoading(false);
        toast.dismiss(toastId);
        return;
      }

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF("landscape", "mm", "a4");
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const PRIMARY = [30, 64, 175];
      const BORDER = [220, 220, 220];
      const TEXT = [30, 30, 30];

      // ---------- HEADER ----------
      const header = () => {
        doc.setFont(TEXT_FONT, "bold");
        doc.setFontSize(16);
        const titleText = employeeTypeFilter !== 'all'
          ? `${orgName} - ${employeeTypeFilter} Employees`
          : orgName;
        doc.text(titleText, 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(...PRIMARY);
        doc.text("PAYROLL SUMMARY REPORT", W - 14, 20, { align: "right" });

        doc.setDrawColor(...BORDER);
        doc.line(14, 24, W - 14, 24);
      };

      // ---------- FOOTER ----------
      const footer = (page, total) => {
        doc.setFont(TEXT_FONT, "normal");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.line(14, H - 18, W - 14, H - 18);
        doc.text("Confidential Payroll Document", 14, H - 10);
        doc.text(`Page ${page} of ${total}`, W / 2, H - 10, { align: "center" });
        doc.text(new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }), W - 14, H - 10, {
          align: "right",
        });
      };

      header();

      // ---------- META ----------
      doc.setFont(TEXT_FONT, "normal");
      doc.setFontSize(9);
      doc.setTextColor(...TEXT);

      const monthName = monthFilter
        ? months[parseInt(monthFilter) - 1]
        : "All Months";

      doc.text(`Pay Period : ${monthName} ${yearFilter || ""}`, 14, 32);
      doc.text(`Employees  : ${filteredPayslips.length}`, 14, 38);
      if (employeeTypeFilter !== 'all') {
        doc.text(`Type       : ${employeeTypeFilter}`, 14, 44);
        doc.text(`Currency   : INR`, 14, 50);
      } else {
        doc.text(`Currency   : INR`, 14, 44);
      }

      // ---------- TABLE DATA ----------
      const body = filteredPayslips.map((p, i) => {
        const emp = p.employee?.personalDetails || {};
        // Use stored employeeType from payslip first, then fallback
        const empType =
          p.employeeType ||
          p.employee?.employeeType ||
          p.employee?.jobDetails?.employeeType ||
          p.employee?.category ||
          "-";
        return [
          i + 1,
          `${emp.firstName || ""} ${emp.lastName || ""}`,
          p.employee?.employeeId || "-",
          empType,
          money(p.basicSalary),
          intVal(p.workingDays),
          intVal(p.presentDays),
          hours(p.overtimeHours),
          money(p.grossSalary),
          money(p.totalDeductions),
          money(p.netSalary),
        ];
      });

      // ---------- TOTALS ----------
      const totals = {
        basic: filteredPayslips.reduce((s, p) => s + (p.basicSalary || 0), 0),
        ot: filteredPayslips.reduce((s, p) => s + (p.overtimeHours || 0), 0),
        gross: filteredPayslips.reduce((s, p) => s + (p.grossSalary || 0), 0),
        ded: filteredPayslips.reduce((s, p) => s + (p.totalDeductions || 0), 0),
        net: filteredPayslips.reduce((s, p) => s + (p.netSalary || 0), 0),
      };

      body.push([
        "",
        "TOTAL",
        "",
        "",
        money(totals.basic),
        "",
        "",
        hours(totals.ot),
        money(totals.gross),
        money(totals.ded),
        money(totals.net),
      ]);

      // ---------- TABLE ----------
      autoTable(doc, {
        startY: employeeTypeFilter !== 'all' ? 55 : 50,
        head: [[
          "S.No",
          "Employee Name",
          "Emp ID",
          "Employee Type",
          "Basic (INR)",
          "WD",
          "PD",
          "OT Hrs",
          "Gross (INR)",
          "Deduction (INR)",
          "Net Pay (INR)",
        ]],
        body,
        theme: "grid",

        styles: {
          font: TEXT_FONT,
          fontSize: 8,
          cellPadding: 3,
          lineColor: BORDER,
        },

        headStyles: {
          fillColor: PRIMARY,
          textColor: 255,
          halign: "center",
          fontStyle: "bold",
        },

        alternateRowStyles: { fillColor: [248, 249, 251] },

        columnStyles: {
          0: { halign: "center", font: NUMBER_FONT },
          1: { halign: "left", font: TEXT_FONT },
          2: { halign: "center", font: NUMBER_FONT },
          3: { halign: "left", font: TEXT_FONT },
          4: { halign: "right", font: NUMBER_FONT },
          5: { halign: "center", font: NUMBER_FONT },
          6: { halign: "center", font: NUMBER_FONT },
          7: { halign: "center", font: NUMBER_FONT },
          8: { halign: "right", font: NUMBER_FONT },
          9: { halign: "right", font: NUMBER_FONT },
          10: { halign: "right", font: NUMBER_FONT },
        },

        didParseCell(data) {
          if (data.row.index === body.length - 1) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [230, 230, 230];
          }
        },

        didDrawPage() {
          const info = doc.internal.getCurrentPageInfo();
          header();
          footer(info.pageNumber, doc.internal.getNumberOfPages());
        },
      });

      const fileName = employeeTypeFilter !== 'all'
        ? `Payroll_${employeeTypeFilter.replace(/\s+/g, "_")}_${orgName.replace(/\s+/g, "_")}.pdf`
        : `Payroll_Summary_${orgName.replace(/\s+/g, "_")}.pdf`;

      doc.save(fileName);
      toast.success("Professional payroll PDF generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      toast.dismiss(toastId);
      setExportLoading(false);
    }
  };

  // Export Bank Advice (CSV)
  const handleExportBankAdvice = (orgName, orgPayslips, employeeTypeFilter = 'all') => {
    try {
      setExportLoading(true);
      const toastId = toast.loading("Generating Bank Advice CSV...");

      let filteredPayslips = orgPayslips;
      if (employeeTypeFilter !== 'all') {
        filteredPayslips = orgPayslips.filter(p => {
          const empType =
            p.employeeType ||
            p.employee?.employeeType ||
            p.employee?.jobDetails?.employeeType ||
            p.employee?.category;
          return empType === employeeTypeFilter;
        });
      }

      if (filteredPayslips.length === 0) {
        toast.error("No payslips found for selected employee type");
        toast.dismiss(toastId);
        setExportLoading(false);
        return;
      }

      // Generate CSV Content
      const headers = [
        "Employee ID",
        "Employee Name",
        "Bank Name",
        "Account Number",
        "IFSC Code",
        "Net Pay Amount",
        "Transfer Narration"
      ];

      const csvRows = [headers.join(",")];

      filteredPayslips.forEach(p => {
        const emp = p.employee || {};
        const personal = emp.personalDetails || {};
        const salaryInfo = emp.salaryDetails?.bankAccount || {};
        
        const empId = emp.employeeId || "-";
        const empName = `${personal.firstName || ""} ${personal.lastName || ""}`.trim() || "-";
        const bankName = salaryInfo.bankName || "MISSING_BANK";
        const accountNum = salaryInfo.accountNumber || "MISSING_ACCOUNT";
        const ifsc = salaryInfo.ifscCode || "MISSING_IFSC";
        const netPay = p.netSalary || 0;
        const monthName = monthFilter ? months[parseInt(monthFilter) - 1] : "";
        const narration = `"Salary ${monthName} ${yearFilter || ""}"`;

        // Escape quotes and wrap strings containing commas
        const safeName = `"${empName}"`;
        const safeBankName = `"${bankName}"`;

        csvRows.push([
          empId,
          safeName,
          safeBankName,
          accountNum,
          ifsc,
          netPay,
          narration
        ].join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"));
      
      const fileName = employeeTypeFilter !== 'all'
        ? `Bank_Advice_${employeeTypeFilter.replace(/\s+/g, "_")}_${orgName.replace(/\s+/g, "_")}.csv`
        : `Bank_Advice_${orgName.replace(/\s+/g, "_")}.csv`;

      // Trigger download
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);
      link.setAttribute("download", fileName);
      document.body.appendChild(link); // Required for FF
      link.click();
      document.body.removeChild(link);

      toast.success("Bank Advice CSV generated!");
      toast.dismiss(toastId);
    } catch (error) {
      console.error("Error generating CSV: ", error);
      toast.error("Failed to generate Bank Advice");
    } finally {
      setExportLoading(false);
    }
  };

  // Export Modal Component
  const ExportModal = () => {
    if (!showExportModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Export Payroll Summary
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {exportModalData.orgName}
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Filter by Employee Type
              </label>

              {loadingEmployeeTypes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-yellow-500 rounded-full animate-spin"></div>
                </div>
              ) : employeeTypes.length === 0 ? (
                <div className="space-y-3 py-4">
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-800">
                      No employee type information available in the payslips. Exporting all employees in the organization.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEmployeeType('all')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors font-medium text-sm ${selectedEmployeeType === 'all'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Export All Employees</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {exportModalData.orgPayslips.length}
                      </span>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => setSelectedEmployeeType('all')}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors font-medium text-sm ${selectedEmployeeType === 'all'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Employee Types</span>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        {exportModalData.orgPayslips.length}
                      </span>
                    </div>
                  </button>

                  {employeeTypes.map((type) => {
                    const count = exportModalData.orgPayslips.filter(p => {
                      // Use stored employeeType from payslip first, then fallback
                      const empType =
                        p.employeeType ||
                        p.employee?.employeeType ||
                        p.employee?.jobDetails?.employeeType ||
                        p.employee?.category;
                      return empType === type;
                    }).length;
                    const totalSalary = exportModalData.orgPayslips
                      .filter(p => {
                        // Use stored employeeType from payslip first, then fallback
                        const empType =
                          p.employeeType ||
                          p.employee?.employeeType ||
                          p.employee?.jobDetails?.employeeType ||
                          p.employee?.category;
                        return empType === type;
                      })
                      .reduce((sum, p) => sum + (p.netSalary || 0), 0);

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedEmployeeType(type)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${selectedEmployeeType === type
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`font-medium text-sm ${selectedEmployeeType === type ? 'text-indigo-700' : 'text-slate-700'
                              }`}>
                              {type}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {count} employees • ₹{totalSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-slate-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 mb-2">Export Summary:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Employees:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedEmployeeType === 'all'
                      ? exportModalData.orgPayslips.length
                      : exportModalData.orgPayslips.filter(p => {
                        // Use stored employeeType from payslip first, then fallback
                        const empType =
                          p.employeeType ||
                          p.employee?.employeeType ||
                          p.employee?.jobDetails?.employeeType ||
                          p.employee?.category;
                        return empType === selectedEmployeeType;
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Net Pay:</span>
                  <span className="font-semibold text-green-600">
                    ₹{(selectedEmployeeType === 'all'
                      ? exportModalData.orgPayslips.reduce((s, p) => s + (p.netSalary || 0), 0)
                      : exportModalData.orgPayslips
                        .filter(p => {
                          // Use stored employeeType from payslip first, then fallback
                          const empType =
                            p.employeeType ||
                            p.employee?.employeeType ||
                            p.employee?.jobDetails?.employeeType ||
                            p.employee?.category;
                          return empType === selectedEmployeeType;
                        })
                        .reduce((s, p) => s + (p.netSalary || 0), 0)
                    ).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 p-6 flex items-center gap-3 justify-end flex-wrap">
            <button
              onClick={() => setShowExportModal(false)}
              className="px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleExportBankAdvice(
                  exportModalData.orgName,
                  exportModalData.orgPayslips,
                  selectedEmployeeType
                );
                setShowExportModal(false);
              }}
              disabled={exportLoading || loadingEmployeeTypes}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
              ) : (
                <DollarSign className="w-4 h-4 text-emerald-600" />
              )}
              Bank Advice (CSV)
            </button>
            <button
              onClick={() => {
                handleExportOrgSummary(
                  exportModalData.orgName,
                  exportModalData.orgPayslips,
                  selectedEmployeeType
                );
                setShowExportModal(false);
              }}
              disabled={exportLoading || loadingEmployeeTypes}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  };


  // Pagination Component
  const Pagination = () => {
    const { totalPages, startIndex, endIndex, totalItems, hasPrevious, hasNext } = paginationData;

    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white rounded-lg border border-slate-200">
        <div className="text-sm text-slate-600">
          Showing <span className="font-semibold">{startIndex}-{endIndex}</span> of <span className="font-semibold">{totalItems}</span> payslips
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-slate-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={25}>25</option>
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
                      ? "bg-indigo-500 border-indigo-500 text-white hover:bg-indigo-600"
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

  const getStatusConfig = (status) => {
    const statusConfig = {
      Draft: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        icon: Clock,
        dot: 'bg-slate-500'
      },
      Generated: {
        bg: 'bg-slate-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: FileText,
        dot: 'bg-slate-500'
      },
      Approved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle,
        dot: 'bg-green-500'
      },
      Paid: {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: CreditCard,
        dot: 'bg-purple-500'
      },
      Failed: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertCircle,
        dot: 'bg-red-500'
      },
    };
    return statusConfig[status] || statusConfig.Draft;
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const hasActiveFilters = searchTerm || monthFilter || yearFilter || statusFilter || organizationFilter;

  // Extract unique organizations
  const organizations = [...new Set(payslips.map(p => p.organizationName).filter(Boolean))];

  // Calculate analytics
  const totalPayslips = payslips.length;
  const paidPayslips = payslips.filter(p => p.status === 'Paid').length;
  const pendingPayslips = payslips.filter(p => ['Draft', 'Generated'].includes(p.status)).length;
  const totalPayrollAmount = payslips.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Payslip Records</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch payroll data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <ExportModal />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payroll Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage employee payslips and salary disbursements</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              <button className="p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Payslips</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalPayslips}</p>
                <p className="text-xs text-slate-500 mt-1">All records</p>
              </div>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>



          <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Paid</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{paidPayslips}</p>
                <p className="text-xs text-slate-500 mt-1">Completed payments</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Amount</p>
                <p className="text-xl font-bold text-slate-900 mt-2">
                  {formatCurrency(totalPayrollAmount)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Payroll value</p>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
              {/* NEW: Organization Grouping Toggle */}
        {organizations.length > 1 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className={`w-5 h-5 ${groupByOrganization ? 'text-blue-600' : 'text-slate-600'}`} />
                <div>
                  <h3 className="font-semibold text-slate-900">Group by Organization</h3>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {groupByOrganization
                      ? "Payslips are grouped by their organizations"
                      : "Showing all payslips in a unified list"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {groupByOrganization && groupedPayslips && (
                  <>
                    <button
                      onClick={expandAllOrgs}
                      className="text-xs px-3 py-1.5 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={collapseAllOrgs}
                      className="text-xs px-3 py-1.5 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                    >
                      Collapse All
                    </button>
                  </>
                )}
                <button
                  onClick={() => setGroupByOrganization(!groupByOrganization)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${groupByOrganization ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${groupByOrganization ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}    </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-xl border-2 border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  {groupByOrganization ? 'Organizations' : `Payslip Records (${paginationData.totalItems})`}
                </h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full border border-indigo-200">
                    Filtered Results
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchPayslips}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border-2 border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <Link
                  href="/admin/payroll/payslip/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all hover:"
                >
                  <Plus className="w-4 h-4" />
                  Generate Payslip
                </Link>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Payslips</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by employee name, ID, or payslip number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {organizations.length > 1 && (
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                  <select
                    value={organizationFilter}
                    onChange={(e) => setOrganizationFilter(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Months</option>
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  <option value="Draft">Draft</option>
                  <option value="Generated">Generated</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div className="lg:col-span-1 flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setMonthFilter('');
                      setYearFilter('');
                      setStatusFilter('');
                      setOrganizationFilter('');
                    }}
                    className="w-full px-3 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                    title="Clear all filters"
                  >
                    <FilterX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800">Error Loading Payslips</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {payslips.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {hasActiveFilters ? 'No matching payslips found' : 'No payslips available'}
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                  {hasActiveFilters
                    ? 'Try adjusting your search criteria or filters to find the payslips you\'re looking for.'
                    : 'Start by generating payslips for your employees to begin payroll processing.'
                  }
                </p>
                {hasActiveFilters ? (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setMonthFilter('');
                      setYearFilter('');
                      setStatusFilter('');
                      setOrganizationFilter('');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border-2 border-indigo-200 text-sm font-medium transition-colors"
                  >
                    <FilterX className="w-4 h-4" />
                    Clear All Filters
                  </button>
                ) : (
                  <Link
                    href="/admin/payroll/payslip/generate"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all hover:"
                  >
                    <Plus className="w-4 h-4" />
                    Generate First Payslip
                  </Link>
                )}
              </div>
            ) : groupByOrganization ? (
              /* ORGANIZATION-WISE GROUPED VIEW */
              <div className="space-y-4">
                {groupedPayslips?.map((org) => (
                  <div key={org.name} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                    {/* Organization Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-slate-200">
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
                                {org.count} payslip{org.count !== 1 ? 's' : ''}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="text-sm text-green-600 font-semibold">
                                Total: {formatCurrency(org.totalNetSalary)}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Export Organization Summary Button */}
                        <button
                          onClick={() => {
                            setExportModalData({ orgName: org.name, orgPayslips: org.payslips });
                            fetchEmployeeTypesForOrg(org.payslips);
                            setShowExportModal(true);
                          }}
                          disabled={exportLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 rounded-lg border-2 border-blue-200 transition-colors font-medium disabled:opacity-50"
                        >
                          {exportLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          <span className="text-sm">Export Summary</span>
                        </button>
                      </div>
                    </div>

                    {/* Organization Payslips Table */}
                    {expandedOrgs[org.name] && (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Payslip ID</th>
                              <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                              <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Pay Period</th>
                              <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Salary</th>
                              <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                              <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {org.payslips.map((payslip) => (
                              <tr key={payslip._id || payslip.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="font-semibold text-slate-900 text-sm">
                                    {payslip.payslipId}
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                      <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900 text-sm">
                                        {payslip.employee?.personalDetails?.firstName} {payslip.employee?.personalDetails?.lastName}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        ID: {payslip.employee?.employeeId}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-900">
                                      {months[payslip.month - 1]} {payslip.year}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="text-sm font-bold text-slate-900">
                                    {formatCurrency(payslip.netSalary)}
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  {getStatusBadge(payslip.status)}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-center space-x-1">
                                    <Link
                                      href={`/admin/payroll/payslip/${payslip._id || payslip.id}`}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* NORMAL TABLE VIEW */
              <>
                <div className="overflow-x-auto rounded-xl border-2 border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Payslip ID</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                        {organizations.length > 1 && (
                          <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Organization</th>
                        )}
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Pay Period</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Salary</th>
                        <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                        <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {paginationData.currentItems.map((payslip) => (
                        <tr key={payslip._id || payslip.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-900 text-sm">
                              {payslip.payslipId}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 text-sm">
                                  {payslip.employee?.personalDetails?.firstName} {payslip.employee?.personalDetails?.lastName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  ID: {payslip.employee?.employeeId}
                                </div>
                              </div>
                            </div>
                          </td>
                          {organizations.length > 1 && (
                            <td className="py-4 px-6 text-slate-900 text-sm">
                              {payslip.organizationName || 'N/A'}
                            </td>
                          )}
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900">
                                {months[payslip.month - 1]} {payslip.year}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-sm font-bold text-slate-900">
                              {formatCurrency(payslip.netSalary)}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {getStatusBadge(payslip.status)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-center space-x-1">
                              <Link
                                href={`/admin/payroll/payslip/${payslip._id || payslip.id}`}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}