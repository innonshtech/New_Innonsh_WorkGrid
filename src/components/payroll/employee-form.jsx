"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  Briefcase,
  CreditCard,
  Save,
  X,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  DollarSign,
  Trash2,
  Eye,
  IdCard,
  CreditCard as Card,
  Car,
  Briefcase as Case,
  Banknote,
  UserCheck,
  Clock,
  Info,
  GraduationCap,
  Shield,
  FileWarning,
  BadgeDollarSign,
  Calculator,
  Percent,
  Plus,
  TrendingUp,
  Users,
  Download,
  MapPin,
  Home,
  ChevronRight,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import SimpleSelect from "./SimpleSelect";
import SearchableSelect from "./SearchableSelect";
import DocumentUploadSection from "./DocumentUploadSection";
import PayslipStructureSection from "./PayslipStructureSection";

// ==================== CLOUDINARY CONFIGURATION ====================
const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "unifoods",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unifoods",
  folder: "employee-documents",
};

import VariablePaySection from "@/components/payroll/VariablePaySection";

// ==================== DROPDOWN OPTIONS ====================
const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Suspended", label: "Suspended" },
  { value: "Terminated", label: "Terminated" },
];

const employmentTypeOptions = [
  { value: "Full-Time", label: "Full-Time" },
  { value: "Part-Time", label: "Part-Time" },
  { value: "Contract", label: "Contract" },
  { value: "Intern", label: "Intern" },
];



const validators = {
  name: (v) => /^[A-Za-z\s]{1,40}$/.test(v?.trim() || ""),
  email: (v) => /^\S+@\S+\.\S+$/.test(v?.trim() || ""),
  phone: (v) => /^[6-9]\d{9}$/.test(v?.replace(/\D/g, "") || ""),
  positiveNumber: (v) => /^\d+$/.test(v) && parseInt(v) > 0,
  accountNumber: (v) => /^[A-Z0-9]{9,30}$/i.test(v),
  ifsc: (v) => /^[A-Z0-9]{11}$/.test((v || "").toUpperCase()),
  pan: (v) =>
    /^[A-Z]{3}[PCHABGJTFL][A-Z]\d{4}[A-Z]$/.test((v || "").toUpperCase()),
  aadhar: (v) => /^\d{12}$/.test((v || "").replace(/\s/g, "")),
  zip: (v) => !v || /^\d{6}$/.test(v),
};

// ==================== FORMATTING HELPERS ====================
const formatPhoneNumber = (value) => {
  const phone = value.replace(/\D/g, "");
  if (phone.length <= 3) return phone;
  if (phone.length <= 7) return `${phone.slice(0, 3)} ${phone.slice(3)}`;
  return `${phone.slice(0, 3)} ${phone.slice(3, 7)} ${phone.slice(7, 10)}`;
};

const formatPanNumber = (value) => {
  const pan = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (pan.length <= 5) return pan;
  if (pan.length <= 9) return `${pan.slice(0, 5)}${pan.slice(5)}`;
  return `${pan.slice(0, 5)}${pan.slice(5, 9)}${pan.slice(9, 10)}`;
};

const formatAadharNumber = (value) => {
  const aadhar = value.replace(/\D/g, "");
  if (aadhar.length <= 4) return aadhar;
  if (aadhar.length <= 8) return `${aadhar.slice(0, 4)} ${aadhar.slice(4)}`;
  return `${aadhar.slice(0, 4)} ${aadhar.slice(4, 8)} ${aadhar.slice(8, 12)}`;
};

const formatIfscCode = (value) => {
  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
};

