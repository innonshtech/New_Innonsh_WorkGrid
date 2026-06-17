"use client";
import { useState, useEffect, useRef } from "react";
import {
  Save,
  X,
  Calculator,
  User,
  Calendar,
  Plus,
  Minus,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  AlertTriangle,
  Percent,
  CalendarDays,
  Info,
  ChevronDown,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateProfessionalTax } from "@/utils/validation";
import { useSession } from "@/context/SessionContext";

// Function to calculate total days in a month
const getMonthDetails = (month, year) => {
  const date = new Date(year, month, 0); // Last day of the month
  const totalDays = date.getDate();
  return { totalDays };
};

export default function PayslipGenerator() {
  const router = useRouter();
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingEmployeeDetails, setLoadingEmployeeDetails] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [errors, setErrors] = useState({});
  const [duplicatePayslip, setDuplicatePayslip] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [formData, setFormData] = useState({
    employee: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: 0,
    earnings: [],
    deductions: [],
    totalDays: 31,
    presentDays: 31,
    leaveDays: 0,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    overtimeHours: 0,
    overtimeRate: 0,
    notes: "",
  });
  const [selectedOrg, setSelectedOrg] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedEmpType, setSelectedEmpType] = useState("");
  const [calculatedValues, setCalculatedValues] = useState({
    effectiveBasicSalary: 0,
    grossSalary: 0,
    totalEarnings: 0,
    totalDeductions: 0,
    netSalary: 0,
    overtimeAmount: 0,
    fullMonthGrossSalary: 0,
    fullMonthNetSalary: 0,
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const isFutureDate = (m, y) => {
    if (y > currentYear) return true;
    if (y === currentYear && m > currentMonth) return true;
    return false;
  };

  // Update total days when month/year changes
  useEffect(() => {
    if (formData.month && formData.year) {
      const { totalDays } = getMonthDetails(formData.month, formData.year);
      setFormData((prev) => ({
        ...prev,
        totalDays,
        presentDays: totalDays - (prev.unpaidLeaveDays || 0),
      }));
    }
  }, [formData.month, formData.year]);

  // Update present days
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      presentDays: prev.totalDays - (prev.unpaidLeaveDays || 0),
    }));
  }, [formData.totalDays, formData.unpaidLeaveDays]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Helper functions for calculations
  const calculatePF = (basicSalary) => {
    const pfBase = Math.min(basicSalary, 15000);
    return {
      employeePF: (pfBase * 12) / 100,
      employerPF: (pfBase * 13) / 100,
    };
  };

  const calculateESIC = (grossSalary, percentage) => {
    return Math.ceil(grossSalary * (percentage / 100));
  };

  // Effect 1: Update dynamic components
  useEffect(() => {
    if (!employeeData || !formData.basicSalary) return;

    const salaryType = employeeData.payslipStructure?.salaryType || "monthly";
    const fullBasicSalary = parseFloat(formData.basicSalary) || 0;

    if (salaryType === "monthly") {
      setFormData((prev) => {
        // 1. Calculate Earnings first
        const newEarnings = prev.earnings.map((e) => {
          if (e.enabled && e.calculationType === "percentage") {
            const amount = parseFloat(
              ((fullBasicSalary * (parseFloat(e.percentage) || 0)) / 100).toFixed(2)
            );
            return { ...e, amount };
          }
          return e;
        });

        // 2. Calculate Gross Salary (Basic + Earnings)
        const totalEarnings = newEarnings.reduce(
          (sum, e) => sum + (e.enabled ? (parseFloat(e.amount) || 0) : 0),
          0
        );
        const fullMonthGrossSalary = fullBasicSalary + totalEarnings;

        // 3. Calculate Deductions
        const newDeductions = prev.deductions.map((d) => {
          if (!d.enabled) return d;

          // Case A: Professional Tax
          if (d.name === "Professional Tax" || d.type === "Professional Tax") {
            const ptAmount = calculateProfessionalTax(
              fullMonthGrossSalary,
              employeeData.personalDetails?.gender,
              formData.month
            );
            return {
              ...d,
              amount: ptAmount,
              fixedAmount: ptAmount // Update fixed amount for consistency
            };
          }

          // Case B: Provident Fund
          if (d.name.includes("Provident Fund")) {
            const pfCalcs = calculatePF(fullBasicSalary);
            let amount = 0;
            if (d.name.includes("Employee")) {
              amount = pfCalcs.employeePF;
            } else if (d.name.includes("Employer")) {
              amount = pfCalcs.employerPF;
            }
            return { ...d, amount: parseFloat(amount.toFixed(2)) };
          }

          // Case C: ESIC
          if (d.name.includes("ESIC") || d.name.includes("Employee State Insurance")) {
            let percentage = 0.75; // Default Employee
            if (d.name.includes("Employer")) {
              percentage = 3.25;
            }
            // Use custom percentage if set, otherwise default
            if (d.calculationType === "percentage" && d.percentage > 0) {
              percentage = d.percentage;
            }

            const amount = calculateESIC(fullMonthGrossSalary, percentage);
            return { ...d, amount: parseFloat(amount.toFixed(2)) };
          }

          // Case D: Other Percentage Deductions (Default to % of Basic)
          if (d.calculationType === "percentage") {
            const amount = parseFloat(
              ((fullBasicSalary * (parseFloat(d.percentage) || 0)) / 100).toFixed(2)
            );
            return { ...d, amount };
          }

          return d;
        });

        // Optimization: Check for changes
        if (
          JSON.stringify(prev.earnings) === JSON.stringify(newEarnings) &&
          JSON.stringify(prev.deductions) === JSON.stringify(newDeductions)
        ) {
          return prev;
        }

        return {
          ...prev,
          earnings: newEarnings,
          deductions: newDeductions,
        };
      });
    }
  }, [formData.basicSalary, formData.month, employeeData]);


  // Effect 2: Calculate totals whenever components or days change
  useEffect(() => {
    calculateTotals();
  }, [
    formData.basicSalary,
    formData.ctcGrossSalary, // Added CTC dependency
    formData.earnings,
    formData.deductions,
    formData.presentDays,
    formData.totalDays,
    formData.unpaidLeaveDays,
    formData.overtimeHours,
    formData.overtimeRate,
    employeeData,
  ]);

  useEffect(() => {
    if (formData.employee && formData.month && formData.year) {
      checkDuplicatePayslip();
    } else {
      setDuplicatePayslip(null);
    }
  }, [formData.employee, formData.month, formData.year]);

  useEffect(() => {
    if (formData.employee && formData.month && formData.year) {
      fetchEmployeeLeaves();
      fetchEmployeeOvertime(formData.employee, formData.month, formData.year);
    } else {
      setLeaveData(null);
      setFormData((prev) => ({
        ...prev,
        overtimeHours: 0,
      }));
    }
  }, [formData.employee, formData.month, formData.year]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/v1/admin/employees?limit=1000");
      const data = await response.json();
      console.log("Fetched employees:", data);
      if (response.ok) {
        setEmployees(data.data || data.employees || []);
      } else {
        console.error("Failed to fetch employees:", data.error);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchEmployeeDetails = async (employeeId) => {
    try {
      setLoadingEmployeeDetails(true);
      const response = await fetch(`/api/v1/admin/employees/${employeeId}`);
      const data = await response.json();
      if (response.ok) {
        const empData = data.employee || data;
        const { salaryDetails, payslipStructure } = empData;
        const earnings = (payslipStructure?.earnings || []).map((e) => ({
          name: e.name || "Other",
          type: e.name || "Other",
          amount: e.fixedAmount || 0,
          calculationType: e.calculationType || "percentage",
          percentage: e.percentage || 0,
          fixedAmount: e.fixedAmount || 0,
          enabled: e.enabled !== false,
          editable: e.editable !== false,
        }));
        const deductions = (payslipStructure?.deductions || []).map((d) => ({
          name: d.name || "Other",
          type: d.name || "Other",
          amount: d.fixedAmount || 0,
          calculationType: d.calculationType || "percentage",
          percentage: d.percentage || 0,
          fixedAmount: d.fixedAmount || 0,
          enabled: d.enabled !== false,
          editable: d.editable !== false,
        }));
        setEmployeeData(empData);
        setFormData((prev) => ({
          ...prev,
          basicSalary: payslipStructure?.basicSalary || 0,
          ctcGrossSalary: payslipStructure?.grossSalary || 0, // Store the user-entered CTC
          overtimeRate: salaryDetails?.overtimeRate || 0,
          earnings,
          deductions,
        }));
        await fetchEmployeeOvertime(employeeId, formData.month, formData.year);
      } else {
        console.error("Failed to fetch employee details:", data.error);
        setErrors((prev) => ({
          ...prev,
          employee: "Failed to load employee details",
        }));
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      setErrors((prev) => ({
        ...prev,
        employee: "Error fetching employee details",
      }));
    } finally {
      setLoadingEmployeeDetails(false);
    }
  };

  const fetchEmployeeLeaves = async () => {
    setLoadingLeaves(true);
    try {
      const response = await fetch(
        `/api/v1/admin/leaves?employeeId=${formData.employee}&year=${formData.year}`
      );
      const data = await response.json();
      if (response.ok && data.leaves && data.leaves.length > 0) {
        const monthLeaveRecord = data.leaves.find(
          (record) =>
            record.month === formData.month && record.year === formData.year
        );
        if (monthLeaveRecord) {
          const leaveEntries = monthLeaveRecord.leaves || [];
          const summary = monthLeaveRecord.summary || {};
          const paidLeaves =
            (summary.paidLeaves || 0) + (summary.halfDayPaidLeaves || 0) * 0.5;
          const unpaidLeaves =
            (summary.unpaidLeaves || 0) +
            (summary.halfDayUnpaidLeaves || 0) * 0.5;
          const totalLeaves = summary.totalDays || 0;
          setFormData((prev) => ({
            ...prev,
            leaveDays: totalLeaves,
            paidLeaveDays: paidLeaves,
            unpaidLeaveDays: unpaidLeaves,
            presentDays: prev.totalDays - unpaidLeaves,
          }));
          setLeaveData({
            totalLeaves,
            paidLeaves,
            unpaidLeaves,
            details: leaveEntries,
            summary: summary,
          });
          toast.success(
            `Found ${totalLeaves} leave day(s) for ${months[formData.month - 1]
            }`
          );
        } else {
          resetLeaveData();
        }
      } else {
        resetLeaveData();
      }
    } catch (error) {
      console.error("Error fetching employee leaves:", error);
      toast.error("Failed to fetch leave data");
    } finally {
      setLoadingLeaves(false);
    }
  };

  const resetLeaveData = () => {
    setLeaveData(null);
    setFormData((prev) => ({
      ...prev,
      leaveDays: 0,
      paidLeaveDays: 0,
      unpaidLeaveDays: 0,
      presentDays: prev.totalDays,
    }));
  };

  const fetchEmployeeOvertime = async (employeeId, month, year) => {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      const response = await fetch(
        `/api/v1/admin/attendance?employeeId=${employeeId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      if (response.ok && data.attendance) {
        const totalOvertime = data.attendance.reduce((sum, record) => {
          return sum + (record.overtimeHours || 0);
        }, 0);
        const roundedOvertime = parseFloat(totalOvertime.toFixed(1));
        setFormData((prev) => ({
          ...prev,
          overtimeHours: roundedOvertime,
        }));
        if (roundedOvertime > 0) {
          toast.success(
            `Found ${roundedOvertime.toFixed(1)} overtime hour(s) for ${months[month - 1]
            }`
          );
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          overtimeHours: 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching employee overtime:", error);
      toast.error("Failed to fetch overtime data");
      setFormData((prev) => ({
        ...prev,
        overtimeHours: 0,
      }));
    }
  };

  const checkDuplicatePayslip = async () => {
    if (!formData.employee || !formData.month || !formData.year) return;
    setCheckingDuplicate(true);
    try {
      const response = await fetch(
        `/api/v1/admin/payslips?employee=${formData.employee}&month=${formData.month}&year=${formData.year}`
      );
      if (response.ok) {
        const data = await response.json();
        setDuplicatePayslip(data.exists ? data.payslip : null);
      }
    } catch (error) {
      console.error("Error checking duplicate payslip:", error);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const calculateTotals = () => {
    if (!employeeData || !formData.basicSalary) return;

    const salaryType = employeeData.payslipStructure?.salaryType || "monthly";
    let fullBasicSalary = parseFloat(formData.basicSalary) || 0;

    // Use values from formData directly
    let earnings = [...formData.earnings];
    let deductions = [...formData.deductions];

    let overtimeAmount =
      (parseFloat(formData.overtimeHours) || 0) *
      (parseFloat(formData.overtimeRate) || 0);

    if (salaryType === "monthly") {
      // 1. Full Month Calculations
      const totalFullMonthEarnings = earnings.reduce(
        (sum, e) => sum + (e.enabled ? (parseFloat(e.amount) || 0) : 0),
        0
      );
      
      const totalFullMonthDeductions = deductions.reduce(
        (sum, d) => sum + (d.enabled ? (parseFloat(d.amount) || 0) : 0),
        0
      );

      const storedCTC = parseFloat(formData.ctcGrossSalary) || 0;
      const calculatedGross = fullBasicSalary + totalFullMonthEarnings;
      const fullMonthGrossSalary = storedCTC > 0 ? storedCTC : calculatedGross;
      const fullMonthNetSalary = fullMonthGrossSalary - totalFullMonthDeductions;

      // 2. Pro-rated Effective Calculations based on Present Days
      const effectiveBasicSalary = (fullBasicSalary / formData.totalDays) * formData.presentDays;
      const effectiveCTC = (fullMonthGrossSalary / formData.totalDays) * formData.presentDays;
      const grossSalary = effectiveCTC + overtimeAmount;

      const effectiveEarningsList = earnings.map((e) => ({
        ...e,
        amount: e.enabled ? ((parseFloat(e.amount) || 0) / formData.totalDays) * formData.presentDays : 0,
      }));
      const totalEffectiveEarnings = effectiveEarningsList.reduce((sum, e) => sum + e.amount, 0);

      // Calculate Deductions based on Effective amounts 
      const effectiveDeductionsList = deductions.map((d) => {
        if (!d.enabled) return { ...d, amount: 0 };
        
        let amt = 0;
        if (d.name === "Professional Tax" || d.type === "Professional Tax") {
          amt = calculateProfessionalTax(
            grossSalary,
            employeeData.personalDetails?.gender || "Male",
            formData.month
          );
        } else if (d.name.includes("Provident Fund")) {
          // PF limit is practically pro-rated natively via totalDays ratio
          amt = ((parseFloat(d.fixedAmount || d.amount) || 0) / formData.totalDays) * formData.presentDays;
        } else if (d.name.includes("ESIC") || d.name.includes("Employee State Insurance")) {
          // ESIC follows the actual earned Gross Salary
          let percentage = 0.75;
          if (d.name.includes("Employer")) percentage = 3.25;
          if (d.calculationType === "percentage" && d.percentage > 0) percentage = d.percentage;
          amt = calculateESIC(grossSalary, percentage);
        } else if (d.calculationType === "percentage") {
          // General percentage deduction calculated on pro-rated Basic Salary
          amt = (effectiveBasicSalary * (parseFloat(d.percentage) || 0)) / 100;
        } else {
          // Fixed deductions remain fully charged
          amt = parseFloat(d.fixedAmount || d.amount) || 0;
        }

        return { ...d, amount: parseFloat(amt.toFixed(2)) };
      });
      
      const totalEffectiveDeductions = effectiveDeductionsList.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = grossSalary - totalEffectiveDeductions;

      setCalculatedValues({
        effectiveBasicSalary: parseFloat(effectiveBasicSalary.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        totalEarnings: parseFloat(totalEffectiveEarnings.toFixed(2)),
        totalDeductions: parseFloat(totalEffectiveDeductions.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2)),
        overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
        fullMonthGrossSalary: parseFloat(fullMonthGrossSalary.toFixed(2)),
        fullMonthNetSalary: parseFloat(fullMonthNetSalary.toFixed(2)),
        effectiveEarningsList,   // Save for submission
        effectiveDeductionsList  // Save for submission
      });
    } else {
      // Per day salary calculation
      const effectiveBasicSalary = fullBasicSalary * formData.presentDays;
      const grossSalary = effectiveBasicSalary + overtimeAmount;
      const netSalary = grossSalary; // No deductions for per day employees

      setCalculatedValues({
        effectiveBasicSalary: parseFloat(effectiveBasicSalary.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        totalEarnings: 0,
        totalDeductions: 0,
        netSalary: parseFloat(netSalary.toFixed(2)),
        overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
        fullMonthGrossSalary: parseFloat(grossSalary.toFixed(2)),
        fullMonthNetSalary: parseFloat(netSalary.toFixed(2)),
        effectiveEarningsList: [],
        effectiveDeductionsList: []
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Days") ||
          name.includes("Hours") ||
          name.includes("Rate") ||
          name === "basicSalary" ||
          name === "month" ||
          name === "year"
          ? parseFloat(value) || 0
          : value,
    }));
    if (name === "employee" && value) {
      fetchEmployeeDetails(value);
    }
  };

  const handleEarningChange = (index, field, value) => {
    const newEarnings = [...formData.earnings];
    if (field === "amount" || field === "percentage" || field === "fixedAmount") {
      newEarnings[index][field] = parseFloat(value) || 0;
    } else if (field === "enabled") {
      newEarnings[index][field] = value === "true" || value === true;
    } else {
      newEarnings[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, earnings: newEarnings }));
  };

  const handleDeductionChange = (index, field, value) => {
    const newDeductions = [...formData.deductions];
    if (field === "amount" || field === "percentage" || field === "fixedAmount") {
      newDeductions[index][field] = parseFloat(value) || 0;
    } else if (field === "enabled") {
      newDeductions[index][field] = value === "true" || value === true;
    } else {
      newDeductions[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, deductions: newDeductions }));
  };

  const addEarning = () => {
    setFormData((prev) => ({
      ...prev,
      earnings: [
        ...prev.earnings,
        {
          type: "Other",
          amount: 0,
          calculationType: "fixed",
          percentage: 0,
          fixedAmount: 0,
          enabled: true,
          editable: true,
        },
      ],
    }));
  };

  const removeEarning = (index) => {
    const newEarnings = formData.earnings.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, earnings: newEarnings }));
  };

  const addDeduction = () => {
    setFormData((prev) => ({
      ...prev,
      deductions: [
        ...prev.deductions,
        {
          type: "Other",
          amount: 0,
          calculationType: "fixed",
          percentage: 0,
          fixedAmount: 0,
          enabled: true,
          editable: true,
        },
      ],
    }));
  };

  const removeDeduction = (index) => {
    const newDeductions = formData.deductions.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, deductions: newDeductions }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employee) newErrors.employee = "Please select an employee";
    if (!formData.month) newErrors.month = "Month is required";
    if (!formData.year) newErrors.year = "Year is required";
    if (isFutureDate(formData.month, formData.year)) {
      newErrors.month = "Cannot generate payslip for future months";
      toast.error("Cannot generate payslip for future months");
    }
    if (formData.basicSalary <= 0)
      newErrors.basicSalary = "Basic salary must be greater than 0";
    if (formData.presentDays > formData.totalDays)
      newErrors.presentDays = "Present days cannot exceed total days";
    if (formData.presentDays < 0)
      newErrors.presentDays = "Present days cannot be negative";

    // Validate Organization from employee data
    const orgName = employeeData?.jobDetails?.organization || employeeData?.jobDetails?.organizationId?.name;
    if (employeeData && !orgName) {
      newErrors.employee = "Selected employee does not have an Organization assigned.";
      toast.error("Employee must have an Organization assigned to generate a payslip");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getGroupedEmployees = () => {
    const grouped = {};
    console.log("employees", employees);

    employees.forEach((emp) => {
      if (!emp.jobDetails) return;
      console.log("emp.jobDetails", emp.jobDetails);

      const org = emp.jobDetails?.organization || emp.jobDetails?.organizationId?.name || "Unassigned Organization";
      const dept = emp.jobDetails?.department || "Unassigned Department";
      const empType = emp.jobDetails?.employeeType || "Unassigned Type";
      if (!grouped[org]) grouped[org] = {};
      if (!grouped[org][dept]) grouped[org][dept] = {};
      if (!grouped[org][dept][empType]) grouped[org][dept][empType] = [];
      grouped[org][dept][empType].push(emp);
    });
    return grouped;
  };

  const EmployeeDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get employees based on selected filters (make them optional)
    const filteredEmployees = employees.filter((emp) => {
      const org = emp.jobDetails?.organization || emp.jobDetails?.organizationId?.name || "Unassigned Organization";
      const dept = emp.jobDetails?.department || "Unassigned Department";
      const empType = emp.jobDetails?.employeeType || "Unassigned Type";
      
      if (selectedOrg && org !== selectedOrg) return false;
      if (selectedDept && dept !== selectedDept) return false;
      if (selectedEmpType && empType !== selectedEmpType) return false;
      
      return `${emp.employeeId || ''} ${emp.personalDetails?.firstName || ''} ${emp.personalDetails?.lastName || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });

    const handleSelectEmployee = (empId) => {
      setFormData((prev) => ({ ...prev, employee: empId }));
      setIsOpen(false);
      setSearchTerm("");
      fetchEmployeeDetails(empId);
    };

    return (
      <div ref={dropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white text-left flex items-center justify-between ${errors.employee ? "border-red-300" : "border-slate-300"
            }`}
        >
          <span
            className={formData.employee ? "text-slate-900" : "text-slate-500"}
          >
            {formData.employee
              ? `${selectedEmployee?.employeeId} - ${selectedEmployee?.personalDetails?.firstName} ${selectedEmployee?.personalDetails?.lastName}`
              : "Choose an employee..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg z-50 max-h-96 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No employees found
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => handleSelectEmployee(emp._id)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors border-l-2 ${formData.employee === emp._id
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-medium"
                      : "hover:bg-slate-50 border-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{emp.employeeId}</p>
                        <p className="text-xs text-slate-500">
                          {emp.personalDetails?.firstName}{" "}
                          {emp.personalDetails?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {emp.jobDetails?.department}
                        </p>
                      </div>
                      {formData.employee === emp._id && (
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (duplicatePayslip) {
      const confirmOverwrite = window.confirm(
        `A payslip for ${months[formData.month - 1]} ${formData.year
        } already exists. Do you want to create a new one?`
      );
      if (!confirmOverwrite) return;
    }
    setLoading(true);
    try {
      const payload = {
        employee: formData.employee,
        month: formData.month,
        year: formData.year,
        basicSalary: calculatedValues.effectiveBasicSalary || formData.basicSalary,
        earnings: calculatedValues.effectiveEarningsList || formData.earnings,
        deductions: calculatedValues.effectiveDeductionsList || formData.deductions,
        grossSalary: calculatedValues.grossSalary,
        totalDeductions: calculatedValues.totalDeductions,
        netSalary: calculatedValues.netSalary,
        workingDays: formData.totalDays,
        presentDays: formData.presentDays,
        leaveDays: formData.leaveDays,
        paidLeaveDays: formData.paidLeaveDays,
        unpaidLeaveDays: formData.unpaidLeaveDays,
        overtimeHours: formData.overtimeHours,
        overtimeAmount: calculatedValues.overtimeAmount,
        status: "Generated",
        notes: formData.notes,
        organizationName: employeeData?.jobDetails?.organization || employeeData?.jobDetails?.organizationId?.name || "",
        salaryType: employeeData?.payslipStructure?.salaryType || "monthly",
        generatedBy: user?.id, // Add the current user ID
      };
      const response = await fetch("/api/v1/admin/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Payslip generated successfully!");

        // Clear form data
        setFormData({
          employee: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          basicSalary: 0,
          earnings: [],
          deductions: [],
          totalDays: 31,
          presentDays: 31,
          leaveDays: 0,
          paidLeaveDays: 0,
          unpaidLeaveDays: 0,
          overtimeHours: 0,
          overtimeRate: 0,
          notes: "",
        });
        setEmployeeData(null);
        setDuplicatePayslip(null);

        // Redirect immediately
        router.push("/admin/payroll/payslip");
      } else {
        if (data.error === "DUPLICATE_PAYSLIP") {
          setDuplicatePayslip(data.existingPayslipId);
          toast.error(data.message || "A payslip already exists");
        } else {
          toast.error(`Error: ${data.error || "Failed to generate payslip"}`);
        }
      }
    } catch (error) {
      console.error("Error generating payslip:", error);
      toast.error("An error occurred while generating the payslip");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.back();

  const selectedEmployee = employees.find(
    (emp) => emp._id === formData.employee
  );

  const getFormProgress = () => {
    const requiredFields = [
      formData.employee,
      formData.month,
      formData.year,
      formData.basicSalary > 0,
      formData.presentDays >= 0 && formData.presentDays <= formData.totalDays,
    ];
    const completedFields = requiredFields.filter((field) => field).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();

  const formatLeaveType = (leaveType) => {
    if (!leaveType) return "";
    if (leaveType.includes("Half-Day")) return leaveType;
    if (leaveType === "Paid" || leaveType === "Unpaid")
      return `${leaveType} Leave`;
    return leaveType;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Payslip Generator
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Earnings & Deductions calculated on final net salary
                </p>
              </div>
            </div>
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        {employeeData && formData.basicSalary > 0 && (
          <div className="bg-slate-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Calculation Formula:</strong>
                <div className="mt-2 space-y-1 font-mono text-xs">
                  {employeeData.payslipStructure?.salaryType === "monthly" ? (
                    <>
                      <div>
                        1. Full Month Basic Salary = ₹
                        {formData.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                      </div>
                      <div>
                        2. Add Earnings (% or fixed) = ₹
                        {formData.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}{" "}
                        + ₹
                        {calculatedValues.totalEarnings.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        ={" "}
                        <strong>
                          ₹
                          {(
                            formData.basicSalary +
                            calculatedValues.totalEarnings
                          ).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                      <div>
                        3. Full Month Gross Salary (before deductions) ={" "}
                        <strong>
                          ₹
                          {calculatedValues.fullMonthGrossSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                          )}
                        </strong>
                      </div>
                      <div>
                        4. Subtract Full Month Deductions = ₹
                        {calculatedValues.fullMonthGrossSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        - ₹
                        {calculatedValues.totalDeductions.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        ={" "}
                        <strong>
                          ₹
                          {calculatedValues.fullMonthNetSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                          )}
                        </strong>
                      </div>
                      <div className="pt-2 border-t border-blue-300">
                        5. Apply Working Days = (₹
                        {calculatedValues.fullMonthNetSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        ÷ {formData.totalDays}) × {formData.presentDays} ={" "}
                        <strong className="text-green-700">
                          ₹
                          {calculatedValues.netSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                      <div>
                        6. Add Overtime = ₹
                        {(
                          (calculatedValues.fullMonthNetSalary /
                            formData.totalDays) *
                          formData.presentDays
                        ).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}{" "}
                        + ₹
                        {calculatedValues.overtimeAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        ={" "}
                        <strong className="text-green-700">
                          ₹
                          {calculatedValues.netSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                      {formData.unpaidLeaveDays > 0 && (
                        <div className="text-orange-700 pt-1">
                          ⚠ Deducted for {formData.unpaidLeaveDays} unpaid
                          leave day(s)
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        1. Per Day Rate = ₹
                        {formData.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                      </div>
                      <div>
                        2. Basic Salary = ₹
                        {formData.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}{" "}
                        × {formData.presentDays} days ={" "}
                        <strong>
                          ₹
                          {calculatedValues.effectiveBasicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                          )}
                        </strong>
                      </div>
                      <div>
                        3. Gross Salary = ₹
                        {calculatedValues.effectiveBasicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}
                      </div>
                      <div>
                        4. Add Overtime = ₹
                        {calculatedValues.effectiveBasicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        + ₹
                        {calculatedValues.overtimeAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}{" "}
                        ={" "}
                        <strong className="text-green-700">
                          ₹
                          {calculatedValues.netSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                    </>
                  )}
                  <div className="pt-2 border-t border-blue-300 text-base">
                    <strong className="text-green-700">
                      Final Net Salary = ₹
                      {calculatedValues.netSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Generation Progress
            </h3>
            <span className="text-sm font-medium text-slate-600">
              {progress}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div
              className={`flex items-center space-x-2 ${formData.employee ? "text-green-700" : "text-slate-500"
                }`}
            >
              {formData.employee ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Employee Selected</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${formData.basicSalary > 0 ? "text-green-700" : "text-slate-500"
                }`}
            >
              {formData.basicSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Basic Salary Set</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${calculatedValues.grossSalary > 0
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {calculatedValues.grossSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Auto-Calculated</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${calculatedValues.netSalary > 0
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {calculatedValues.netSalary > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Ready to Generate</span>
            </div>
          </div>
          {loadingEmployeeDetails && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {loadingLeaves && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {leaveData && (
            <div className="mt-4 p-4 bg-slate-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CalendarDays className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800">
                    Leave Summary for {months[formData.month - 1]}{" "}
                    {formData.year}
                  </h4>
                  <div className="mt-2 space-y-1 text-sm text-blue-700">
                    <p>• Total Leaves: {leaveData.totalLeaves} day(s)</p>
                    <p>
                      • Paid Leaves: {leaveData.paidLeaves} day(s) (No salary
                      deduction)
                    </p>
                    <p>
                      • Unpaid Leaves: {leaveData.unpaidLeaves} day(s) (Salary
                      deducted)
                    </p>
                    {leaveData.unpaidLeaves > 0 && (
                      <p className="text-orange-700 font-medium mt-2">
                        ⚠ Present Days: {formData.totalDays} -{" "}
                        {leaveData.unpaidLeaves} unpaid = {formData.presentDays}{" "}
                        days
                      </p>
                    )}
                  </div>
                  {leaveData.details && leaveData.details.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-semibold text-blue-800">
                        Leave Details:
                      </p>
                      {leaveData.details.map((leave, idx) => (
                        <p key={idx} className="text-xs text-blue-600">
                          • {formatLeaveType(leave.leaveType)}:{" "}
                          {new Date(leave.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })} -{" "}
                          {leave.reason || "No reason"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {duplicatePayslip && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800">
                    Existing Payslip Found
                  </h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    A payslip for {months[formData.month - 1]} {formData.year}{" "}
                    already exists for this employee.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  Employee Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedOrg}
                    onChange={(e) => {
                      setSelectedOrg(e.target.value);
                      setSelectedDept("");
                      setSelectedEmpType("");
                      setFormData((prev) => ({ ...prev, employee: "" }));
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                  >
                    <option value="">Select Organization...</option>
                    {Object.keys(getGroupedEmployees()).map((org) => (
                      <option key={org} value={org}>
                        📍 {org}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Department{" "}
                    {selectedOrg && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => {
                      setSelectedDept(e.target.value);
                      setSelectedEmpType("");
                      setFormData((prev) => ({ ...prev, employee: "" }));
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white border-slate-300`}
                  >
                    <option value="">All Departments...</option>
                    {Array.from(new Set(employees.map(emp => emp.jobDetails?.department || "Unassigned Department"))).map(
                        (dept) => (
                          <option key={dept} value={dept}>
                            🏢 {dept}
                          </option>
                        )
                      )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Employee Type{" "}
                    {selectedDept && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={selectedEmpType}
                    onChange={(e) => {
                      setSelectedEmpType(e.target.value);
                      setFormData((prev) => ({ ...prev, employee: "" }));
                    }}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white border-slate-300`}
                  >
                    <option value="">All Employee Types...</option>
                    {Array.from(new Set(employees.map(emp => emp.jobDetails?.employeeType || "Unassigned Type"))).map((type) => (
                        <option key={type} value={type}>
                          👤 {type}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Select Employee <span className="text-red-500">*</span>
                  </label>
                  <EmployeeDropdown />
                  {errors.employee && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.employee}</span>
                    </div>
                  )}
                </div>
                {selectedEmployee && (
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {selectedEmployee.personalDetails?.firstName}{" "}
                          {selectedEmployee.personalDetails?.lastName}
                        </div>
                        <div className="text-sm text-slate-600">
                          {selectedEmployee.jobDetails?.department}
                        </div>
                        <div className="text-xs text-slate-500">
                          ID: {selectedEmployee.employeeId}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    >
                      {months.map((month, index) => {
                        const mValue = index + 1;
                        const disabled = isFutureDate(mValue, formData.year);
                        return (
                          <option key={month} value={mValue} disabled={disabled}>
                            {month} {disabled ? "(Future)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <select
                      name="year"
                      value={formData.year}
                      onChange={(e) => {
                        const newYear = parseInt(e.target.value);
                        let newMonth = formData.month;
                        if (newYear === currentYear && formData.month > currentMonth) {
                          newMonth = currentMonth;
                        }
                        setFormData(prev => ({ ...prev, year: newYear, month: newMonth }));
                      }}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                    >
                      {[currentYear - 1, currentYear].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  Salary Summary
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Basic Salary:</span>
                  <span className="font-semibold text-slate-900">
                    ₹
                    {calculatedValues.effectiveBasicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                    )}
                  </span>
                </div>
                {calculatedValues.overtimeAmount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600">Overtime:</span>
                    <span className="font-semibold text-green-600">
                      +₹
                      {calculatedValues.overtimeAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                {employeeData?.payslipStructure?.salaryType === "monthly" &&
                  calculatedValues.totalEarnings > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">
                        Additional Earnings:
                      </span>
                      <span className="font-semibold text-green-600">
                        +₹
                        {calculatedValues.totalEarnings.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Gross Salary:</span>
                  <span className="font-semibold text-slate-900">
                    ₹
                    {calculatedValues.grossSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {employeeData?.payslipStructure?.salaryType === "monthly" &&
                  calculatedValues.totalDeductions > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-600">Total Deductions:</span>
                      <span className="font-semibold text-red-600">
                        -₹
                        {calculatedValues.totalDeductions.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}
                      </span>
                    </div>
                  )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="text-lg font-bold text-slate-900">
                    Net Salary:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    ₹
                    {calculatedValues.netSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-3 space-y-8">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  Basic Salary & Attendance
                </h2>
                {employeeData && (
                  <p className="text-slate-600 text-sm mt-1">
                    {employeeData.payslipStructure?.salaryType === "monthly"
                      ? "Formula: Net Salary = (Gross Salary - Deductions) based on working days + Overtime"
                      : "Formula: Rate × Present Days + Overtime"}
                  </p>
                )}
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Basic Salary{" "}
                    {employeeData?.payslipStructure?.salaryType === "perday" &&
                      "(Per Day Rate)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                      ₹
                    </span>
                    <input
                      name="basicSalary"
                      type="number"
                      value={formData.basicSalary}
                      disabled
                      className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-gray-50 text-gray-700"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Auto-filled from employee salary details
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Total Days
                    </label>
                    <input
                      name="totalDays"
                      type="number"
                      value={formData.totalDays}
                      disabled
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Present Days
                      <div className="group relative">
                        <Info className="w-3 h-3 text-slate-400" />
                        <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap z-10">
                          Total Days - Unpaid Leaves
                        </div>
                      </div>
                    </label>
                    <input
                      name="presentDays"
                      type="number"
                      value={formData.presentDays}
                      disabled
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Paid Leaves
                    </label>
                    <input
                      type="number"
                      value={formData.paidLeaveDays}
                      disabled
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-green-50 text-green-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Unpaid Leaves
                    </label>
                    <input
                      type="number"
                      value={formData.unpaidLeaveDays}
                      disabled
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-red-50 text-red-700"
                    />
                  </div>
                </div>
                {employeeData && formData.basicSalary > 0 && (
                  <div className="bg-slate-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Calculation Flow:</strong>{" "}
                      {employeeData.payslipStructure?.salaryType === "monthly"
                        ? `1. Calculate full month Gross (Basic + Earnings). 2. Subtract full month Deductions. 3. Apply working days: (Net Salary ÷ ${formData.totalDays}) × ${formData.presentDays}. 4. Add overtime.`
                        : `Per day calculation: ₹${formData.basicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} × ${formData.presentDays
                        } present days = ₹${calculatedValues.effectiveBasicSalary.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 }
                        )}`}
                    </p>
                    {formData.unpaidLeaveDays > 0 && (
                      <p className="text-xs text-orange-700 mt-1">
                        <strong>Deduction:</strong> {formData.unpaidLeaveDays}{" "}
                        unpaid leave day(s) ={" "}
                        {formData.totalDays - formData.presentDays} days
                        deducted
                      </p>
                    )}
                  </div>
                )}
                {errors.presentDays && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.presentDays}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Overtime Hours
                    </label>
                    <input
                      name="overtimeHours"
                      type="number"
                      value={formData.overtimeHours}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      Overtime Rate
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                        ₹
                      </span>
                      <input
                        name="overtimeRate"
                        type="number"
                        value={formData.overtimeRate}
                        onChange={handleChange}
                        className="w-full pl-8 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {employeeData?.payslipStructure?.salaryType === "monthly" && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        Earnings & Allowances
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">
                        Calculated on Basic Salary only
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Percent className="w-3 h-3 inline mr-1" />
                      Employee Based
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {formData.earnings.length > 0 ? (
                    <div className="space-y-4">
                      {formData.earnings.map((earning, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={earning.type}
                              onChange={(e) =>
                                handleEarningChange(
                                  index,
                                  "type",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2.5 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                            />
                            <select
                              value={earning.calculationType}
                              onChange={(e) =>
                                handleEarningChange(
                                  index,
                                  "calculationType",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2.5 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                            >
                              <option value="fixed">Fixed Amount</option>
                              <option value="percentage">Percentage</option>
                            </select>
                            {earning.calculationType === "percentage" ? (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  %
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={earning.percentage}
                                  onChange={(e) =>
                                    handleEarningChange(
                                      index,
                                      "percentage",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={earning.fixedAmount}
                                  onChange={(e) =>
                                    handleEarningChange(
                                      index,
                                      "fixedAmount",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 border border-green-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                />
                              </div>
                            )}
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={earning.enabled}
                                onChange={(e) =>
                                  handleEarningChange(
                                    index,
                                    "enabled",
                                    e.target.checked
                                  )
                                }
                              />
                              Enabled
                            </label>
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={earning.amount}
                              disabled
                              className="w-full pl-8 pr-3 py-2.5 border border-green-300 rounded-lg text-sm bg-gray-50 text-gray-700"
                            />
                            {earning.calculationType === "percentage" &&
                              earning.percentage > 0 && (
                                <p className="text-xs text-green-600 mt-1">
                                  {earning.percentage}% of Basic Salary = ₹
                                  {earning.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                  })}
                                </p>
                              )}
                            {earning.calculationType === "fixed" && (
                              <p className="text-xs text-green-600 mt-1">
                                Fixed Amount = ₹
                                {earning.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                })}
                              </p>
                            )}
                          </div>
                          {earning.editable && (
                            <button
                              type="button"
                              onClick={() => removeEarning(index)}
                              className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addEarning}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Earning
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        No earnings configured for employee
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {employeeData?.payslipStructure?.salaryType === "monthly" && (
              <div className="bg-white rounded-xl border border-slate-200">
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                          <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
                        </div>
                        Deductions
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">
                        Calculated on Basic Salary only
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      <Percent className="w-3 h-3 inline mr-1" />
                      Employee Based
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {formData.deductions.length > 0 ? (
                    <div className="space-y-4">
                      {formData.deductions.map((deduction, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={deduction.type}
                              onChange={(e) =>
                                handleDeductionChange(
                                  index,
                                  "type",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                            />
                            <select
                              value={deduction.calculationType}
                              onChange={(e) =>
                                handleDeductionChange(
                                  index,
                                  "calculationType",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                            >
                              <option value="fixed">Fixed Amount</option>
                              <option value="percentage">Percentage</option>
                            </select>
                            {deduction.calculationType === "percentage" ? (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  %
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={deduction.percentage}
                                  onChange={(e) =>
                                    handleDeductionChange(
                                      index,
                                      "percentage",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={deduction.fixedAmount}
                                  onChange={(e) =>
                                    handleDeductionChange(
                                      index,
                                      "fixedAmount",
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                />
                              </div>
                            )}
                            <label className="flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                checked={deduction.enabled}
                                onChange={(e) =>
                                  handleDeductionChange(
                                    index,
                                    "enabled",
                                    e.target.checked
                                  )
                                }
                              />
                              Enabled
                            </label>
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={deduction.amount}
                              disabled
                              className="w-full pl-8 pr-3 py-2.5 border border-red-300 rounded-lg text-sm bg-gray-50 text-gray-700"
                            />
                            {deduction.calculationType === "percentage" &&
                              deduction.percentage > 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                  {deduction.percentage}% of Basic Salary = ₹
                                  {deduction.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                  })}
                                </p>
                              )}
                            {deduction.calculationType === "fixed" && (
                              <p className="text-xs text-red-600 mt-1">
                                Fixed Amount = ₹
                                {deduction.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                                })}
                              </p>
                            )}
                          </div>
                          {deduction.editable && (
                            <button
                              type="button"
                              onClick={() => removeDeduction(index)}
                              className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDeduction}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Custom Deduction
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        No deductions configured for employee
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {employeeData?.payslipStructure?.salaryType === "perday" && (
              <div className="bg-slate-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      Per Day Salary Type
                    </h4>
                    <p className="text-blue-700 text-sm mt-1">
                      For per-day salary, only basic salary applies. No
                      additional earnings or deductions are calculated.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  Additional Notes
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                  placeholder="Add any notes, comments, or special instructions..."
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !employeeData}
                className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Generate Payslip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}