export default function EmployeeForm({ employeeData, isEdit = false }) {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const router = useRouter();
  const [errors, setErrors] = useState({});

  // State for dynamic dropdowns
  const [organizations, setOrganizations] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [roles, setRoles] = useState([]);

  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const steps = [
    { id: 0, title: "Role & Organization", description: "Employee role and department", icon: Building },
    { id: 1, title: "Personal Details", description: "Identity and contact info", icon: User },
    { id: 2, title: "Financial & Compliance", description: "Bank and statutory details", icon: Shield },
    { id: 3, title: "Compensation", description: "Salary structure and breakdown", icon: BadgeDollarSign },
    { id: 4, title: "Variable Pay", description: "Performance linked components", icon: TrendingUp },
    { id: 5, title: "Approvals & Documents", description: "Shift, supervisors and files", icon: FileText },
  ];

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const validateStep = (step) => {
    const currentStepErrors = {};
    let isValid = true;

    // Validate fields based on step
    switch (step) {
      case 0: // Role & Organization
        // Employee ID, Password, and Role are now optional
        if (!formData.jobDetails.organizationId) currentStepErrors["jobDetails.organizationId"] = "Organization is required";
        if (!formData.jobDetails.departmentId) currentStepErrors["jobDetails.departmentId"] = "Department is required";
        if (!formData.jobDetails.designation?.trim()) currentStepErrors["jobDetails.designation"] = "Designation is required";
        break;

      case 1: // Personal Details
        if (!formData.personalDetails.firstName) currentStepErrors["personalDetails.firstName"] = "First name is required";
        if (!formData.personalDetails.lastName) currentStepErrors["personalDetails.lastName"] = "Last name is required";
        if (!formData.personalDetails.email) {
          currentStepErrors["personalDetails.email"] = "Email is required";
        } else if (!validators.email(formData.personalDetails.email)) {
          currentStepErrors["personalDetails.email"] = "Please enter a valid email address";
        }
        if (!formData.personalDetails.phone) {
          currentStepErrors["personalDetails.phone"] = "Phone is required";
        } else if (!validators.phone(formData.personalDetails.phone)) {
          currentStepErrors["personalDetails.phone"] = "Please enter a valid phone number";
        }
        if (!formData.personalDetails.dateOfJoining) currentStepErrors["personalDetails.dateOfJoining"] = "Date of joining is required";
        break;

      case 2: // Financial & Compliance
        if (!formData.salaryDetails.bankAccount.accountNumber) currentStepErrors["salaryDetails.bankAccount.accountNumber"] = "Account number is required";
        if (!formData.salaryDetails.bankAccount.bankName) currentStepErrors["salaryDetails.bankAccount.bankName"] = "Bank name is required";
        if (!formData.salaryDetails.bankAccount.ifscCode) currentStepErrors["salaryDetails.bankAccount.ifscCode"] = "IFSC code is required";
        if (!formData.salaryDetails.aadharNumber) currentStepErrors["salaryDetails.aadharNumber"] = "Aadhar number is required";
        break;

      case 3: // Compensation
        if (!formData.payslipStructure.salaryType) currentStepErrors["payslipStructure.salaryType"] = "Salary type is required";
        // Basic salary validation
        if (!formData.payslipStructure.basicSalary || formData.payslipStructure.basicSalary <= 0) {
          currentStepErrors["payslipStructure.basicSalary"] = "Basic salary must be greater than 0";
        }
        break;

      case 4: // Variable Pay
        // No mandatory validation for variable pay yet, but can add if needed
        break;
    }

    if (Object.keys(currentStepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...currentStepErrors }));
      toast.error("Please fix errors in this step before proceeding");
      isValid = false;
    }

    return isValid;
  };

  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Validate current step before moving forward
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev + -1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Status Change (Quick Activate/Deactivate)
  const handleStatusChange = async (newStatus) => {
    // For Inactive, we can still use the DELETE endpoint if preferred, or just use PATCH for both.
    // Using PATCH for both is cleaner for status toggles.
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/employees/${employeeData._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error(`Failed to update status to ${newStatus}`);

      toast.success(`Employee status updated to ${newStatus}`);
      setFormData(prev => ({ ...prev, status: newStatus }));
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Soft Delete (Deactivate) - Kept for backward compatibility if needed, 
  // but handleStatusChange('Inactive') could replace it.
  const handleSoftDelete = async () => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeData._id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to deactivate employee");

      toast.success("Employee deactivated successfully");
      router.push("/admin/payroll/employees");
      router.refresh();
    } catch (error) {
      console.error("Error deactivating employee:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Permanent Delete
  const handlePermanentDelete = async () => {
    if (!confirm("ARE YOU SURE? This will PERMANENTLY DELETE the employee and cannot be undone.")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeData._id}?permanent=true`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete employee");

      toast.success("Employee permanently deleted");
      router.push("/admin/payroll/employees");
      router.refresh();
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };


  const [designations, setDesignations] = useState([]);
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    personalDetails: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      dateOfJoining: "",
      dateOfBirth: "",
      gender: "",
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
        address: "", // NEW
      },
      bloodGroup: "", // NEW
      currentAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
      permanentAddress: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
      },
    },
    // NEW FIELDS
    password: "",
    confirmPassword: "",
    role: "employee",
    roleId: "",
    isCompliant: false,
    isTDSApplicable: false,

    jobDetails: {
      organization: "",
      organizationId: "",
      businessUnit: "",
      businessUnitId: "",
      department: "",
      departmentId: "",
      team: "",
      teamId: "",
      costCenter: "",
      costCenterId: "",
      employeeType: "",
      employeeTypeId: "",
      category: "",
      categoryId: "",
      teamLead: "",
      designation: "",
      workLocation: "",
      assignedOfficeId: "", // NEW
      biometricDeviceId: "", // NEW
      defaultShift: "", // NEW
    },
    salaryDetails: {
      // Basic salary removed from here - now managed in payslipStructure
      bankAccount: {
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        branch: "",
        branchAddress: "",
      },
      panNumber: "",
      aadharNumber: "",
    },
    variablePayStructure: [],
    payslipStructure: {
      salaryType: "monthly",
      basicSalary: 0,
      grossSalary: 0,
      earnings: [
        {
          name: "House Rent Allowance",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 50,
          fixedAmount: 0,
        },
        {
          name: "Transport Allowance",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 50,
          fixedAmount: 0,
        },
      ],
      deductions: [
        {
          name: "Provident Fund",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 13,
          fixedAmount: 0,
        },
        {
          name: "Professional Tax",
          enabled: true,
          editable: true,
          calculationType: "fixed",
          percentage: 0,
          fixedAmount: 200,
        },
      ],
      additionalFields: [
        { name: "Bank Account Number", enabled: true },
        { name: "PAN Number", enabled: true },
        { name: "UAN Number", enabled: true },
        { name: "Working Days", enabled: true },
      ],
    },
    probation: "no",
    probationDuration: 0,
    isAttending: "no",
    attendanceApproval: {
      required: "no",
      shift1Supervisor: "",
      shift2Supervisor: "",
    },
    status: "Active",
    workingHr: "",
    otApplicable: "",
    esicApplicable: "",
    pfApplicable: "",
    isCompliant: false,
  });

  // File handling functions
  const handleFilesChange = (newFiles) => {
    setUploadedFiles(newFiles);
  };

  const handleFileRemove = (fileId) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId));
  };

  // Fetch functions
  const fetchShifts = async () => {
    try {
      const response = await fetch("/api/v1/admin/payroll/shifts");
      if (!response.ok) {
        console.warn("Failed to fetch shifts: Server returned status", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("Failed to fetch shifts: Expected JSON but received", contentType);
        return;
      }
      const data = await response.json();
      if (data.success) {
        const shifts = Array.isArray(data.shifts) ? data.shifts : Array.isArray(data.data) ? data.data : [];
        setAvailableShifts(shifts.map(s => ({ value: String(s._id), label: `${s.name} (${s.startTime} - ${s.endTime})` })));
      }
    } catch (error) {
      console.error("Error fetching shifts:", error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/v1/admin/crm/organizations?limit=1000");
      if (response.status === 403) {
        console.error("❌ Access Denied: Your account does not have admin permissions to fetch organizations.");
        toast.error("Access Denied: You don't have permission to view organizations. Please login as Admin.", { id: "auth-error" });
        setOrganizations([]);
        return;
      }
      if (!response.ok) {
        console.error("❌ Organization API Error:", response.status);
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Organization API returned non-JSON");
        throw new Error("Server returned an invalid response. Please check your connection.");
      }

      const data = await response.json();

      const orgArray = Array.isArray(data.organizations) ? data.organizations : Array.isArray(data.data) ? data.data : [];
      
      if (orgArray.length === 0) {
        console.warn("⚠️ No organizations found in the database.");
      }
      const organizationOptions = orgArray.map((org) => ({
        value: String(org.mongoId || org._id || org.id),
        label: org.name,
        orgId: org.orgId,
      }));

      setOrganizations(organizationOptions);

      if (organizationOptions.length === 1) {
        handleSelectChange("jobDetails.organizationId", organizationOptions[0].value);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error(error.message || "Failed to load organizations");
      setOrganizations([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchBusinessUnits = async (organizationId) => {
    try {
      if (!organizationId) {
        setBusinessUnits([]);
        return;
      }
      const response = await fetch(`/api/v1/admin/crm/business-units?organizationId=${organizationId}&limit=1000`);
      if (!response.ok) {
        console.error("❌ Business Units API Error:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Business Units API returned non-JSON");
        return;
      }

      const data = await response.json();
      const buArray = Array.isArray(data.data) ? data.data : Array.isArray(data.businessUnits) ? data.businessUnits : [];
      setBusinessUnits(buArray.map(bu => ({ value: String(bu.mongoId || bu._id || bu.id), label: bu.name })));
    } catch (error) {
      console.error("Error fetching business units:", error);
      setBusinessUnits([]);
    }
  };

  const fetchCostCenters = async () => {
    try {
      const response = await fetch("/api/v1/admin/finance/cost-centers?limit=1000");
      if (!response.ok) {
        console.error("❌ Cost Centers API Error:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Cost Centers API returned non-JSON");
        return;
      }

      const data = await response.json();
      const ccArray = Array.isArray(data.data) ? data.data : Array.isArray(data.costCenters) ? data.costCenters : [];
      setCostCenters(ccArray.map(cc => ({ value: String(cc.mongoId || cc._id || cc.id), label: `${cc.name} (${cc.code})` })));
    } catch (error) {
      console.error("Error fetching cost centers:", error);
      setCostCenters([]);
    }
  };

  const fetchTeams = async (departmentId) => {
    try {
      if (!departmentId) {
        setTeams([]);
        return;
      }
      const response = await fetch(`/api/v1/admin/crm/teams?departmentId=${departmentId}&limit=1000`);
      if (!response.ok) {
        console.error("❌ Teams API Error:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Teams API returned non-JSON");
        return;
      }

      const data = await response.json();
      const teamsArray = Array.isArray(data.data) ? data.data : Array.isArray(data.teams) ? data.teams : [];
      const mapped = teamsArray.map(team => ({ value: String(team.mongoId || team._id || team.id), label: team.name }));
      setTeams(mapped);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to fetch teams");
      setTeams([]);
    }
  };

  const fetchDepartments = async (businessUnitId) => {
    try {
      if (!businessUnitId) {
        setDepartments([]);
        return;
      }
      const response = await fetch(`/api/v1/admin/crm/departments?businessUnitId=${businessUnitId}&limit=1000`);
      if (!response.ok) {
        console.error('❌ Departments API Error:', response.status);
        setDepartments([]);
        return;
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Departments API returned non-JSON');
        setDepartments([]);
        return;
      }
      const data = await response.json();
      const deptArray = Array.isArray(data.data) ? data.data : Array.isArray(data.departments) ? data.departments : [];
      let departmentOptions = deptArray
        .filter((dept) => dept.status === 'Active')
        .map((dept) => ({
          value: String(dept.mongoId || dept._id || dept.id),
          label: dept.departmentName,
          name: dept.departmentName,
        }));
      // If no departments found (possible filtering issue), retry without businessUnitId filter
      if (departmentOptions.length === 0) {
        const fallbackResponse = await fetch('/api/v1/admin/crm/departments?limit=1000');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const fallbackArray = Array.isArray(fallbackData.data) ? fallbackData.data : Array.isArray(fallbackData.departments) ? fallbackData.departments : [];
          departmentOptions = fallbackArray
            .filter((dept) => dept.status === 'Active')
            .map((dept) => ({
              value: String(dept.mongoId || dept._id || dept.id),
              label: dept.departmentName,
              name: dept.departmentName,
            }));
        }
      }
      setDepartments(departmentOptions);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
      setDepartments([]);
    }
  };




  const fetchEmployeeTypes = async (organizationId, departmentId) => {
    try {
      if (!organizationId || !departmentId) {
        setEmployeeTypes([]);
        return;
      }
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("departmentId", departmentId);
      params.set("limit", "1000");
      const response = await fetch(
        `/api/v1/admin/crm/employeetype?${params.toString()}`
      );
      
      if (!response.ok) {
        console.error("❌ Employee Types API Error:", response.status);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Employee Types API returned non-JSON");
        return;
      }

      const data = await response.json();
      const etArray = Array.isArray(data.data) ? data.data : Array.isArray(data.employeeTypes) ? data.employeeTypes : [];
      const employeeTypeOptions = etArray.map((item) => ({
        value: String(item.mongoId || item._id || item.id),
        label: item.employeeType,
        typeName: item.employeeType,
      }));

      setEmployeeTypes(employeeTypeOptions);
    } catch (error) {
      console.error("Error fetching employee types:", error);
      toast.error("Failed to fetch employee types");
      setEmployeeTypes([]);
    }
  };


  const fetchSupervisors = async (organizationId) => {
    try {
      if (!organizationId) {
        setAvailableSupervisors([]);
        return;
      }
      setLoadingSupervisors(true);
      const response = await fetch(
        `/api/v1/admin/employees?organizationId=${organizationId}&status=Active&limit=1000`
      );
      
      if (!response.ok) {
        console.error("❌ Supervisors API Error:", response.status);
        return;
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Supervisors API returned non-JSON");
        return;
      }

      const data = await response.json();
      const empArray = Array.isArray(data.employees) ? data.employees : Array.isArray(data.data) ? data.data : [];
      const supervisorOptions = empArray
        .filter((emp) => emp._id !== employeeData?._id)
        .map((emp) => ({
          value: String(emp.mongoId || emp._id || emp.id),
          label: `${emp.personalDetails?.firstName || emp.firstName || ''} ${emp.personalDetails?.lastName || emp.lastName || ''} (${emp.employeeId || ''})`,
        }));

      setAvailableSupervisors(supervisorOptions);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      setAvailableSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const fetchOfficeLocations = async (organizationId) => {
    try {
      if (!organizationId) {
        setOfficeLocations([]);
        return;
      }
      const response = await fetch(`/api/settings/office-locations?organizationId=${organizationId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch office locations");

      const locArray = Array.isArray(data.locations) ? data.locations : Array.isArray(data.data) ? data.data : [];
      setOfficeLocations(locArray.map(loc => ({
        value: String(loc.mongoId || loc._id || loc.id),
        label: loc.name
      })));

    } catch (error) {
      console.error("Error fetching office locations:", error);
      setOfficeLocations([]);
    }
  };

  const fetchDesignations = async (organizationId) => {
    try {
      if (!organizationId) {
        setDesignations([]);
        return;
      }
      const response = await fetch(`/api/v1/admin/crm/designations?organizationId=${organizationId}&limit=1000`);
      if (!response.ok) {
        console.error("❌ Designations API Error:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Designations API returned non-JSON");
        return;
      }

      const data = await response.json();
      const desigArray = Array.isArray(data.data) ? data.data : [];
      // Use name as value to maintain backward compatibility with existing data
      setDesignations(desigArray.map(d => ({ value: d.name, label: d.name })));
    } catch (error) {
      console.error("Error fetching designations:", error);
      setDesignations([]);
    }
  };

  const fetchBanks = async (organizationId) => {
    try {
      if (!organizationId) {
        setBanks([]);
        return;
      }
      const response = await fetch(`/api/v1/admin/crm/banks?organizationId=${organizationId}&limit=1000`);
      if (!response.ok) {
        console.error("❌ Banks API Error:", response.status);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Banks API returned non-JSON");
        return;
      }

      const data = await response.json();
      const bankArray = Array.isArray(data.data) ? data.data : [];
      setBanks(bankArray.map(b => ({ value: b.name, label: b.name })));
    } catch (error) {
      console.error("Error fetching banks:", error);
      setBanks([]);
    }
  };


  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/v1/admin/roles');
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles.map(r => ({ value: r.mongoId || r._id || r.id, label: r.name })));
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
    fetchCostCenters();
    fetchShifts();
    fetchRoles();
  }, []);

  // Cascade fetches
  useEffect(() => {
    if (formData.jobDetails.organizationId) {
      fetchBusinessUnits(formData.jobDetails.organizationId);
      fetchSupervisors(formData.jobDetails.organizationId);
      fetchOfficeLocations(formData.jobDetails.organizationId);
      fetchDesignations(formData.jobDetails.organizationId);
      fetchBanks(formData.jobDetails.organizationId);
    } else {
      setBusinessUnits([]);
      setDepartments([]);
      setTeams([]);
      setEmployeeTypes([]);
      setTeamLeads([]);
      setAvailableSupervisors([]);
      setDesignations([]);
      setBanks([]);
    }
  }, [formData.jobDetails.organizationId]);

  useEffect(() => {
    if (formData.jobDetails.businessUnitId) {
      fetchDepartments(formData.jobDetails.businessUnitId);
    } else {
      setDepartments([]);
      setTeams([]);
    }
  }, [formData.jobDetails.businessUnitId]);

  useEffect(() => {
    if (formData.jobDetails.departmentId) {
      fetchTeams(formData.jobDetails.departmentId);
      if (formData.jobDetails.organizationId) {
        fetchEmployeeTypes(formData.jobDetails.organizationId, formData.jobDetails.departmentId);
      }
    } else {
      setTeams([]);
      setEmployeeTypes([]);
    }
  }, [formData.jobDetails.departmentId, formData.jobDetails.organizationId]);

  useEffect(() => {
    const { organizationId } = formData.jobDetails;

    if (organizationId) {
      console.log("[EmployeeForm] Triggering fetchTeamLeads for entire organization");
      fetchTeamLeads(organizationId, employeeData?._id);
    } else {
      setTeamLeads([]);
    }
  }, [formData.jobDetails.organizationId, employeeData?._id]);




  // Load existing employee data in edit mode
  useEffect(() => {
    if (employeeData && isEdit) {
      // Robust merge to ensure all nested objects exist
      setFormData((prev) => {
        const mergedData = {
          ...prev,
          ...employeeData,
          personalDetails: {
            ...prev.personalDetails,
            ...(employeeData.personalDetails || {}),
            currentAddress: {
              ...prev.personalDetails.currentAddress,
              ...(employeeData.personalDetails?.currentAddress || employeeData.personalDetails?.address || {}),
            },
            permanentAddress: {
              ...prev.personalDetails.permanentAddress,
              ...(employeeData.personalDetails?.permanentAddress || {}),
            },
            emergencyContact: {
              ...prev.personalDetails.emergencyContact,
              ...(employeeData.personalDetails?.emergencyContact || {}),
            },
          },
          jobDetails: {
            ...prev.jobDetails,
            ...(employeeData.jobDetails || {}),
            // Ensure ID fields are extracted correctly if they are populated objects
            reportingManager: employeeData.jobDetails?.reportingManager?._id || employeeData.jobDetails?.reportingManager || "",
            teamLead: employeeData.jobDetails?.teamLead?._id || employeeData.jobDetails?.teamLead || "",
            organizationId: employeeData.jobDetails?.organizationId?._id || employeeData.jobDetails?.organizationId || "",
            departmentId: employeeData.jobDetails?.departmentId?._id || employeeData.jobDetails?.departmentId || "",
            businessUnitId: employeeData.jobDetails?.businessUnitId?._id || employeeData.jobDetails?.businessUnitId || "",
            teamId: employeeData.jobDetails?.teamId?._id || employeeData.jobDetails?.teamId || "",
            costCenterId: employeeData.jobDetails?.costCenterId?._id || employeeData.jobDetails?.costCenterId || "",
            employeeTypeId: employeeData.jobDetails?.employeeTypeId?._id || employeeData.jobDetails?.employeeTypeId || "",
            categoryId: employeeData.jobDetails?.categoryId?._id || employeeData.jobDetails?.categoryId || "",
            defaultShift: employeeData.jobDetails?.defaultShift?._id || employeeData.jobDetails?.defaultShift || "",
            assignedOfficeId: employeeData.jobDetails?.assignedOfficeId?._id || employeeData.jobDetails?.assignedOfficeId || "",
            biometricDeviceId: employeeData.jobDetails?.biometricDeviceId || "",
          },
          salaryDetails: {
            ...prev.salaryDetails,
            ...(employeeData.salaryDetails || {}),
            bankAccount: {
              ...prev.salaryDetails.bankAccount,
              ...(employeeData.salaryDetails?.bankAccount || {}),
            },
          },
          payslipStructure: {
            ...prev.payslipStructure,
            ...(employeeData.payslipStructure || {}),
            earnings: employeeData.payslipStructure?.earnings || prev.payslipStructure.earnings,
            deductions: employeeData.payslipStructure?.deductions || prev.payslipStructure.deductions,
            additionalFields: employeeData.payslipStructure?.additionalFields || prev.payslipStructure.additionalFields,
          },
          attendanceApproval: {
            ...prev.attendanceApproval,
            ...(employeeData.attendanceApproval || {}),
            // Handle populated supervisors by extracting ID
            shift1Supervisor: employeeData.attendanceApproval?.shift1Supervisor?._id || employeeData.attendanceApproval?.shift1Supervisor || "",
            shift2Supervisor: employeeData.attendanceApproval?.shift2Supervisor?._id || employeeData.attendanceApproval?.shift2Supervisor || "",
          }
        };
        return mergedData;
      });

      if (employeeData.documents) {
        setUploadedFiles(employeeData.documents);
      }

      // Trigger cascade loading for edit mode
      // Use defaults if jobDetails is missing to avoid crash
      const jobDetails = employeeData.jobDetails || {};

      // Inject initial options for populated dropdowns so they display immediately
      if (jobDetails.organizationId && typeof jobDetails.organizationId === 'object') {
        setOrganizations(prev => prev.length ? prev : [{ value: String(jobDetails.organizationId._id), label: jobDetails.organizationId.name }]);
      }
      if (jobDetails.businessUnitId && typeof jobDetails.businessUnitId === 'object') {
        setBusinessUnits(prev => prev.length ? prev : [{ value: String(jobDetails.businessUnitId._id), label: jobDetails.businessUnitId.name }]);
      }
      if (jobDetails.departmentId && typeof jobDetails.departmentId === 'object') {
        setDepartments(prev => prev.length ? prev : [{ value: String(jobDetails.departmentId._id), label: jobDetails.departmentId.departmentName }]);
      }
      if (jobDetails.teamId && typeof jobDetails.teamId === 'object') {
        setTeams(prev => prev.length ? prev : [{ value: String(jobDetails.teamId._id), label: jobDetails.teamId.name }]);
      }


      if (jobDetails.organizationId) {
        // Handle if organizationId is an object (populated) or string
        const orgId = typeof jobDetails.organizationId === 'object' ? jobDetails.organizationId._id : jobDetails.organizationId;

        fetchBusinessUnits(orgId);
        fetchSupervisors(orgId);
        fetchOfficeLocations(orgId);
        fetchDesignations(orgId);
        fetchBanks(orgId);

        if (jobDetails.businessUnitId) {
          const buId = typeof jobDetails.businessUnitId === 'object' ? jobDetails.businessUnitId._id : jobDetails.businessUnitId;
          fetchDepartments(buId);
        }

        if (jobDetails.departmentId) {
          const deptId = typeof jobDetails.departmentId === 'object' ? jobDetails.departmentId._id : jobDetails.departmentId;

          fetchTeams(deptId);
          fetchEmployeeTypes(orgId, deptId);

          if (jobDetails.employeeTypeId) {
            const empTypeId = typeof jobDetails.employeeTypeId === 'object' ? jobDetails.employeeTypeId._id : jobDetails.employeeTypeId;

            fetchTeamLeads(orgId, employeeData._id);
          }
        }
      }
    }
  }, [employeeData, isEdit]);

  // Remove the useEffect that syncs basic salary between salaryDetails and payslipStructure
  // since basic salary is no longer in salaryDetails

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    let formattedValue = value;
    if (name === "personalDetails.phone") {
      formattedValue = formatPhoneNumber(value);
    }
    if (name === "salaryDetails.panNumber") {
      formattedValue = formatPanNumber(value);
    }
    if (name === "salaryDetails.aadharNumber") {
      formattedValue = formatAadharNumber(value);
    }
    if (name.includes(".")) {
      const [parent, child, subChild] = name.split(".");
      if (subChild) {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: formattedValue,
            },
          },
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: formattedValue,
          },
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    }
  };

  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [fetchUserId, setFetchUserId] = useState("");

  const handleFetchUser = async () => {
    if (!fetchUserId) {
      toast.error("Please enter a User ID");
      return;
    }

    // Validate MongoDB ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(fetchUserId)) {
      toast.error("Invalid User ID format");
      return;
    }

    try {
      setIsFetchingUser(true);
      const res = await fetch(`/api/users/${fetchUserId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch user");
      }

      const user = data.user;

      // Auto-populate form data
      setFormData(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          firstName: user.name.split(' ')[0] || "",
          lastName: user.name.split(' ').slice(1).join(' ') || "",
          email: user.email || "",
          // Map other fields if available in User model
        },
        role: user.role === 'admin' ? 'admin' : 'employee', // Auto-set role based on User role
      }));

      toast.success("User details fetched successfully!");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsFetchingUser(false);
    }
  };

  const fetchTeamLeads = async (organizationId, currentEmployeeId = null) => {
    try {
      if (!organizationId) {
        setTeamLeads([]);
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.set("organizationId", organizationId);
      params.set("status", "Active"); // Only active employees
      params.set("limit", "1000");

      const response = await fetch(`/api/v1/admin/payroll/employees?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team leads");
      }

      const teamLeadEmp = data.data || [];

      // Filter out current employee if in edit mode
      const filteredEmployees = teamLeadEmp.filter(
        emp => emp._id !== currentEmployeeId
      );

      const teamLeadOptions = filteredEmployees.map((emp) => ({
        value: String(emp.mongoId || emp._id || emp.id),
        label: `${emp.personalDetails?.firstName || emp.firstName || ''} ${emp.personalDetails?.lastName || emp.lastName || ''} - ${emp.jobDetails?.designation || emp.designation || 'No Designation'}`,
        employeeId: emp.employeeId,
      }));

      setTeamLeads(teamLeadOptions);

      // If no team leads found, clear the selection
      if (teamLeadOptions.length === 0) {
        setFormData(prev => ({
          ...prev,
          jobDetails: {
            ...prev.jobDetails,
            teamLead: ""
          }
        }));
      }

    } catch (error) {
      console.error("Error fetching team leads:", error);
      toast.error("Failed to load team leads");
      setTeamLeads([]);
    }
  };

  const handleSelectChange = (field, value) => {
    console.log(`[EmployeeForm] handleSelectChange: field=${field}, value=${value}`);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // BREAK RACE CONDITION: Handle compliance fields explicitly OUTSIDE of the main setFormData loop
    // because handleComplianceChange has its own complex functional state updates.
    if (field === "pfApplicable" || field === "esicApplicable") {
      handleComplianceChange(field, value);
      return;
    }

    setFormData((prev) => {
      // Handle simple non-nested fields (like pfApplicable, gratuityApplicable etc)
      if (!field.startsWith("jobDetails.")) {
        if (field === "probationDuration") {
          const duration = parseInt(value, 10) || 0;
          return {
            ...prev,
            probationDuration: duration,
            probation: duration > 0 ? "yes" : "no"
          };
        }

        if (field.includes(".")) {
          const [parent, child, subChild] = field.split(".");
          if (subChild) {
            return {
              ...prev,
              [parent]: {
                ...prev[parent],
                [child]: {
                  ...prev[parent][child],
                  [subChild]: value,
                },
              },
            };
          } else {
            return {
              ...prev,
              [parent]: {
                ...prev[parent],
                [child]: value,
              },
            };
          }
        }

        return {
          ...prev,
          [field]: value
        };
      }

      // Handle jobDetails fields
      const newJobDetails = { ...prev.jobDetails };
      const subField = field.split(".")[1];

      // Regular field update
      newJobDetails[subField] = value;

      // Cascading logic
      if (subField === "organizationId") {
        const selectedOrg = organizations.find((org) => org.value === value);
        newJobDetails.organization = selectedOrg ? selectedOrg.label : "";
        
        // Only reset children if the organization ACTUALLY changed
        if (prev.jobDetails?.organizationId !== value) {
          newJobDetails.organizationId = value;
          // Reset children
          newJobDetails.businessUnitId = "";
          newJobDetails.businessUnit = "";
          newJobDetails.departmentId = "";
          newJobDetails.department = "";
          newJobDetails.teamId = "";
          newJobDetails.team = "";
          newJobDetails.employeeTypeId = "";
          newJobDetails.employeeType = "";
          newJobDetails.teamLead = "";
        }
      }

      if (subField === "businessUnitId") {
        const selectedBU = businessUnits.find((bu) => bu.value === value);
        newJobDetails.businessUnit = selectedBU ? selectedBU.label : "";
        
        if (prev.jobDetails?.businessUnitId !== value) {
          newJobDetails.businessUnitId = value;
          // Reset children
          newJobDetails.departmentId = "";
          newJobDetails.department = "";
          newJobDetails.teamId = "";
          newJobDetails.team = "";
        }
      }

      if (subField === "departmentId") {
        const selectedDept = departments.find((dept) => dept.value === value);
        newJobDetails.department = selectedDept ? selectedDept.name : "";
        
        if (prev.jobDetails?.departmentId !== value) {
          newJobDetails.departmentId = value;
          // Reset children
          newJobDetails.teamId = "";
          newJobDetails.team = "";
          newJobDetails.employeeTypeId = "";
          newJobDetails.employeeType = "";
        }
      }

      if (subField === "teamId") {
        const selectedTeam = teams.find((team) => team.value === value);
        newJobDetails.team = selectedTeam ? selectedTeam.label : "";
        newJobDetails.teamId = value;
      }

      if (subField === "costCenterId") {
        const selectedCC = costCenters.find((cc) => cc.value === value);
        newJobDetails.costCenter = selectedCC ? selectedCC.label : "";
        newJobDetails.costCenterId = value;
      }

      if (subField === "employeeTypeId") {
        const selectedType = employeeTypes.find((type) => type.value === value);
        newJobDetails.employeeType = selectedType ? selectedType.typeName : "";
        newJobDetails.employeeTypeId = value;
      }


      if (subField === "teamLead") {
        newJobDetails.teamLead = value;
      }

      if (subField === "assignedOfficeId") {
        newJobDetails.assignedOfficeId = value;
      }

      if (subField === "workState") {
        newJobDetails.workState = value;
      }

      console.log(`[EmployeeForm] Applying jobDetails update:`, newJobDetails);
      return {
        ...prev,
        jobDetails: newJobDetails
      };
    });
  };

  const handleRadioChange = (field, value) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handle payslip structure changes
  const handlePayslipStructureChange = (updatedStructure) => {
    setFormData((prev) => ({
      ...prev,
      payslipStructure: updatedStructure,
    }));
  };

  // Handle Compliance & Configuration Changes
  const handleComplianceChange = (field, value) => {
    // 1. ESIC Applicability Check
    if (field === "esicApplicable") {
      if (value === "yes") {
        const basicSalary = parseFloat(formData.payslipStructure.basicSalary) || 0;
        if (basicSalary > 21000) {
          toast.error("ESIC is not applicable for Basic Salary > ₹21,000");
          return;
        }
      }

      // Update form data and dynamic deductions
      setFormData((prev) => {
        let updatedDeductions = [...prev.payslipStructure.deductions];

        if (value === "yes") {
          // ESIC is YES: 
          // 1. Remove "Provident Fund (Employer)" if exists
          updatedDeductions = updatedDeductions.filter(d => d.name !== "Provident Fund (Employer)");

          // 2. Add "Employee State Insurance (ESIC)" (0.75%) if not exists
          const hasESIC = updatedDeductions.some(d => d.name === "Employee State Insurance (ESIC)");
          if (!hasESIC) {
            updatedDeductions.push({
              name: "Employee State Insurance (ESIC)",
              enabled: true,
              editable: false,
              calculationType: "percentage",
              percentage: 0.75,
              fixedAmount: 0,
            });
          }

          // 3. Add "Employee State Insurance (ESIC) - Employer" (3.25%) if not exists
          const hasEmployerESIC = updatedDeductions.some(d => d.name === "Employee State Insurance (ESIC) - Employer");
          if (!hasEmployerESIC) {
            updatedDeductions.push({
              name: "Employee State Insurance (ESIC) - Employer",
              enabled: true,
              editable: false,
              calculationType: "percentage",
              percentage: 3.25,
              fixedAmount: 0,
            });
          }
        } else {
          // ESIC is NO:
          // 1. Remove both ESIC components
          updatedDeductions = updatedDeductions.filter(
            d => d.name !== "Employee State Insurance (ESIC)" &&
              d.name !== "Employee State Insurance (ESIC) - Employer"
          );

          // 2. Add "Provident Fund (Employer)" back if PF is applicable
          if (prev.pfApplicable === "yes") {
            const hasEmployerPF = updatedDeductions.some(d => d.name === "Provident Fund (Employer)");
            if (!hasEmployerPF) {
              updatedDeductions.push({
                name: "Provident Fund (Employer)",
                enabled: true,
                editable: true,
                calculationType: "percentage",
                percentage: 13,
                fixedAmount: 0
              });
            }
          }
        }

        return {
          ...prev,
          esicApplicable: value,
          payslipStructure: {
            ...prev.payslipStructure,
            deductions: updatedDeductions
          }
        };
      });
      return;
    }

    // 2. PF Applicability Check
    if (field === "pfApplicable") {
      setFormData((prev) => {
        let updatedDeductions = [...prev.payslipStructure.deductions];

        if (value === "yes") {
          // Add PF Employee (12%)
          const hasEmployeePF = updatedDeductions.some(d => d.name === "Provident Fund (Employee)");
          if (!hasEmployeePF) {
            updatedDeductions.push({
              name: "Provident Fund (Employee)",
              enabled: true,
              editable: true,
              calculationType: "percentage",
              percentage: 12,
              fixedAmount: 0
            });
          }

          // Check if ESIC is NO, then add Employer PF (13%)
          if (prev.esicApplicable !== "yes") {
            const hasEmployerPF = updatedDeductions.some(d => d.name === "Provident Fund (Employer)");
            // Also check for legacy "Provident Fund" and remove it if we are adding the system one
            const hasLegacyPF = updatedDeductions.some(d => d.name === "Provident Fund");

            if (hasLegacyPF) {
              updatedDeductions = updatedDeductions.filter(d => d.name !== "Provident Fund");
            }

            if (!hasEmployerPF) {
              updatedDeductions.push({
                name: "Provident Fund (Employer)",
                enabled: true,
                editable: true,
                calculationType: "percentage",
                percentage: 13,
                fixedAmount: 0
              });
            }
          }
        } else {
          // Remove PF components (including legacy "Provident Fund" if any)
          updatedDeductions = updatedDeductions.filter(
            d => d.name !== "Provident Fund (Employee)" &&
              d.name !== "Provident Fund (Employer)" &&
              d.name !== "Provident Fund"
          );
        }

        return {
          ...prev,
          pfApplicable: value,
          payslipStructure: {
            ...prev.payslipStructure,
            deductions: updatedDeductions
          }
        };
      });
      return;
    }

    // Default handler for other fields
    handleRadioChange(field, value);
  };

  const validateForm = () => {
    const newErrors = {};

    // Account credentials (employeeId, password, confirmPassword) are now optional
    if (!isEdit && formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // For attendance-only role, only validate basic fields
    if (formData.role === "attendance_only") {
      setErrors(newErrors);
      return newErrors;
    }

    // Regular employee validation continues below
    // Emergency Contact Validation
    const ec = formData.personalDetails.emergencyContact;
    if (ec?.name && !ec.relationship) {
      newErrors["personalDetails.emergencyContact.relationship"] = "Relationship is required";
    }
    if (ec?.name && !ec.phone) {
      newErrors["personalDetails.emergencyContact.phone"] = "Phone number is required";
    } else if (
      ec?.phone &&
      !validators.phone(ec.phone)
    ) {
      newErrors["personalDetails.emergencyContact.phone"] = "Invalid phone number";
    }

    if (!formData.personalDetails.firstName) {
      newErrors["personalDetails.firstName"] = "First name is required";
    } else if (!validators.name(formData.personalDetails.firstName)) {
      newErrors["personalDetails.firstName"] =
        "First name should contain only alphabets and spaces (1-40 characters)";
    }
    if (!formData.personalDetails.lastName) {
      newErrors["personalDetails.lastName"] = "Last name is required";
    } else if (!validators.name(formData.personalDetails.lastName)) {
      newErrors["personalDetails.lastName"] =
        "Last name should contain only alphabets and spaces (1-40 characters)";
    }
    if (!formData.personalDetails.email) {
      newErrors["personalDetails.email"] = "Email is required";
    } else if (!validators.email(formData.personalDetails.email)) {
      newErrors["personalDetails.email"] = "Please enter a valid email address";
    }
    if (!formData.personalDetails.phone) {
      newErrors["personalDetails.phone"] = "Phone number is required";
    } else if (!validators.phone(formData.personalDetails.phone)) {
      newErrors["personalDetails.phone"] =
        "Please enter a valid 10-digit Indian phone number starting with 6-9";
    }
    if (!formData.personalDetails.dateOfJoining) {
      newErrors["personalDetails.dateOfJoining"] =
        "Date of joining is required";
    }
    if (!formData.jobDetails.organizationId) {
      newErrors["jobDetails.organizationId"] = "Organization is required";
    }
    if (!formData.jobDetails.departmentId) {
      newErrors["jobDetails.departmentId"] = "Department is required";
    }
    if (!formData.jobDetails.employeeTypeId) {
      newErrors["jobDetails.employeeTypeId"] = "Employee type is required";
    }
    // Removed validation for basic salary in salaryDetails since it's no longer there
    // NEW: Validate payslip structure
    if (
      !formData.payslipStructure.basicSalary ||
      formData.payslipStructure.basicSalary <= 0
    ) {
      newErrors["payslipStructure.basicSalary"] =
        "Basic salary in payslip structure must be greater than 0";
    }
    if (!formData.payslipStructure.salaryType) {
      newErrors["payslipStructure.salaryType"] = "Salary type is required";
    }
    // Note: No validation for earnings if salaryType is "perday"
    if (!formData.salaryDetails.bankAccount.accountNumber) {
      newErrors["salaryDetails.bankAccount.accountNumber"] =
        "Account number is required";
    } else if (
      !validators.accountNumber(
        formData.salaryDetails.bankAccount.accountNumber
      )
    ) {
      newErrors["salaryDetails.bankAccount.accountNumber"] =
        "Account number must be 9-30 alphanumeric characters";
    }
    if (!formData.salaryDetails.bankAccount.bankName) {
      newErrors["salaryDetails.bankAccount.bankName"] = "Bank name is required";
    }
    if (!formData.salaryDetails.bankAccount.ifscCode) {
      newErrors["salaryDetails.bankAccount.ifscCode"] = "IFSC code is required";
    } else if (!validators.ifsc(formData.salaryDetails.bankAccount.ifscCode)) {
      newErrors["salaryDetails.bankAccount.ifscCode"] =
        "Please enter a valid IFSC code (e.g., HDFC0001234)";
    }
    const cleanedAadhar =
      formData.salaryDetails.aadharNumber?.replace(/\s/g, "") || "";
    if (!formData.salaryDetails.aadharNumber) {
      newErrors["salaryDetails.aadharNumber"] = "Aadhar Number is required";
    } else if (!validators.aadhar(cleanedAadhar)) {
      newErrors["salaryDetails.aadharNumber"] =
        "Please enter a valid 12-digit Aadhar number";
    }
    if (
      formData.personalDetails.address.zipCode &&
      !validators.zip(formData.personalDetails.address.zipCode)
    ) {
      newErrors["personalDetails.address.zipCode"] =
        "Please enter a valid 6-digit ZIP code";
    }
    if (formData.workingHr && isNaN(parseFloat(formData.workingHr))) {
      newErrors["workingHr"] = "Working hours must be a valid number";
    }
    if (formData.attendanceApproval.required === "yes") {
      if (!formData.attendanceApproval.shift1Supervisor) {
        newErrors["attendanceApproval.shift1Supervisor"] =
          "Shift 1 supervisor is required";
      }
      if (!formData.attendanceApproval.shift2Supervisor) {
        newErrors["attendanceApproval.shift2Supervisor"] =
          "Shift 2 supervisor is required";
      }
    }

    // Team lead validation (only if category exists and is not "Team Lead")
    if (formData.jobDetails.categoryId &&
      formData.jobDetails.category?.toLowerCase() !== "team lead" &&
      !formData.jobDetails.teamLead) {
      // Optional: Only validate if you want team lead to be required
      // newErrors["jobDetails.teamLeadId"] = "Team lead is required for this category";
    }


    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e) => {
    console.log(formData);

    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      const firstErrorField = Object.keys(formErrors)[0];
      toast.error(`Validation Error: ${formErrors[firstErrorField]}`);
      // Map errors to steps to auto-switch to the correct step
      const stepErrorMapping = {
        0: [
          "jobDetails.",
          "employeeId",
          "role"
        ],
        1: [
          "personalDetails."
        ],
        2: [
          "salaryDetails.",
          "isCompliant",
          "isTDSApplicable",
          "pfApplicable",
          "esicApplicable"
        ],
        3: [
          "payslipStructure.",
          "workingHr",
          "probation",
          "isAttending",
          "otApplicable"
        ],
        4: [
          "variablePayStructure."
        ],
        5: [
          "attendanceApproval.",
          "documents"
        ]
      };

      // Find the first error field
      const errorFields = Object.keys(formErrors);
      if (errorFields.length > 0) {
        const firstErrorField = errorFields[0];

        // Find which step this error belongs to
        let errorStep = 0;
        for (const [step, prefixes] of Object.entries(stepErrorMapping)) {
          if (prefixes.some(prefix => firstErrorField.startsWith(prefix) || firstErrorField === prefix)) {
            errorStep = parseInt(step);
            break;
          }
        }

        // Switch to that step
        setCurrentStep(errorStep);

        // Use timeout to allow render, then scroll
        setTimeout(() => {
          const firstErrorElement = document.querySelector(".border-red-300");
          if (firstErrorElement) {
            firstErrorElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
      return;
    }
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/v1/admin/employees/${employeeData._id}`
        : "/api/v1/admin/employees";
      const method = isEdit ? "PUT" : "POST";
      const submitData = {
        ...formData,
        personalDetails: {
          ...formData.personalDetails,
          phone: formData.personalDetails.phone.replace(/\s/g, ""),
        },
        salaryDetails: {
          ...formData.salaryDetails,
          panNumber: formData.salaryDetails.panNumber
            .replace(/\s/g, "")
            .toUpperCase(),
          aadharNumber: formData.salaryDetails.aadharNumber.replace(/\s/g, ""),
          bankAccount: {
            ...formData.salaryDetails.bankAccount,
            ifscCode: formData.salaryDetails.bankAccount.ifscCode.toUpperCase(),
          },
        },
        documents: uploadedFiles.map((file) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          category: file.category,
          categoryName: file.categoryName,
          uploadDate: file.uploadDate,
          url: file.url,
          cloudinaryId: file.cloudinaryId,
          cloudinaryUrl: file.cloudinaryUrl,
          thumbnail: file.thumbnail,
        })),
        payslipStructure: formData.payslipStructure,
      };

      console.log("📤 Submitting employee data:", submitData);
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const savedEmployee = await response.json();
        toast.success(
          `Employee ${isEdit ? "updated" : "created"} successfully! 🎉`
        );
        console.log("✅ Employee saved:", savedEmployee);
        setTimeout(() => {
          router.push("/admin/employees");
        }, 1000);
      } else {
        const textStr = await response.text();
        console.error("❌ API Error Status:", response.status, response.statusText);
        console.error("❌ API Error Raw Text:", textStr);
        let data = {};
        try {
          data = JSON.parse(textStr);
        } catch (e) {
          console.error("Failed to parse API response as JSON:", e);
        }

        // Print the error nicely
        let msg = data.error || data.message || textStr.substring(0, 100) || "Failed to save employee";
        if (data.details && Array.isArray(data.details)) {
          msg += ": " + data.details.join(", ");
        }
        toast.error(`Error: ${msg}`);
        console.error("❌ Error response parsed:", data);
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error("An error occurred while saving the employee: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getFormProgress = () => {
    const requiredFields = [
      // formData.employeeId,
      formData.personalDetails.firstName,
      formData.personalDetails.lastName,
      formData.personalDetails.email,
      formData.personalDetails.phone,
      formData.personalDetails.dateOfJoining,
      formData.jobDetails.organizationId,
      formData.jobDetails.departmentId,
      // formData.jobDetails.employeeTypeId,
      // formData.jobDetails.categoryId,
      formData.salaryDetails.bankAccount.accountNumber,
      formData.probation,
      formData.isAttending,
      formData.workingHr,
      formData.payslipStructure.basicSalary > 0,
      formData.payslipStructure.earnings.length > 0,
    ];
    const completedFields = requiredFields.filter(
      (field) => field && field.toString().trim() !== ""
    ).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#fff",
            color: "#363636",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isEdit ? "Edit Employee Profile" : "Add New Employee"}
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  {isEdit
                    ? "Update employee information and salary structure"
                    : "Create a new employee profile with customized salary structure"}
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Wizard Stepper */}
        <div className="mb-10 mt-4">
          <div className="flex items-center justify-between relative max-w-4xl mx-auto">
            <div className="absolute left-0 top-5 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
            <div
              className="absolute left-0 top-5 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 transition-all duration-500"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center gap-3 bg-slate-50 px-2 cursor-pointer" onClick={() => {
                  if (index < currentStep) {
                    setDirection(-1);
                    setCurrentStep(index);
                  }
                }}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                      ? "bg-indigo-600 border-indigo-600 text-white scale-110"
                      : isCompleted
                        ? "bg-indigo-100 border-indigo-600 text-indigo-600"
                        : "bg-white border-slate-300 text-slate-400"
                      }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="text-center w-28 md:w-auto">
                    <span className={`block text-xs font-bold ${isActive ? "text-indigo-700" : isCompleted ? "text-indigo-600" : "text-slate-500"}`}>
                      {step.title}
                    </span>
                    <span className="hidden md:block text-[10px] text-slate-400 font-medium">
                      {step.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-[500px] flex flex-col"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            {currentStep === 0 && (
              <motion.div
                key="step0"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                {/* Account Credentials Card */}
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Shield className="w-4 h-4 text-indigo-600" />
                      </div>
                      Account Credentials
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Set up login credentials and access role for the employee
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Employee ID <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="employeeId"
                            value={formData.employeeId || ""}
                            onChange={handleChange}
                            placeholder="EMP-001"
                            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                      {/* Account Credentials Section */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          {isEdit ? "New Password (Optional)" : "Password"}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password || ""}
                          onChange={handleChange}
                          placeholder="********"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        {errors.password && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.password}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Confirm {isEdit ? "New " : ""}Password
                        </label>
                        <input
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword || ""}
                          onChange={handleChange}
                          placeholder="********"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        {errors.confirmPassword && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.confirmPassword}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <SimpleSelect
                          value={formData.role}
                          onChange={(e) => handleSelectChange("role", e.target.value)}
                          options={[
                            { value: "employee", label: "Employee" },
                            { value: "attendance_only", label: "Attendance Only" },
                            { value: "admin", label: "Admin" },
                            { value: "recruiter", label: "HR Recruiter" },
                          ]}
                          placeholder="Select Base Role"
                        />
                      </div>
                      
                      {/* CUSTOM ROLE DROP DOWN */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                           Custom Permission Role <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <SimpleSelect
                          value={formData.roleId}
                          onChange={(e) => handleSelectChange("roleId", e.target.value)}
                          options={[ { value: "", label: "-- No Custom Role --" }, ...roles]}
                          placeholder="Select Custom Role"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance-Only Info Message */}
                {formData.role === "attendance_only" && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900">Attendance-Only User</h3>
                        <p className="text-indigo-700 text-sm mt-1">
                          This user will only have access to Attendance Management features.
                          No personal details, salary structure, or other employee information is required.
                        </p>
                        <p className="text-indigo-600 text-xs mt-2">
                          After creation, this user can login with Employee ID and Password to access the Attendance Directory.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show remaining form sections only for non-attendance-only roles */}
                {formData.role !== "attendance_only" && (
                  <>
                    {/* Organization Details Card */}
                    <div className="bg-white rounded-xl border border-slate-200 mb-8">
                      <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                            <Building className="w-4 h-4 text-indigo-600" />
                          </div>
                          Organization Details
                        </h2>
                        <p className="text-slate-600 text-sm mt-1">
                          Define employee's place in the organizational hierarchy
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* 1. Organization Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Organization <span className="text-red-500">*</span>
                            </label>
                            {fetchLoading ? (
                              <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                                Loading...
                              </div>
                            ) : (
                              <SimpleSelect
                                value={formData.jobDetails.organizationId}
                                onChange={(e) =>
                                  handleSelectChange(
                                    "jobDetails.organizationId",
                                    e.target.value
                                  )
                                }
                                options={organizations}
                                placeholder="Select organization"
                                error={errors["jobDetails.organizationId"]}
                              />
                            )}
                          </div>

                          {/* 2. Business Unit Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Business Unit <span className="text-red-500">*</span>
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.businessUnitId}
                              onChange={(e) =>
                                handleSelectChange(
                                  "jobDetails.businessUnitId",
                                  e.target.value
                                )
                              }
                              options={businessUnits}
                              placeholder={
                                formData.jobDetails.organizationId
                                  ? "Select business unit"
                                  : "Select organization first"
                              }
                              error={errors["jobDetails.businessUnitId"]}
                              disabled={!formData.jobDetails.organizationId}
                            />
                          </div>

                          {/* 3. Department Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Department <span className="text-red-500">*</span>
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.departmentId}
                              onChange={(e) =>
                                handleSelectChange(
                                  "jobDetails.departmentId",
                                  e.target.value
                                )
                              }
                              options={departments}
                              placeholder={
                                formData.jobDetails.businessUnitId
                                  ? "Select department"
                                  : "Select business unit first"
                              }
                              error={errors["jobDetails.departmentId"]}
                              disabled={!formData.jobDetails.businessUnitId}
                            />
                          </div>

                          {/* 4. Team Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Team
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.teamId}
                              onChange={(e) =>
                                handleSelectChange(
                                  "jobDetails.teamId",
                                  e.target.value
                                )
                              }
                              options={teams}
                              placeholder={
                                formData.jobDetails.departmentId
                                  ? "Select team"
                                  : "Select department first"
                              }
                              error={errors["jobDetails.teamId"]}
                              disabled={!formData.jobDetails.departmentId}
                            />
                          </div>

                          {/* 5. Employee Type Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Employee Type
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.employeeTypeId}
                              onChange={(e) =>
                                handleSelectChange("jobDetails.employeeTypeId", e.target.value)
                              }
                              options={employeeTypes}
                              placeholder={
                                formData.jobDetails.departmentId
                                  ? "Select employee type"
                                  : "Select department first"
                              }
                              error={errors["jobDetails.employeeTypeId"]}
                              disabled={!formData.jobDetails.departmentId}
                            />
                          </div>


                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              PF Applicable
                            </label>
                            <SimpleSelect
                              value={formData.pfApplicable}
                              onChange={(e) =>
                                handleSelectChange("pfApplicable", e.target.value)
                              }
                              options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                              ]}
                              placeholder="Select Option"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Gratuity Applicable
                            </label>
                            <SimpleSelect
                              value={formData.gratuityApplicable || "no"}
                              onChange={(e) =>
                                handleSelectChange("gratuityApplicable", e.target.value)
                              }
                              options={[
                                { value: "yes", label: "Yes" },
                                { value: "no", label: "No" },
                              ]}
                              placeholder="Select Option"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Probation Period
                            </label>
                            <SimpleSelect
                              value={formData.probationDuration || 0}
                              onChange={(e) =>
                                handleSelectChange("probationDuration", e.target.value)
                              }
                              options={[
                                { value: 0, label: "No Probation" },
                                { value: 1, label: "1 Month" },
                                { value: 3, label: "3 Months" },
                                { value: 6, label: "6 Months" },
                              ]}
                              placeholder="Select Period"
                            />
                          </div>

                          {/* 7. Reporting Person Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Reporting Person
                            </label>
                            <SearchableSelect
                              value={formData.jobDetails.reportingManager || ""}
                              onChange={(val) =>
                                handleSelectChange("jobDetails.reportingManager", val)
                              }
                              options={teamLeads}
                              placeholder={
                                formData.jobDetails.departmentId
                                  ? "Select reporting person"
                                  : "Select department first"
                              }
                              disabled={!formData.jobDetails.departmentId}
                            />
                          </div>

                          {/* 8. Team Lead Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Team Lead
                            </label>
                            <SearchableSelect
                              value={formData.jobDetails.teamLead || ""}
                              onChange={(val) =>
                                handleSelectChange("jobDetails.teamLead", val)
                              }
                              options={teamLeads}
                              placeholder={
                                formData.jobDetails.departmentId
                                  ? "Select team lead"
                                  : "Select department first"
                              }
                              disabled={!formData.jobDetails.departmentId}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Designation <span className="text-red-500">*</span>
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.designation || ""}
                              onChange={(e) =>
                                handleSelectChange("jobDetails.designation", e.target.value)
                              }
                              options={
                                formData.jobDetails.designation && !designations.some(opt => opt.value === formData.jobDetails.designation)
                                  ? [{ value: formData.jobDetails.designation, label: formData.jobDetails.designation }, ...designations]
                                  : designations
                              }
                              placeholder="Select Designation"
                              error={errors["jobDetails.designation"]}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Work Location
                            </label>
                            <input
                              name="jobDetails.workLocation"
                              value={formData.jobDetails.workLocation || ""}
                              onChange={handleChange}
                              placeholder="Bangalore"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Work State (Statutory)
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.workState || "Maharashtra"}
                              onChange={(e) => handleSelectChange("jobDetails.workState", e.target.value)}
                              options={[
                                { value: "Maharashtra", label: "Maharashtra" },
                                { value: "Karnataka", label: "Karnataka" },
                                { value: "Tamil Nadu", label: "Tamil Nadu" },
                                { value: "West Bengal", label: "West Bengal" },
                                { value: "Telangana", label: "Telangana" },
                              ]}
                              placeholder="Select Work State"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Assigned Office (Geo-fencing)
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.assignedOfficeId}
                              onChange={(e) =>
                                handleSelectChange(
                                  "jobDetails.assignedOfficeId",
                                  e.target.value
                                )
                              }
                              options={officeLocations}
                              placeholder="Select Office Location"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Biometric Device ID
                            </label>
                            <input
                              name="jobDetails.biometricDeviceId"
                              value={formData.jobDetails.biometricDeviceId || ""}
                              onChange={handleChange}
                              placeholder="Device Serial Number"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>

                          {/* 10. Cost Center Dropdown */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              Cost Center
                            </label>
                            <SimpleSelect
                              value={formData.jobDetails.costCenterId}
                              onChange={(e) =>
                                handleSelectChange(
                                  "jobDetails.costCenterId",
                                  e.target.value
                                )
                              }
                              options={costCenters}
                              placeholder="Select cost center"
                              error={errors["jobDetails.costCenterId"]}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Details Card */}
                  </>
                )}

              </motion.div>
            )}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <User className="w-4 h-4 text-indigo-600" />
                      </div>
                      Personal Information
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Basic employee details and contact information
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="personalDetails.firstName"
                          value={formData.personalDetails.firstName}
                          onChange={handleChange}
                          maxLength={40}
                          placeholder="Sameer"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["personalDetails.firstName"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["personalDetails.firstName"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["personalDetails.firstName"]}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="personalDetails.lastName"
                          value={formData.personalDetails.lastName}
                          onChange={handleChange}
                          maxLength={40}
                          placeholder="Gaikwad"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["personalDetails.lastName"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["personalDetails.lastName"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["personalDetails.lastName"]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="personalDetails.email"
                            type="email"
                            value={formData.personalDetails.email}
                            onChange={handleChange}
                            maxLength={40}
                            placeholder="sameer.gaikwad@company.com"
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["personalDetails.email"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                        </div>
                        {errors["personalDetails.email"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["personalDetails.email"]}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="personalDetails.phone"
                            type="tel"
                            value={formData.personalDetails.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["personalDetails.phone"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                        </div>
                        {errors["personalDetails.phone"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["personalDetails.phone"]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="personalDetails.dateOfBirth"
                            type="date"
                            value={formData.personalDetails.dateOfBirth || ""}
                            onChange={handleChange}
                            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Gender
                        </label>
                        <SimpleSelect
                          value={formData.personalDetails.gender}
                          onChange={(e) =>
                            handleSelectChange(
                              "personalDetails.gender",
                              e.target.value
                            )
                          }
                          options={genderOptions}
                          placeholder="Select gender"
                        />
                      </div>
                    </div>
                    {/* Blood Group */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700">
                        Blood Group
                      </label>
                      <SimpleSelect
                        value={formData.personalDetails.bloodGroup}
                        onChange={(e) =>
                          handleSelectChange(
                            "personalDetails.bloodGroup",
                            e.target.value
                          )
                        }
                        options={[
                          { value: "A+", label: "A+" },
                          { value: "A-", label: "A-" },
                          { value: "B+", label: "B+" },
                          { value: "B-", label: "B-" },
                          { value: "AB+", label: "AB+" },
                          { value: "AB-", label: "AB-" },
                          { value: "O+", label: "O+" },
                          { value: "O-", label: "O-" },
                        ]}
                        placeholder="Select Blood Group"
                      />
                    </div>

                    {/* Address Fields */}
                    <div className="space-y-6 pt-4 border-t border-slate-100 mt-4">
                      {/* Current Address */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          Current Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Street Address</label>
                            <input
                              name="personalDetails.currentAddress.street"
                              value={formData.personalDetails.currentAddress?.street || ""}
                              onChange={handleChange}
                              placeholder="Plot No. 42, Sector 17, Vashi"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">City</label>
                            <input
                              name="personalDetails.currentAddress.city"
                              value={formData.personalDetails.currentAddress?.city || ""}
                              onChange={handleChange}
                              placeholder="Navi Mumbai"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">State</label>
                              <input
                                name="personalDetails.currentAddress.state"
                                value={formData.personalDetails.currentAddress?.state || ""}
                                onChange={handleChange}
                                placeholder="Maharashtra"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
                              <input
                                name="personalDetails.currentAddress.zipCode"
                                value={formData.personalDetails.currentAddress?.zipCode || ""}
                                onChange={handleChange}
                                placeholder="400703"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Permanent Address */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Home className="w-4 h-4 text-slate-500" />
                            Permanent Address
                          </h3>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    personalDetails: {
                                      ...prev.personalDetails,
                                      permanentAddress: { ...prev.personalDetails.currentAddress }
                                    }
                                  }));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-xs text-slate-600">Same as Current</span>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700">Street Address</label>
                            <input
                              name="personalDetails.permanentAddress.street"
                              value={formData.personalDetails.permanentAddress?.street || ""}
                              onChange={handleChange}
                              placeholder="Plot No. 42, Sector 17, Vashi"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">City</label>
                            <input
                              name="personalDetails.permanentAddress.city"
                              value={formData.personalDetails.permanentAddress?.city || ""}
                              onChange={handleChange}
                              placeholder="Navi Mumbai"
                              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">State</label>
                              <input
                                name="personalDetails.permanentAddress.state"
                                value={formData.personalDetails.permanentAddress?.state || ""}
                                onChange={handleChange}
                                placeholder="Maharashtra"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
                              <input
                                name="personalDetails.permanentAddress.zipCode"
                                value={formData.personalDetails.permanentAddress?.zipCode || ""}
                                onChange={handleChange}
                                placeholder="400703"
                                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Date of Joining <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="personalDetails.dateOfJoining"
                            type="date"
                            value={formData.personalDetails?.dateOfJoining || ""}
                            onChange={handleChange}
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["personalDetails.dateOfJoining"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                        </div>
                        {errors["personalDetails.dateOfJoining"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["personalDetails.dateOfJoining"]}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Employee Status <span className="text-red-500">*</span>
                        </label>
                        <SimpleSelect
                          value={formData.status}
                          onChange={(e) =>
                            handleSelectChange("status", e.target.value)
                          }
                          options={statusOptions}
                        />
                      </div>
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        Emergency Contact Person
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">Contact Name</label>
                          <input
                            name="personalDetails.emergencyContact.name"
                            value={formData.personalDetails.emergencyContact?.name || ""}
                            onChange={handleChange}
                            placeholder="Amit Gaikwad"
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">Relationship</label>
                          <input
                            name="personalDetails.emergencyContact.relationship"
                            value={formData.personalDetails.emergencyContact?.relationship || ""}
                            onChange={handleChange}
                            placeholder="Brother"
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors["personalDetails.emergencyContact.relationship"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                          {errors["personalDetails.emergencyContact.relationship"] && (
                            <div className="flex items-center space-x-1 text-red-600 text-xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>{errors["personalDetails.emergencyContact.relationship"]}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-slate-700">Phone</label>
                          <input
                            name="personalDetails.emergencyContact.phone"
                            value={formData.personalDetails.emergencyContact?.phone || ""}
                            onChange={handleChange}
                            placeholder="9876543210"
                            maxLength={10}
                            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${errors["personalDetails.emergencyContact.phone"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                          {errors["personalDetails.emergencyContact.phone"] && (
                            <div className="flex items-center space-x-1 text-red-600 text-xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>{errors["personalDetails.emergencyContact.phone"]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-slate-700">Address</label>
                        <input
                          name="personalDetails.emergencyContact.address"
                          value={formData.personalDetails.emergencyContact?.address || ""}
                          onChange={handleChange}
                          placeholder="Plot No. 42, Sector 17, Vashi, Navi Mumbai"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Information Card - Updated to remove basic salary */}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      Financial Information
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Bank account information and compliance data (Basic salary is
                      now configured in Salary Structure section)
                    </p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          PAN Number
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            name="salaryDetails.panNumber"
                            value={formData.salaryDetails.panNumber}
                            onChange={handleChange}
                            placeholder="ABCDE1234F"
                            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["salaryDetails.panNumber"]
                              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                              : "border-slate-300"
                              }`}
                          />
                        </div>
                        {errors["salaryDetails.panNumber"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["salaryDetails.panNumber"]}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Aadhar Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="salaryDetails.aadharNumber"
                          value={formData.salaryDetails.aadharNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["salaryDetails.aadharNumber"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["salaryDetails.aadharNumber"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["salaryDetails.aadharNumber"]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Bank Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="salaryDetails.bankAccount.accountNumber"
                          value={formData.salaryDetails.bankAccount.accountNumber}
                          onChange={handleChange}
                          maxLength={20}
                          placeholder="123456789012"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["salaryDetails.bankAccount.accountNumber"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["salaryDetails.bankAccount.accountNumber"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              {errors["salaryDetails.bankAccount.accountNumber"]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <SimpleSelect
                          value={formData.salaryDetails.bankAccount.bankName || ""}
                          onChange={(e) =>
                            handleSelectChange("salaryDetails.bankAccount.bankName", e.target.value)
                          }
                          options={
                            formData.salaryDetails.bankAccount.bankName && !banks.some(opt => opt.value === formData.salaryDetails.bankAccount.bankName)
                              ? [{ value: formData.salaryDetails.bankAccount.bankName, label: formData.salaryDetails.bankAccount.bankName }, ...banks]
                              : banks
                          }
                          placeholder="Select Bank"
                          error={errors["salaryDetails.bankAccount.bankName"]}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="salaryDetails.bankAccount.ifscCode"
                          value={formData.salaryDetails.bankAccount.ifscCode}
                          onChange={handleChange}
                          placeholder="HDFC0001234"
                          maxLength={11}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["salaryDetails.bankAccount.ifscCode"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["salaryDetails.bankAccount.ifscCode"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              {errors["salaryDetails.bankAccount.ifscCode"]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Branch Name
                        </label>
                        <input
                          name="salaryDetails.bankAccount.branch"
                          value={formData.salaryDetails.bankAccount.branch}
                          onChange={handleChange}
                          maxLength={30}
                          placeholder="Vashi Branch"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>


                {/* Compliance & Configuration Card */}
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Shield className="w-4 h-4 text-indigo-600" />
                      </div>
                      Compliance & Configuration
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Configure statutory compliance settings affecting salary structure
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* PF Toggle */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is PF Applicable
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pfApplicable"
                              value="yes"
                              checked={formData.pfApplicable === "yes"}
                              onChange={(e) =>
                                handleComplianceChange("pfApplicable", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="pfApplicable"
                              value="no"
                              checked={formData.pfApplicable === "no"}
                              onChange={(e) =>
                                handleComplianceChange("pfApplicable", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>

                      {/* ESIC Toggle */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is ESIC Applicable
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="esicApplicable"
                              value="yes"
                              checked={formData.esicApplicable === "yes"}
                              onChange={(e) =>
                                handleComplianceChange("esicApplicable", e.target.value)
                              }
                              disabled={
                                (parseFloat(formData.payslipStructure?.basicSalary) || 0) > 21000
                              }
                              className={`w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 ${(parseFloat(formData.payslipStructure?.basicSalary) || 0) > 21000
                                ? "cursor-not-allowed opacity-50"
                                : ""
                                }`}
                            />
                            <span className={`text-sm text-slate-700 ${(parseFloat(formData.payslipStructure?.basicSalary) || 0) > 21000
                              ? "opacity-50"
                              : ""
                              }`}>Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="esicApplicable"
                              value="no"
                              checked={formData.esicApplicable === "no"}
                              onChange={(e) =>
                                handleComplianceChange("esicApplicable", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                        {(parseFloat(formData.payslipStructure?.basicSalary) || 0) > 21000 && (
                          <p className="text-xs text-red-500">Not applicable for Basic Salary &gt; ₹21,000</p>
                        )}
                      </div>

                      {/* PT Toggle */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is Compliant (PT Applicable)
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isCompliant"
                              checked={formData.isCompliant === true}
                              onChange={() => handleComplianceChange("isCompliant", true)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isCompliant"
                              checked={formData.isCompliant === false}
                              onChange={() => handleComplianceChange("isCompliant", false)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>

                      {/* TDS Toggle */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is TDS Applicable
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isTDSApplicable"
                              value="yes"
                              checked={formData.isTDSApplicable === true}
                              onChange={() =>
                                handleComplianceChange("isTDSApplicable", true)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="isTDSApplicable"
                              value="no"
                              checked={formData.isTDSApplicable === false}
                              onChange={() =>
                                handleComplianceChange("isTDSApplicable", false)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payslip Structure Card */}

              </motion.div>
            )}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <BadgeDollarSign className="w-4 h-4 text-indigo-600" />
                      </div>
                      Salary Structure
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Configure salary components, earnings, and deductions with PT &
                      PF auto-calculation
                    </p>
                  </div>
                  <div className="p-6">
                    <PayslipStructureSection
                      payslipStructure={formData.payslipStructure}
                      onStructureChange={handlePayslipStructureChange}
                      errors={errors}
                      employeeGender={formData.personalDetails.gender}
                      pfApplicable={formData.pfApplicable}
                      esicApplicable={formData.esicApplicable}
                      isTdsApplicable={formData.isTDSApplicable}
                      isCompliant={formData.isCompliant}
                      workState={formData.jobDetails.workState}
                    />
                  </div>
                </div>

                {/* Additional Information Card */}

              </motion.div>
            )
            }
            {currentStep === 4 && (
              <motion.div
                key="step4"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6">
                    <VariablePaySection
                      variablePayStructure={formData.variablePayStructure}
                      onStructureChange={(newStructure) => setFormData(prev => ({ ...prev, variablePayStructure: newStructure }))}
                      errors={errors}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={direction}
                transition={{ duration: 0.3, type: "tween" }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 mb-8">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                      </div>
                      Additional Information & Documents
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">
                      Employee status, preferences, attendance approval, and document
                      uploads
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Working Hours <span className="text-red-500">*</span>
                        </label>
                        <input
                          name="workingHr"
                          value={formData.workingHr}
                          onChange={handleChange}
                          placeholder="9hr"
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${errors["workingHr"]
                            ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                            : "border-slate-300"
                            }`}
                        />
                        {errors["workingHr"] && (
                          <div className="flex items-center space-x-1 text-red-600 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors["workingHr"]}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Default Shift
                        </label>
                        <SimpleSelect
                          value={formData.jobDetails.defaultShift}
                          onChange={(e) =>
                            handleSelectChange(
                              "jobDetails.defaultShift",
                              e.target.value
                            )
                          }
                          options={availableShifts}
                          placeholder="Select Default Shift"
                        />
                      </div>



                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is Probation
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="probation"
                              value="yes"
                              checked={formData.probation === "yes"}
                              onChange={(e) =>
                                handleRadioChange("probation", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="probation"
                              value="no"
                              checked={formData.probation === "no"}
                              onChange={(e) =>
                                handleRadioChange("probation", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is OT Applicable
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otApplicable"
                              value="yes"
                              checked={formData.otApplicable === "yes"}
                              onChange={(e) =>
                                handleRadioChange("otApplicable", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="otApplicable"
                              value="no"
                              checked={formData.otApplicable === "no"}
                              onChange={(e) =>
                                handleRadioChange("otApplicable", e.target.value)
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-slate-700">
                          Is Attendance Approval Required{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="attendanceApproval.required"
                              value="yes"
                              checked={formData.attendanceApproval.required === "yes"}
                              onChange={(e) =>
                                handleRadioChange(
                                  "attendanceApproval.required",
                                  e.target.value
                                )
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="attendanceApproval.required"
                              value="no"
                              checked={formData.attendanceApproval.required === "no"}
                              onChange={(e) =>
                                handleRadioChange(
                                  "attendanceApproval.required",
                                  e.target.value
                                )
                              }
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>


                    {/* Supervisor Selection Section */}
                    {formData.attendanceApproval.required === "yes" && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-8">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                          <UserCheck className="w-5 h-5 text-indigo-600" />
                          Attendance Approval Supervisors
                        </h3>
                        <p className="text-slate-600 text-sm mb-6">
                          Select supervisors who will approve attendance for each
                          shift
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Shift 1 Supervisor */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Shift 1 Supervisor{" "}
                                <span className="text-red-500">*</span>
                              </div>
                            </label>
                            {loadingSupervisors ? (
                              <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                                Loading supervisors...
                              </div>
                            ) : (
                              <SimpleSelect
                                value={formData.attendanceApproval.shift1Supervisor}
                                onChange={(e) =>
                                  handleSelectChange(
                                    "attendanceApproval.shift1Supervisor",
                                    e.target.value
                                  )
                                }
                                options={availableSupervisors}
                                placeholder={
                                  formData.jobDetails.organizationId
                                    ? "Select shift 1 supervisor"
                                    : "Select organization first"
                                }
                                error={errors["attendanceApproval.shift1Supervisor"]}
                                disabled={
                                  !formData.jobDetails.organizationId ||
                                  loadingSupervisors
                                }
                              />
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              Supervisor for morning/day shift attendance approval
                            </p>
                          </div>
                          {/* Shift 2 Supervisor */}
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-500" />
                                Shift 2 Supervisor{" "}
                                <span className="text-red-500">*</span>
                              </div>
                            </label>
                            {loadingSupervisors ? (
                              <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                                Loading supervisors...
                              </div>
                            ) : (
                              <SimpleSelect
                                value={formData.attendanceApproval.shift2Supervisor}
                                onChange={(e) =>
                                  handleSelectChange(
                                    "attendanceApproval.shift2Supervisor",
                                    e.target.value
                                  )
                                }
                                options={availableSupervisors}
                                placeholder={
                                  formData.jobDetails.organizationId
                                    ? "Select shift 2 supervisor"
                                    : "Select organization first"
                                }
                                error={errors["attendanceApproval.shift2Supervisor"]}
                                disabled={
                                  !formData.jobDetails.organizationId ||
                                  loadingSupervisors
                                }
                              />
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              Supervisor for evening/night shift attendance approval
                            </p>
                          </div>
                        </div>
                        {availableSupervisors.length === 0 &&
                          formData.jobDetails.organizationId &&
                          !loadingSupervisors && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <p className="text-sm text-amber-800">
                                No supervisors available for this organization. Please
                                create employee profiles first before assigning
                                supervisors.
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                    {/* Document Upload Section */}
                    {formData.jobDetails.categoryId && (
                      <div className="space-y-6 pt-6 border-t border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-slate-600" />
                          Employee Documents
                        </h3>
                        <p className="text-slate-600 text-sm">
                          Upload all required documents for employee verification.
                          Files will be uploaded to Cloudinary. Required documents are
                          marked with <span className="text-red-500">*</span>
                        </p>
                        <DocumentUploadSection
                          uploadedFiles={uploadedFiles}
                          onFilesChange={handleFilesChange}
                          onFileRemove={handleFileRemove}
                          onFileView={(file) => window.open(file.url, "_blank")}
                          employeeCategory={formData.jobDetails.category}
                          categoryId={formData.jobDetails.categoryId}
                        />
                      </div>
                    )}
                  </div>
                </div >

              </motion.div >
            )
            }
          </AnimatePresence >

          {/* Sticky Footer Navigation */}
          < div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-6 mt-auto z-20" >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${currentStep === 0
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {isEdit && (
                <div className="flex items-center gap-3">
                  {formData.status !== 'Inactive' && (
                    <button
                      type="button"
                      onClick={handleSoftDelete}
                      disabled={loading}
                      className="px-4 py-2.5 text-amber-600 hover:bg-amber-50 rounded-lg font-medium transition-colors border border-amber-200"
                    >
                      Deactivate
                    </button>
                  )}
                  {formData.status === 'Inactive' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange("Active")}
                      disabled={loading}
                      className="px-4 py-2.5 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors border border-green-200"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePermanentDelete}
                    disabled={loading}
                    className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-red-200"
                  >
                    Delete Permanently
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                {currentStep === steps.length - 1 || formData.role === "attendance_only" ? (
                  <button
                    type="submit"
                    disabled={loading || fetchLoading}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all hover: disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isEdit ? "Update" : "Submit"}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEdit ? "Update Employee" : "Create Employee"}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div >
        </form >

      </div >
    </div >
  );
}
