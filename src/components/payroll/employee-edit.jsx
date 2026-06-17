"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
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
  Banknote,
  UserCheck,
  Clock,
  Settings,
  Loader2,
  Edit3,
  Car,
  Plus,
  Minus,
  Calculator,
  Download,
  TrendingUp,
  FileWarning,
  Users,
  PcCase,
  Shield,
  GraduationCap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import {
  validators,
  formatPhoneNumber,
  formatPanNumber,
  formatAadharNumber,
  calculateProfessionalTax,
  calculatePF,
} from "@/utils/validation";
import { useValidation } from "@/hooks/useValidation";

// Reusing components from EmployeeForm
const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "unifoods",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unifoods",
  folder: "employee-documents",
};

function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  error,
  disabled = false,
}) {
  return (
    <div>
      <select
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${error
          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
          : "border-slate-300"
          } ${disabled ? "bg-slate-100 cursor-not-allowed" : ""} ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center space-x-1 text-red-600 text-xs mt-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function MonthSelector({ value, onChange }) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
    >
      <option value="">Select Month</option>
      {months.map((month) => (
        <option key={month} value={month}>
          {month}
        </option>
      ))}
    </select>
  );
}

function DocumentUploadSection({
  uploadedFiles,
  onFilesChange,
  onFileRemove,
  employeeCategory = "",
  categoryId = "",
}) {
  const [uploading, setUploading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentCategories, setDocumentCategories] = useState([]);

  useEffect(() => {
    const fetchDocumentCategories = async () => {
      if (!categoryId) {
        setDocumentCategories([]);
        return;
      }
      console.log("Category ID for document fetch:", categoryId);
      try {
        setLoadingDocuments(true);
        const categoryResponse = await fetch(`/api/v1/admin/crm/employeecategory/${categoryId?._id}`);
        if (!categoryResponse.ok) {
          throw new Error("Failed to fetch category details");
        }
        const categoryData = await categoryResponse.json();
        if (!categoryData.category || !categoryData.category.supportedDocuments) {
          setDocumentCategories([]);
          return;
        }
        const transformedCategories = categoryData.category.supportedDocuments.map(
          (doc, index) => {
            const getIcon = (docName) => {
              const lowerName = docName.toLowerCase();
              if (lowerName.includes("aadhar") || lowerName.includes("id")) return IdCard;
              if (lowerName.includes("pan")) return CreditCard;
              if (lowerName.includes("bank") || lowerName.includes("passbook"))
                return Banknote;
              if (lowerName.includes("license") || lowerName.includes("driving"))
                return Car;
              if (lowerName.includes("insurance") || lowerName.includes("fitness"))
                return Shield;
              if (lowerName.includes("salary")) return DollarSign;
              if (lowerName.includes("experience") || lowerName.includes("letter"))
                return Case;
              if (
                lowerName.includes("educational") ||
                lowerName.includes("certificate")
              )
                return GraduationCap;
              return FileText;
            };
            return {
              id: doc._id || `doc_${index}`,
              documentId: doc.id,
              name: doc.name,
              description: doc.description || `Upload ${doc.name}`,
              required: doc.isRequired || false,
              accept: ".pdf,.jpg,.jpeg,.png",
              maxFiles: doc.maxFiles || 2,
              icon: getIcon(doc.name),
            };
          }
        );
        setDocumentCategories(transformedCategories);
      } catch (error) {
        console.error("Error fetching document categories:", error);
        toast.error("Failed to load document requirements");
        setDocumentCategories([]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    fetchDocumentCategories();
  }, [categoryId]);

  useEffect(() => {
    const checkCloudinary = () => {
      if (typeof window !== "undefined" && window.cloudinary) {
        setCloudinaryReady(true);
      } else {
        setTimeout(checkCloudinary, 500);
      }
    };
    checkCloudinary();
  }, []);

  const uploadToCloudinary = (categoryId, category) => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.cloudinary) {
        toast.error(
          "Cloudinary upload system is not loaded. Please refresh the page and try again."
        );
        reject(new Error("Cloudinary not available"));
        return;
      }
      const currentCategoryFiles = uploadedFiles.filter(
        (file) => file.category === categoryId
      );
      if (currentCategoryFiles.length >= category.maxFiles) {
        toast.error(`Maximum ${category.maxFiles} files allowed for ${category.name}`);
        reject(new Error("File limit exceeded"));
        return;
      }
      setUploading(true);
      try {
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            folder: `${CLOUDINARY_CONFIG.folder}/${employeeCategory || "general"
              }/${categoryId}`,
            sources: ["local", "camera"],
            multiple: true,
            maxFiles: category.maxFiles - currentCategoryFiles.length,
            clientAllowedFormats: ["pdf", "jpg", "jpeg", "png"],
            maxFileSize: 5000000,
            resourceType: "auto",
            showUploadMoreButton: true,
            styles: {
              palette: {
                window: "#FFFFFF",
                windowBorder: "#90A0B3",
                tabIcon: "#F59E0B",
                menuIcons: "#5A616A",
                textDark: "#000000",
                textLight: "#FFFFFF",
                link: "#F59E0B",
                action: "#F59E0B",
                inactiveTabIcon: "#0E2F5A",
                error: "#F44235",
                inProgress: "#F59E0B",
                complete: "#20B832",
                sourceBg: "#E4EBF1",
              },
            },
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              toast.error("Failed to upload file. Please try again.");
              setUploading(false);
              reject(error);
              return;
            }
            if (result.event === "success") {
              const newFile = {
                id: result.info.public_id,
                name: result.info.original_filename,
                type: result.info.format,
                size: result.info.bytes,
                category: categoryId,
                categoryName: category.name,
                uploadDate: new Date().toISOString(),
                url: result.info.secure_url,
                cloudinaryId: result.info.public_id,
                cloudinaryUrl: result.info.secure_url,
                thumbnail: result.info.thumbnail_url || result.info.secure_url,
              };
              onFilesChange([...uploadedFiles, newFile]);
            }
            if (result.event === "close") {
              setUploading(false);
              if (widget) {
                widget.close();
              }
              resolve();
            }
          }
        );
        widget.open();
      } catch (err) {
        console.error("Error creating Cloudinary upload widget:", err);
        toast.error(
          "Error initializing upload. Please refresh the page and try again."
        );
        setUploading(false);
        reject(err);
      }
    });
  };

  const handleUploadClick = (categoryId) => {
    if (!cloudinaryReady) {
      toast.error(
        "Upload system is still loading. Please wait a moment and try again."
      );
      return;
    }
    const category = documentCategories.find((cat) => cat.id === categoryId);
    if (!category) {
      toast.error("Document category not found");
      return;
    }
    setActiveCategory(categoryId);
    uploadToCloudinary(categoryId, category);
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes("pdf")) return "📄";
    if (
      fileType.includes("image") ||
      fileType.includes("jpg") ||
      fileType.includes("png") ||
      fileType.includes("jpeg")
    )
      return "🖼️";
    return "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFilesForCategory = (categoryId) => {
    return uploadedFiles.filter((file) => file.category === categoryId);
  };

  const removeFile = (fileId) => {
    onFileRemove(fileId);
  };

  const viewFile = (file) => {
    window.open(file.url, "_blank");
  };

  const getUploadStatus = (categoryId) => {
    const files = getFilesForCategory(categoryId);
    const category = documentCategories.find((cat) => cat.id === categoryId);
    if (!category)
      return { uploaded: 0, required: false, maxFiles: 1, isComplete: false };
    return {
      uploaded: files.length,
      required: category.required,
      maxFiles: category.maxFiles,
      isComplete: category.required ? files.length > 0 : true,
    };
  };

  const renderDocumentCard = (category) => {
    const IconComponent = category.icon;
    const status = getUploadStatus(category.id);
    const categoryFiles = getFilesForCategory(category.id);
    return (
      <div
        key={category.id}
        className={`border-2 border-dashed rounded-xl p-4 transition-all ${status.isComplete
          ? "border-green-200 bg-green-50"
          : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${status.isComplete ? "bg-green-100" : "bg-yellow-100"
                }`}
            >
              <IconComponent
                className={`w-5 h-5 ${status.isComplete ? "text-green-600" : "text-yellow-600"
                  }`}
              />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">
                {category.name}
                {category.required && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {status.uploaded}/{category.maxFiles} files
                {category.required && (
                  <span className="ml-1 text-red-500">Required</span>
                )}
              </p>
            </div>
          </div>
          {status.isComplete && (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-slate-600 mb-3">{category.description}</p>
        <button
          type="button"
          onClick={() => handleUploadClick(category.id)}
          disabled={uploading || status.uploaded >= category.maxFiles || !cloudinaryReady}
          className={`block w-full text-center px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${uploading || status.uploaded >= category.maxFiles || !cloudinaryReady
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : category.required
              ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
              : "bg-purple-100 hover:bg-purple-200 text-purple-700"
            }`}
        >
          {uploading && activeCategory === category.id
            ? "Uploading..."
            : !cloudinaryReady
              ? "Loading..."
              : "Add Files"}
        </button>
        {categoryFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            {categoryFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-sm">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => viewFile(file)}
                    className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                    title="View file"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!cloudinaryReady && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-yellow-800">Loading upload system...</p>
          </div>
        </div>
      )}
      {employeeCategory && (
        <div className="bg-slate-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">
            Document requirements for: <span className="font-semibold">{employeeCategory}</span>
          </p>
          <p className="text-sm text-blue-600 mt-1">
            {loadingDocuments
              ? "Loading document requirements..."
              : documentCategories.length > 0
                ? `${documentCategories.filter((doc) => doc.required).length} required document(s) for this category`
                : "No custom documents required for this category"}
          </p>
        </div>
      )}
      {loadingDocuments && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-white"
            >
              <div className="h-10 bg-slate-200 rounded-lg animate-pulse mb-3"></div>
              <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
      )}
      {!loadingDocuments && documentCategories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Required Documents (For {employeeCategory} role)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documentCategories.map((category) => renderDocumentCard(category))}
          </div>
        </div>
      )}
      {!loadingDocuments && categoryId && documentCategories.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">No additional documents required</span>
            <br />
            Only basic verification documents (Aadhar, PAN, Bank) are required for this role.
          </p>
        </div>
      )}
    </div>
  );
}

function PayslipStructureSection({
  payslipStructure,
  onStructureChange,
  errors = {},
  employeeGender = "",
  pfApplicable = "",
  workState = "Maharashtra",
  isCompliant = true
}) {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [statutoryConfigs, setStatutoryConfigs] = useState([]);

  useEffect(() => {
    const fetchStatutoryConfigs = async () => {
      try {
        const res = await fetch("/api/v1/admin/payroll/settings/statutory");
        const data = await res.json();
        if (Array.isArray(data)) {
          setStatutoryConfigs(data);
        }
      } catch (error) {
        console.error("Failed to fetch statutory configs on client side", error);
      }
    };
    fetchStatutoryConfigs();
  }, []);

  // Synchronize isCompliant prop with the checkbox enabled state
  useEffect(() => {
    const ptIndex = payslipStructure.deductions.findIndex(
      (d) => d.name === "Professional Tax"
    );
    if (ptIndex !== -1) {
      const currentPT = payslipStructure.deductions[ptIndex];
      const shouldBeEnabled = isCompliant !== undefined ? isCompliant : true;
      if (currentPT.enabled !== shouldBeEnabled) {
        const updatedDeductions = [...payslipStructure.deductions];
        updatedDeductions[ptIndex] = { ...currentPT, enabled: shouldBeEnabled };
        onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
      }
    }
  }, [isCompliant]);

  const addEarning = () => {
    const newEarning = {
      name: "New Earning",
      enabled: true,
      editable: true,
      calculationType: "percentage",
      percentage: 0,
      fixedAmount: 0,
    };
    onStructureChange({
      ...payslipStructure,
      earnings: [...payslipStructure.earnings, newEarning],
    });
  };

  const addDeduction = () => {
    const newDeduction = {
      name: "New Deduction",
      enabled: true,
      editable: true,
      calculationType: "percentage",
      percentage: 0,
      fixedAmount: 0,
    };
    onStructureChange({
      ...payslipStructure,
      deductions: [...payslipStructure.deductions, newDeduction],
    });
  };

  const updateEarning = (index, field, value) => {
    const updatedEarnings = [...payslipStructure.earnings];
    updatedEarnings[index] = { ...updatedEarnings[index], [field]: value };
    onStructureChange({ ...payslipStructure, earnings: updatedEarnings });
  };

  const updateDeduction = (index, field, value) => {
    const updatedDeductions = [...payslipStructure.deductions];
    updatedDeductions[index] = { ...updatedDeductions[index], [field]: value };
    onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
  };

  const removeEarning = (index) => {
    const updatedEarnings = payslipStructure.earnings.filter((_, i) => i !== index);
    onStructureChange({ ...payslipStructure, earnings: updatedEarnings });
  };

  const removeDeduction = (index) => {
    const updatedDeductions = payslipStructure.deductions.filter(
      (_, i) => i !== index
    );
    onStructureChange({ ...payslipStructure, deductions: updatedDeductions });
  };

  const calculatePFContributions = () => {
    const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
    if (pfApplicable !== "yes") {
      return { employeePF: 0, employerPF: 0, totalPF: 0 };
    }
    
    const employeePFObj = payslipStructure.deductions?.find(d => d.name === "Provident Fund (Employee)");
    const employerPFObj = payslipStructure.deductions?.find(d => d.name === "Provident Fund (Employer)");
    
    const employeePF = employeePFObj && employeePFObj.enabled ? calculateDeductionAmount(employeePFObj) : 0;
    const employerPF = employerPFObj && employerPFObj.enabled ? calculateDeductionAmount(employerPFObj) : 0;
    
    return {
      employeePF,
      employerPF,
      totalPF: employeePF + employerPF,
    };
  };

  const calculatePT = () => {
    // If Professional Tax deduction is unchecked/disabled, return 0
    const ptDeduction = payslipStructure.deductions.find(d => d.name === "Professional Tax");
    if (ptDeduction && !ptDeduction.enabled) {
      return 0;
    }

    const grossSalary = calculateTotalEarnings();
    const activeState = workState || "Maharashtra";

    // Find statutory configuration for the state (case-insensitive)
    const stateConfig = statutoryConfigs.find(
      (c) => c.state.toLowerCase() === activeState.toLowerCase() && c.isEnabled && c.ptApplicable
    );

    if (stateConfig && Array.isArray(stateConfig.ptSlabs) && stateConfig.ptSlabs.length > 0) {
      const currentMonthNum = selectedMonth
        ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selectedMonth) + 1
        : new Date().getMonth() + 1;

      const slab = stateConfig.ptSlabs.find(
        (s) => grossSalary >= s.minSalary && grossSalary <= s.maxSalary
      );
      if (slab) {
        if (slab.exceptionMonth === currentMonthNum && slab.exceptionTaxAmount !== null) {
          return slab.exceptionTaxAmount;
        }
        return slab.taxAmount;
      }
      return 0;
    }

    // Fallback to hardcoded validation utility
    return calculateProfessionalTax(grossSalary, employeeGender, selectedMonth);
  };

  const calculateEarningAmount = (earning) => {
    const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
    if (earning.calculationType === "fixed") {
      return earning.fixedAmount || 0;
    }
    if (earning.calculationType === "percentage") {
      return (basicSalary * (earning.percentage || 0)) / 100;
    }
    return 0;
  };

  const calculateDeductionAmount = (deduction) => {
    const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
    if (deduction.name === "Professional Tax") {
      return calculatePT();
    }
    if (deduction.calculationType === "fixed") {
      return deduction.fixedAmount || 0;
    }
    if (deduction.calculationType === "percentage") {
      return (basicSalary * (deduction.percentage || 0)) / 100;
    }
    return 0;
  };

  const calculateTotalEarnings = () => {
    const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
    const additionalEarnings = payslipStructure.earnings
      .filter((e) => e.enabled)
      .reduce((sum, e) => sum + calculateEarningAmount(e), 0);
    return basicSalary + additionalEarnings;
  };

  const calculateTotalDeductions = () => {
    const { employeePF } = calculatePFContributions();
    const pt = calculatePT();
    const otherDeductions = payslipStructure.deductions
      .filter(
        (d) =>
          d.enabled &&
          d.name !== "Professional Tax" &&
          d.name !== "Provident Fund (Employee)" &&
          !d.name.toLowerCase().includes("(employer)")
      )
      .reduce((sum, d) => sum + calculateDeductionAmount(d), 0);
    return employeePF + pt + otherDeductions;
  };

  const calculateNetSalary = () => {
    return calculateTotalEarnings() - calculateTotalDeductions();
  };

  const handleGrossSalaryChange = (grossSalary) => {
    const basicSalary = parseFloat(payslipStructure.basicSalary) || 0;
    const difference = grossSalary - basicSalary;
    if (difference > 0 && payslipStructure.earnings.length > 0) {
      const enabledEarnings = payslipStructure.earnings.filter((e) => e.enabled);
      if (enabledEarnings.length > 0) {
        const updatedEarnings = [...payslipStructure.earnings];
        const perEarning = difference / enabledEarnings.length;
        enabledEarnings.forEach((earning) => {
          const originalIndex = payslipStructure.earnings.findIndex(
            (e) => e.name === earning.name
          );
          if (originalIndex !== -1) {
            updatedEarnings[originalIndex] = {
              ...updatedEarnings[originalIndex],
              calculationType: "fixed",
              fixedAmount: perEarning,
              percentage: 0,
            };
          }
        });
        onStructureChange({
          ...payslipStructure,
          earnings: updatedEarnings,
          grossSalary: grossSalary,
        });
      }
    } else if (difference < 0) {
      onStructureChange({
        ...payslipStructure,
        grossSalary: grossSalary,
      });
    }
  };

  const handleBasicSalaryChange = (basicSalary) => {
    const grossSalary = payslipStructure.grossSalary || 0;
    const difference = grossSalary - basicSalary;
    if (difference > 0 && payslipStructure.earnings.length > 0) {
      const enabledEarnings = payslipStructure.earnings.filter((e) => e.enabled);
      if (enabledEarnings.length > 0) {
        const updatedEarnings = [...payslipStructure.earnings];
        const perEarning = difference / enabledEarnings.length;
        enabledEarnings.forEach((earning) => {
          const originalIndex = payslipStructure.earnings.findIndex(
            (e) => e.name === earning.name
          );
          if (originalIndex !== -1) {
            updatedEarnings[originalIndex] = {
              ...updatedEarnings[originalIndex],
              calculationType: "fixed",
              fixedAmount: perEarning,
              percentage: 0,
            };
          }
        });
        onStructureChange({
          ...payslipStructure,
          basicSalary: basicSalary,
          earnings: updatedEarnings,
        });
      }
    } else {
      onStructureChange({
        ...payslipStructure,
        basicSalary: basicSalary,
      });
    }
  };

  useEffect(() => {
    const hasPT = payslipStructure.deductions.some(
      (d) => d.name === "Professional Tax"
    );
    if (!hasPT) {
      const ptDeduction = {
        name: "Professional Tax",
        enabled: true,
        editable: false,
        calculationType: "fixed",
        percentage: 0,
        fixedAmount: 0,
      };
      onStructureChange({
        ...payslipStructure,
        deductions: [...payslipStructure.deductions, ptDeduction],
      });
    }
  }, []);

  useEffect(() => {
    if (pfApplicable === "yes") {
      const hasEmployeePF = payslipStructure.deductions.some(
        (d) => d.name === "Provident Fund (Employee)"
      );
      if (!hasEmployeePF) {
        const pfDeduction = {
          name: "Provident Fund (Employee)",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 12,
          fixedAmount: 0,
        };
        onStructureChange({
          ...payslipStructure,
          deductions: [...payslipStructure.deductions, pfDeduction],
        });
      }
    }
  }, [pfApplicable]);

  return (
    <div className="space-y-8">
      {/* Month Selection for PT Calculation */}
      <div className="bg-slate-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Month Selection for Professional Tax
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Select Month
            </label>
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            <p className="text-xs text-slate-500">
              Professional Tax varies by month. February has fixed ₹300 deduction.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Employee Gender
            </label>
            <div className="flex items-center space-x-2">
              {employeeGender === "Female" ? (
                <span className="text-sm text-green-600 font-medium">Female</span>
              ) : employeeGender === "Male" ? (
                <span className="text-sm text-blue-600 font-medium">Male</span>
              ) : (
                <span className="text-sm text-slate-500">Not specified</span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {employeeGender === "Female"
                ? "PT exempt if salary < ₹25,000"
                : employeeGender === "Male"
                  ? "PT applicable if salary > ₹10,000"
                  : "Select gender for PT calculation"}
            </p>
          </div>
        </div>
      </div>

      {/* Basic Salary Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Basic Salary Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Salary Type <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="monthly"
                  checked={payslipStructure.salaryType === "monthly"}
                  onChange={(e) =>
                    onStructureChange({
                      ...payslipStructure,
                      salaryType: e.target.value,
                    })
                  }
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Monthly Salary</span>
                <p className="text-xs text-slate-500">Fixed monthly amount</p>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="perday"
                  checked={payslipStructure.salaryType === "perday"}
                  onChange={(e) =>
                    onStructureChange({
                      ...payslipStructure,
                      salaryType: e.target.value,
                    })
                  }
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-sm text-slate-700">Per Day Salary</span>
                <p className="text-xs text-slate-500">Daily rate × days</p>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Basic Salary (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={payslipStructure.basicSalary || ""}
                onChange={(e) =>
                  handleBasicSalaryChange(parseFloat(e.target.value) || 0)
                }
                placeholder={payslipStructure.salaryType === "monthly" ? "50000" : "2000"}
                step="0.01"
                className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["payslipStructure.basicSalary"]
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-slate-300"
                  }`}
              />
              {payslipStructure.salaryType === "perday" && (
                <p className="text-xs text-slate-500 mt-1">(Per Day Amount)</p>
              )}
            </div>
            {errors["payslipStructure.basicSalary"] && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors["payslipStructure.basicSalary"]}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gross Salary Input */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Gross Salary (₹) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="number"
            value={payslipStructure.grossSalary || ""}
            onChange={(e) => handleGrossSalaryChange(parseFloat(e.target.value) || 0)}
            placeholder={payslipStructure.salaryType === "monthly" ? "60000" : "3000"}
            step="0.01"
            className={`w-full pl-8 pr-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors["payslipStructure.grossSalary"]
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-slate-300"
              }`}
          />
        </div>
        <p className="text-xs text-slate-500">
          Enter Gross Salary. The difference between Gross and Basic will be
          automatically distributed among earning components.
        </p>
        {errors["payslipStructure.grossSalary"] && (
          <div className="flex items-center space-x-1 text-red-600 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>{errors["payslipStructure.grossSalary"]}</span>
          </div>
        )}
      </div>

      {/* Earnings Components */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Earnings Components (
          {payslipStructure.earnings.filter((e) => e.enabled).length} enabled)
        </h3>
        <button
          type="button"
          onClick={addEarning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Earning
        </button>
        {payslipStructure.earnings.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              No earning components added yet
              <br />
              Click "Add Earning" to create your first component
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payslipStructure.earnings.map((earning, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-200 rounded-lg"
              >
                <div className="md:col-span-1">
                  <input
                    type="checkbox"
                    checked={earning.enabled}
                    onChange={(e) =>
                      updateEarning(index, "enabled", e.target.checked)
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={earning.name}
                    onChange={(e) => updateEarning(index, "name", e.target.value)}
                    placeholder="Earning name"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={earning.calculationType}
                    onChange={(e) =>
                      updateEarning(index, "calculationType", e.target.value)
                    }
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  {earning.calculationType === "percentage" ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={earning.percentage || ""}
                        onChange={(e) =>
                          updateEarning(
                            index,
                            "percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        step="0.1"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">
                        %
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={earning.fixedAmount || ""}
                        onChange={(e) =>
                          updateEarning(
                            index,
                            "fixedAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        step="0.01"
                        min="0"
                        className="w-full pl-8 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-600">
                    ₹
                    {calculateEarningAmount(earning).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                    })}
                  </span>
                  {earning.editable && (
                    <button
                      type="button"
                      onClick={() => removeEarning(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove earning"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deductions Components */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Minus className="w-5 h-5 text-red-600" />
          Deductions Components (
          {payslipStructure.deductions.filter((d) => d.enabled).length} enabled)
        </h3>
        <button
          type="button"
          onClick={addDeduction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Deduction
        </button>
        {payslipStructure.deductions.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              No deduction components added yet
              <br />
              Click "Add Deduction" to create your first component
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payslipStructure.deductions.map((deduction, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-white border border-slate-200 rounded-lg"
              >
                <div className="md:col-span-1">
                  <input
                    type="checkbox"
                    checked={deduction.enabled}
                    onChange={(e) =>
                      updateDeduction(index, "enabled", e.target.checked)
                    }
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                  />
                </div>
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={deduction.name}
                    onChange={(e) =>
                      updateDeduction(index, "name", e.target.value)
                    }
                    placeholder="Deduction name"
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={deduction.calculationType}
                    onChange={(e) =>
                      updateDeduction(index, "calculationType", e.target.value)
                    }
                    disabled={
                      deduction.name === "Professional Tax"
                    }
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  {deduction.calculationType === "percentage" ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={deduction.percentage || ""}
                        onChange={(e) =>
                          updateDeduction(
                            index,
                            "percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        step="0.1"
                        min="0"
                        max="100"
                        disabled={
                          deduction.name === "Professional Tax"
                        }
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-slate-500">
                        %
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={deduction.fixedAmount || ""}
                        onChange={(e) =>
                          updateDeduction(
                            index,
                            "fixedAmount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        step="0.01"
                        min="0"
                        disabled={
                          deduction.name === "Professional Tax"
                        }
                        className="w-full pl-8 pr-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  {deduction.name === "Professional Tax" ? (
                    <span className="text-sm font-medium text-red-600">
                      ₹
                      {calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                      })}{" "}
                      ({selectedMonth || "Month"})
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600">
                      -₹
                      {calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  {deduction.editable &&
                    deduction.name !== "Professional Tax" &&
                    deduction.name !== "Provident Fund (Employee)" && (
                      <button
                        type="button"
                        onClick={() => removeDeduction(index)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove deduction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  {deduction.name === "Professional Tax" && (
                    <p className="text-xs text-slate-500">
                      {employeeGender === "Female"
                        ? `Female employee: ${calculatePT() === 0
                          ? "PT exempt (salary < ₹25,000)"
                          : "PT applicable"
                        }`
                        : employeeGender === "Male"
                          ? `Male employee: ${calculatePT() === 0
                            ? "PT exempt (salary ≤ ₹10,000)"
                            : "PT applicable"
                          }`
                          : "Select gender for PT calculation"}
                      {selectedMonth === "February" && " • February: Fixed ₹300"}
                    </p>
                  )}
                  {deduction.name === "Provident Fund (Employee)" && (
                    <p className="text-xs text-slate-500">
                      Employee PF: 12% of Basic Salary • Employer PF: 13% of Basic
                      Salary
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Breakdown Preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-purple-600" />
          Salary Breakdown & Calculation Preview
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors mb-4"
        >
          <Download className="w-4 h-4" />
          Export Breakdown
        </button>

        {/* Gross Salary Section */}
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Gross Salary (Total Earnings)
          </h4>
          <p className="text-2xl font-bold text-green-600">
            ₹
            {calculateTotalEarnings().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
            })}
          </p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>
              Basic Salary: ₹
              {(payslipStructure.basicSalary || 0).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
              })}
            </li>
            {payslipStructure.earnings
              .filter((e) => e.enabled)
              .map((earning, idx) => (
                <li key={idx}>
                  {earning.name}: ₹
                  {calculateEarningAmount(earning).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                  })}
                </li>
              ))}
          </ul>
        </div>

        {/* Deductions Section */}
        <div className="space-y-4">
          {/* PF Breakdown */}
          {pfApplicable === "yes" && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-red-600" />
                Provident Fund (PF) Breakdown
              </h4>
              <ul className="text-sm text-slate-600 space-y-1 mt-2">
                <li>
                  Employee PF (12%): -₹
                  {calculatePFContributions().employeePF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                  })}
                </li>
                <li>
                  Employer PF (13%): ₹
                  {calculatePFContributions().employerPF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                  })}
                </li>
                <li>
                  Total PF Contribution: ₹
                  {calculatePFContributions().totalPF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                  })}
                </li>
              </ul>
            </div>
          )}

          {/* Professional Tax Section */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <FileWarning className="w-4 h-4 text-red-600" />
              Professional Tax (PT) <span>({selectedMonth || "Select Month"})</span>
            </h4>
            <p className="text-lg font-medium text-red-600">
              ₹{calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p className="text-xs text-slate-500">
              {selectedMonth === "February"
                ? "Fixed ₹300 for February"
                : employeeGender === "Female" && calculatePT() === 0
                  ? "Female employee exempt (salary < ₹25,000)"
                  : employeeGender === "Male" && calculatePT() === 0
                    ? "Male employee exempt (salary ≤ ₹10,000)"
                    : "Applicable as per rules"}
            </p>
            <div className="flex space-x-2 mt-2">
              {employeeGender === "Female" ? (
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Female
                </span>
              ) : employeeGender === "Male" ? (
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Male
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-500 rounded text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Not specified
                </span>
              )}
            </div>
          </div>

          {/* Other Deductions */}
          {payslipStructure.deductions.filter(
            (d) =>
              d.enabled &&
              d.name !== "Professional Tax" &&
              d.name !== "Provident Fund (Employee)" &&
              !d.name.toLowerCase().includes("(employer)")
          ).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Minus className="w-4 h-4 text-red-600" />
                  Other Deductions
                </h4>
                <ul className="text-sm text-slate-600 space-y-1 mt-2">
                  {payslipStructure.deductions
                    .filter(
                      (d) =>
                        d.enabled &&
                        d.name !== "Professional Tax" &&
                        d.name !== "Provident Fund (Employee)" &&
                        !d.name.toLowerCase().includes("(employer)")
                    )
                    .map((deduction, idx) => (
                      <li key={idx}>
                        {deduction.name}: -₹
                        {calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                        })}
                      </li>
                    ))}
                </ul>
              </div>
            )}

          {/* Employer Contributions (Informational) */}
          {payslipStructure.deductions.filter(
              (d) => d.enabled && d.name.toLowerCase().includes("(employer)")
          ).length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <BadgeDollarSign className="w-4 h-4 text-slate-600" />
                      Employer Contributions (Not deducted from Net Salary)
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1 mt-2">
                      {payslipStructure.deductions
                          .filter((d) => d.enabled && d.name.toLowerCase().includes("(employer)"))
                          .map((deduction, idx) => (
                              <li key={idx} className="flex justify-between">
                                  <span>{deduction.name}</span>
                                  <span className="font-medium text-slate-700">
                                      ₹{calculateDeductionAmount(deduction).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2 })}
                                  </span>
                              </li>
                          ))}
                  </ul>
              </div>
          )}
        </div>

        {/* Net Salary Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600" />
            Net Salary Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-sm text-slate-600">Total Earnings</p>
              <p className="text-lg font-medium text-green-600">
                ₹
                {calculateTotalEarnings().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Deductions</p>
              <p className="text-lg font-medium text-red-600">
                -₹
                {calculateTotalDeductions().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-500">
                Includes: PF{" "}
                {calculatePFContributions().employeePF > 0
                  ? `(₹${calculatePFContributions().employeePF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})`
                  : ""}{" "}
                , PT{" "}
                {calculatePT() > 0
                  ? `(₹${calculatePT().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Net Payable Salary</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹
                {calculateNetSalary().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-slate-500">
                Take home amount{" "}
                {payslipStructure.salaryType === "perday" && "(per day)"}
              </p>
            </div>
          </div>
          <div
            className={`mt-4 p-4 rounded-lg text-sm font-medium text-white ${calculateNetSalary() > 0 ? "bg-green-400" : "bg-red-400"
              }`}
          >
            {calculateNetSalary() > 0
              ? "Positive balance - Ready for processing"
              : "Needs adjustment - Deductions exceed earnings"}
          </div>
          {payslipStructure.salaryType === "perday" && (
            <div className="mt-4 bg-slate-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-800">
                Per Day Salary Configuration
              </p>
              <p className="text-sm text-blue-600 mt-1">
                The amounts shown above are for one working day. Actual monthly
                salary will be calculated by multiplying these amounts with the
                number of working days in the month.
              </p>
              <ul className="text-sm text-blue-600 mt-2 space-y-1">
                {[22, 24, 26, 30].map((days) => (
                  <li key={days}>
                    For {days} days: ₹
                    {(calculateNetSalary() * days).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

export default function EmployeeEdit({ employeeId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const validationSchema = {
    'personalDetails.firstName': 'name',
    'personalDetails.lastName': 'name',
    'personalDetails.email': 'email',
    'personalDetails.phone': 'phone',
    'personalDetails.address.zipCode': 'zip',
    'salaryDetails.bankAccount.accountNumber': 'accountNumber',
    'salaryDetails.bankAccount.ifscCode': 'ifsc',
    'salaryDetails.panNumber': 'pan',
    'salaryDetails.aadharNumber': 'aadhar',
  };

  const { errors, validateField, handleBlur, setErrors, touched } = useValidation({}, validationSchema);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [employeesList, setEmployeesList] = useState([]); // NEW
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const [formData, setFormData] = useState({
    personalDetails: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
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
      dateOfJoining: "",
      dateOfBirth: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "", // NEW
    },
    // NEW FIELDS
    role: "employee",
    isCompliant: false,
    isTDSApplicable: false,
    jobDetails: {
      department: "",
      departmentId: "",
      designation: "",
      employmentType: "Full-Time",
      organizationId: "",
      // NEW
      teamLead: null,
      supervisor: null,
      workLocation: "",
    },
    salaryDetails: {
      basicSalary: "",
      bankAccount: {
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        ifscCode: "",
        branch: "",
        branchAddress: "", // NEW
      },
      panNumber: "",
      aadharNumber: "",
    },
    payslipStructure: {
      templateId: null,
      templateName: "",
      salaryType: "monthly",
      basicSalary: 0,
      grossSalary: 0,
      earnings: [
        {
          name: "House Rent Allowance",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 40,
          fixedAmount: 0,
        },
        {
          name: "Transport Allowance",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 10,
          fixedAmount: 0,
        },
      ],
      deductions: [
        {
          name: "Provident Fund",
          enabled: true,
          editable: true,
          calculationType: "percentage",
          percentage: 12,
          fixedAmount: 0,
        },
        {
          name: "Professional Tax",
          enabled: true,
          editable: false,
          calculationType: "fixed",
          percentage: 0,
          fixedAmount: 0,
        },
      ],
      additionalFields: [
        { name: "Bank Account Number", enabled: true },
        { name: "PAN Number", enabled: true },
        { name: "UAN Number", enabled: true },
        { name: "Working Days", enabled: true },
      ],
    },
    organizationType: "",
    employeeType: "",
    employeeTypeId: "",
    category: "",
    categoryId: "",
    subCategory: "",
    subCategoryId: "",
    probation: "no",
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
  });

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeId}`);
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   toast.error(`Failed to load employee data: ${errorData.error || "Unknown error"}`);
      //   return;
      // }
      const employeeData = await response.json();
      console.log("Employee Data = ", employeeData)
      if (employeeData.personalDetails?.dateOfJoining) {
        employeeData.personalDetails.dateOfJoining = new Date(
          employeeData.personalDetails.dateOfJoining
        )
          .toISOString()
          .split("T")[0];
      }
      if (employeeData.personalDetails?.dateOfBirth) {
        employeeData.personalDetails.dateOfBirth = new Date(
          employeeData.personalDetails.dateOfBirth
        )
          .toISOString()
          .split("T")[0];
      }
      if (employeeData.personalDetails?.phone) {
        employeeData.personalDetails.phone = formatPhoneNumber(
          employeeData.personalDetails.phone
        );
      }
      if (employeeData.salaryDetails?.panNumber) {
        employeeData.salaryDetails.panNumber = formatPanNumber(
          employeeData.salaryDetails.panNumber
        );
      }
      if (employeeData.salaryDetails?.aadharNumber) {
        employeeData.salaryDetails.aadharNumber = formatAadharNumber(
          employeeData.salaryDetails.aadharNumber
        );
      }

      // Form Mapping & Flattening
      // Flatten jobDetails populated fields
      if (employeeData.jobDetails) {
        if (employeeData.jobDetails.organizationId && typeof employeeData.jobDetails.organizationId === 'object') {
          employeeData.jobDetails.organizationId = employeeData.jobDetails.organizationId._id;
        }
        if (employeeData.jobDetails.departmentId && typeof employeeData.jobDetails.departmentId === 'object') {
          employeeData.jobDetails.departmentId = employeeData.jobDetails.departmentId._id;
        }
        if (employeeData.jobDetails.teamLead && typeof employeeData.jobDetails.teamLead === 'object') {
          employeeData.jobDetails.teamLead = employeeData.jobDetails.teamLead._id;
        }
        if (employeeData.jobDetails.supervisor && typeof employeeData.jobDetails.supervisor === 'object') {
          employeeData.jobDetails.supervisor = employeeData.jobDetails.supervisor._id;
        }
      }

      // Flatten other populated fields
      if (employeeData.employeeTypeId && typeof employeeData.employeeTypeId === 'object') {
        employeeData.employeeTypeId = employeeData.employeeTypeId._id;
      }
      if (employeeData.categoryId && typeof employeeData.categoryId === 'object') {
        employeeData.categoryId = employeeData.categoryId._id;
      }
      if (employeeData.subCategoryId && typeof employeeData.subCategoryId === 'object') {
        employeeData.subCategoryId = employeeData.subCategoryId._id;
      }

      // Flatten attendance approval supervisors
      if (employeeData.attendanceApproval) {
        if (employeeData.attendanceApproval.shift1Supervisor && typeof employeeData.attendanceApproval.shift1Supervisor === 'object') {
          employeeData.attendanceApproval.shift1Supervisor = employeeData.attendanceApproval.shift1Supervisor._id;
        }
        if (employeeData.attendanceApproval.shift2Supervisor && typeof employeeData.attendanceApproval.shift2Supervisor === 'object') {
          employeeData.attendanceApproval.shift2Supervisor = employeeData.attendanceApproval.shift2Supervisor._id;
        }
      }

      // Map Address (Legacy to New)
      if (employeeData.personalDetails) {
        // Ensure currentAddress structure exists
        if (!employeeData.personalDetails.currentAddress) {
          employeeData.personalDetails.currentAddress = {
            street: "", city: "", state: "", zipCode: ""
          };
        }
        // Map legacy address if currentAddress is empty
        if (employeeData.personalDetails.address &&
          (!employeeData.personalDetails.currentAddress.street && !employeeData.personalDetails.currentAddress.city)) {
          employeeData.personalDetails.currentAddress = { ...employeeData.personalDetails.address };
        }
      }

      // Map basicSalary from salaryDetails if missing in payslipStructure (Legacy Support)
      if ((!employeeData.payslipStructure?.basicSalary || employeeData.payslipStructure.basicSalary === 0) &&
        employeeData.salaryDetails?.basicSalary) {
        if (!employeeData.payslipStructure) employeeData.payslipStructure = {}; // Should depend on prev state, but safest to init if missing
        employeeData.payslipStructure.basicSalary = Number(employeeData.salaryDetails.basicSalary);
      }

      // Calculate Gross Salary if missing or zero
      if (!employeeData.payslipStructure?.grossSalary || employeeData.payslipStructure.grossSalary === 0) {
        const basic = Number(employeeData.payslipStructure?.basicSalary || 0);
        const earningsTotal = (employeeData.payslipStructure?.earnings || []).reduce((sum, item) => {
          if (!item.enabled) return sum;
          if (item.calculationType === 'percentage') {
            return sum + (basic * (item.percentage / 100));
          } else {
            return sum + (Number(item.fixedAmount) || 0);
          }
        }, 0);

        // Ensure payslipStructure exists in employeeData to start
        if (!employeeData.payslipStructure) {
          // If completely missing, we might want to rely on formData defaults, 
          // but modifying employeeData ensures specific fields are set.
          // However, merging with prev state handles defaults. 
          // Let's just set the specific calculated field if structure exists or we created it above.
          employeeData.payslipStructure = { basicSalary: basic, earnings: [] };
        }
        employeeData.payslipStructure.grossSalary = basic + earningsTotal;
      }

      // Set State
      setFormData(prev => ({
        ...prev,
        ...employeeData,
        // Ensure nested objects are merged deeply if needed, but top-level replacement is usually fine for this structure
        // assuming employeeData has the complete structure. 
        // If employeeData is partial, we might need deep merge, but usually it's complete from DB.
      }));

      console.log(employeeData);
      if (employeeData.documents) {
        setUploadedFiles(employeeData.documents);
      }
    } catch (error) {
      console.error("Error fetching employee:", error);
      toast.error("Error loading employee data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch("/api/v1/admin/crm/organizations?limit=1000");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch organizations");
      }
      const organizationOptions = data.organizations.map((org) => ({
        value: String(org._id),
        label: org.name,
        orgId: org.orgId,
      }));
      setOrganizations(organizationOptions);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      setOrganizations([]);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchDepartments = async (organizationId) => {
    console.log(organizationId);

    try {
      if (!organizationId) {
        setDepartments([]);
        setEmployeeTypes([]);
        setCategories([]);
        setSubCategories([]);
        return;
      }
      const response = await fetch(
        `/api/v1/admin/crm/departments?organizationId=${organizationId?._id || organizationId}&limit=1000`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch departments");
      }
      const departmentOptions = data.data
        .filter((dept) => dept.status === "Active")
        .map((dept) => ({
          value: String(dept._id),
          label: dept.departmentName,
          name: dept.departmentName,
        }));
      setDepartments(departmentOptions);
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
    }
  };

  const fetchEmployeeTypes = async (organizationId, departmentId) => {
    try {
      if (!organizationId || !departmentId) {
        setEmployeeTypes([]);
        setCategories([]);
        setSubCategories([]);
        return;
      }
      const params = new URLSearchParams();
      params.set("organizationId", organizationId?._id || organizationId);
      params.set("departmentId", departmentId?._id || departmentId);
      params.set("limit", "1000");
      const response = await fetch(`/api/v1/admin/crm/employeetype?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch employee types");
      }
      const employeeTypeOptions = data.data.map((item) => ({
        value: String(item._id),
        label: item.employeeType,
        typeName: item.employeeType,
      }));
      setEmployeeTypes(employeeTypeOptions);
    } catch (error) {
      console.error("Error fetching employee types:", error);
      setEmployeeTypes([]);
    }
  };

  const fetchCategories = async (organizationId, departmentId, employeeTypeId) => {
    try {
      if (!organizationId || !departmentId || !employeeTypeId) {
        setCategories([]);
        setSubCategories([]);
        return;
      }
      const params = new URLSearchParams();
      params.set("organizationId", organizationId?._id || organizationId);
      params.set("departmentId", departmentId?._id || departmentId);
      params.set("employeeTypeId", employeeTypeId?._id || employeeTypeId);
      params.set("limit", "1000");
      const response = await fetch(
        `/api/v1/admin/crm/employeecategory?${params.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch categories");
      }
      const categoryOptions = data.data.map((item) => ({
        value: String(item._id),
        label: item.employeeCategory,
        categoryName: item.employeeCategory,
      }));
      setCategories(categoryOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchSubCategories = async (
    organizationId,
    departmentId,
    employeeTypeId,
    categoryId
  ) => {
    try {
      if (!organizationId || !departmentId || !employeeTypeId || !categoryId) {
        setSubCategories([]);
        return;
      }
      console.log("Fetching sub-categories with:", organizationId, departmentId, employeeTypeId, categoryId);
      const params = new URLSearchParams();
      params.set("organizationId", organizationId?._id || organizationId);
      params.set("departmentId", departmentId?._id || departmentId);
      params.set("employeeTypeId", employeeTypeId?._id || employeeTypeId);
      params.set("employeeCategoryId", categoryId?._id || categoryId);
      params.set("limit", "1000");

      const response = await fetch(
        `/api/v1/admin/crm/employeesubcategory?${params.toString()}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch sub-categories");
      }
      const subCategoryOptions = data.data.map((item) => ({
        value: String(item._id),
        label: item.employeeSubCategory,
        subCategoryName: item.employeeSubCategory,
      }));
      setSubCategories(subCategoryOptions);
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
      setSubCategories([]);
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
        `/api/v1/admin/payroll/employees?organizationId=${organizationId?._id}&status=Active&limit=1000`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch supervisors");
      }
      const supervisorOptions = data.employees
        .filter((emp) => emp._id !== employeeId)
        .map((emp) => ({
          value: emp._id,
          label: `${emp.personalDetails.firstName} ${emp.personalDetails.lastName} (${emp.employeeId})`,
        }));
      setAvailableSupervisors(supervisorOptions);
      setEmployeesList(supervisorOptions);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
      setAvailableSupervisors([]);
    } finally {
      setLoadingSupervisors(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (employeeId) {
      fetchEmployee();
    }
  }, [employeeId]);

  useEffect(() => {
    if (formData.jobDetails?.organizationId) {
      fetchDepartments(formData.jobDetails.organizationId);
      fetchSupervisors(formData.jobDetails.organizationId);
    } else {
      setDepartments([]);
      setEmployeeTypes([]);
      setCategories([]);
      setSubCategories([]);
      setAvailableSupervisors([]);
    }
  }, [formData.jobDetails?.organizationId]);

  useEffect(() => {
    if (formData.jobDetails?.organizationId && formData.jobDetails?.departmentId) {
      fetchEmployeeTypes(
        formData.jobDetails.organizationId,
        formData.jobDetails.departmentId
      );
    } else {
      setEmployeeTypes([]);
      setCategories([]);
      setSubCategories([]);
    }
  }, [formData.jobDetails?.organizationId, formData.jobDetails?.departmentId]);

  useEffect(() => {
    if (
      formData.jobDetails?.organizationId &&
      formData.jobDetails?.departmentId &&
      formData.employeeTypeId
    ) {
      fetchCategories(
        formData.jobDetails.organizationId,
        formData.jobDetails.departmentId,
        formData.employeeTypeId
      );
    } else {
      setCategories([]);
      setSubCategories([]);
    }
  }, [
    formData.jobDetails?.organizationId,
    formData.jobDetails?.departmentId,
    formData.employeeTypeId,
  ]);

  useEffect(() => {
    if (
      formData.jobDetails?.organizationId &&
      formData.jobDetails?.departmentId &&
      formData.employeeTypeId &&
      formData.categoryId
    ) {
      fetchSubCategories(
        formData.jobDetails.organizationId,
        formData.jobDetails.departmentId,
        formData.employeeTypeId,
        formData.categoryId
      );
    } else {
      setSubCategories([]);
    }
  }, [
    formData.jobDetails?.organizationId,
    formData.jobDetails?.departmentId,
    formData.employeeTypeId,
    formData.categoryId,
  ]);

  useEffect(() => {
    if (formData.salaryDetails.basicSalary) {
      setFormData((prev) => ({
        ...prev,
        payslipStructure: {
          ...prev.payslipStructure,
          basicSalary: parseFloat(prev.salaryDetails.basicSalary) || 0,
        },
      }));
    }
  }, [formData.salaryDetails.basicSalary]);

  useEffect(() => {
    if (formData.isCompliant) {
      setFormData((prev) => ({
        ...prev,
        isTDSApplicable: true,
      }));
    }
  }, [formData.isCompliant]);

  const handleFilesChange = (newFiles) => {
    setUploadedFiles(newFiles);
  };

  const handleFileRemove = (fileId) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply specific formatting based on field name
    if (name === "personalDetails.phone") {
      formattedValue = formatPhoneNumber(value);
    } else if (name === "salaryDetails.panNumber") {
      formattedValue = formatPanNumber(value);
    } else if (name === "salaryDetails.aadharNumber") {
      formattedValue = formatAadharNumber(value);
    }

    // Update state
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

    // Instant validation
    validateField(name, formattedValue);
  };

  const handleSelectChange = (field, value) => {
    // Clear error if exists
    if (errors[field]) {
      validateField(field, value);
    }

    setFormData((prev) => {
      const newData = { ...prev };
      const fields = field.split(".");
      if (fields.length === 1) {
        newData[fields[0]] = value;
      } else if (fields.length === 2) {
        newData[fields[0]][fields[1]] = value;
      } else if (fields.length === 3) {
        newData[fields[0]][fields[1]][fields[2]] = value;
      }

      // ... existing logic for side effects ...
      if (field === "jobDetails.departmentId") {
        const selectedDept = departments.find((dept) => dept.value === value);
        if (selectedDept) {
          newData.jobDetails.department = selectedDept.name;
          newData.jobDetails.departmentId = value;
        }
      }
      if (field === "jobDetails.organizationId") {
        const selectedOrg = organizations.find((org) => org.value === value);
        if (selectedOrg) {
          newData.organizationType = selectedOrg.label;
        }
      }
      if (field === "employeeTypeId") {
        const selectedType = employeeTypes.find((type) => type.value === value);
        if (selectedType) {
          newData.employeeType = selectedType.typeName;
          newData.employeeTypeId = value;
        }
      }
      if (field === "categoryId") {
        const selectedCategory = categories.find((cat) => cat.value === value);
        if (selectedCategory) {
          newData.category = selectedCategory.categoryName;
          newData.categoryId = value;
        }
      }
      if (field === "subCategoryId") {
        const selectedSubCategory = subCategories.find(
          (sub) => sub.value === value
        );
        if (selectedSubCategory) {
          newData.subCategory = selectedSubCategory.subCategoryName;
          newData.subCategoryId = value;
        }
      }
      return newData;
    });
  };

  const handleRadioChange = (field, value) => {
    // Clear error if exists
    if (errors[field]) {
      validateField(field, value);
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

  const handlePayslipStructureChange = (updatedStructure) => {
    setFormData((prev) => ({
      ...prev,
      payslipStructure: updatedStructure,
    }));
  };

  const validateForm = () => {

    let isValid = true;
    const newErrors = {};

    Object.keys(validationSchema).forEach((field) => {
      // Get value from nested path
      const keys = field.split('.');
      let value = formData;
      for (const k of keys) {
        value = value?.[k];
      }

      // We can reuse validateField logic or manual check
      // For synchronous full form validation, it is often better to re-run checks
      // to ensure state is consistent.

      const validatorName = validationSchema[field];
      const validator = validators[validatorName];

      if (validator && !validator(value)) {
        isValid = false;
        // Assign error message
        let message = "Invalid value";
        if (validatorName === 'email') message = "Please enter a valid email address";
        if (validatorName === 'phone') message = "Please enter a valid 10-digit Indian phone number starting with 6-9";
        if (validatorName === 'pan') message = "Invalid PAN number";
        if (validatorName === 'aadhar') message = "Please enter a valid 12-digit Aadhar number";
        if (validatorName === 'zip') message = "Please enter a valid 6-digit ZIP code";
        if (validatorName === 'name') message = "Should contain only alphabets and spaces (1-40 characters)";
        if (validatorName === 'positiveNumber') message = "Must be a positive number";
        if (validatorName === 'accountNumber') message = "Account number must be 9-18 digits";
        if (validatorName === 'ifsc') message = "Please enter a valid IFSC code";

        // Specific required checks that overlap with format checks
        if (!value) {
          message = `${field.split('.').pop()} is required`;
          // Better to have human readable names map if we want perfect messages, 
          // but this is a good start for "Instant Highlighting"
        }

        newErrors[field] = message;
      } else if (!value && field !== 'personalDetails.firstName') {
        // Catch-all for required fields if validator didn't fail on empty (validators usually handle empty)
        // Our validators like email return false on empty if we passed strict check, 
        // but our regex utils might handle empty differently.
        // Let's check the utils... name: (v) => ...test(v?.trim() || "") -> fail on empty
        // So the validator check covers it.
      }
    });

    // Custom required checks not in schema (e.g. dropdowns)
    if (!formData.jobDetails.organizationId) newErrors["jobDetails.organizationId"] = "Organization is required";
    if (!formData.jobDetails.departmentId) newErrors["jobDetails.departmentId"] = "Department is required";
    if (!formData.employeeTypeId) newErrors["employeeTypeId"] = "Employee type is required";
    if (!formData.categoryId) newErrors["categoryId"] = "Category is required";
    if (!formData.jobDetails.designation) newErrors["jobDetails.designation"] = "Designation is required";
    if (!formData.payslipStructure.basicSalary) newErrors["payslipStructure.basicSalary"] = "Basic salary in payslip structure must be greater than 0";
    if (!formData.salaryDetails.bankAccount.bankName) newErrors["salaryDetails.bankAccount.bankName"] = "Bank name is required";
    if (!formData.workingHr) newErrors["workingHr"] = "Working hours is required";

    if (formData.attendanceApproval.required === "yes") {
      if (!formData.attendanceApproval.shift1Supervisor) newErrors["attendanceApproval.shift1Supervisor"] = "Shift 1 supervisor is required";
      if (!formData.attendanceApproval.shift2Supervisor) newErrors["attendanceApproval.shift2Supervisor"] = "Shift 2 supervisor is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const validateDocuments = () => {
    const requiredCategories = documentCategories.filter((cat) => cat.required);
    for (const category of requiredCategories) {
      const categoryFiles = uploadedFiles.filter(
        (file) => file.category === category.id
      );
      if (categoryFiles.length === 0) {
        toast.error(`Please upload ${category.name} document`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix all validation errors");
      const firstErrorElement = document.querySelector(".border-red-300");
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }
    setSaving(true);
    try {
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
        jobDetails: {
          ...formData.jobDetails,
          organizationId: formData.jobDetails.organizationId?._id || formData.jobDetails.organizationId,
          departmentId: formData.jobDetails.departmentId?._id || formData.jobDetails.departmentId,
          teamLead: formData.jobDetails.teamLead?._id || formData.jobDetails.teamLead || null,
          supervisor: formData.jobDetails.supervisor?._id || formData.jobDetails.supervisor || null,
          reportingManager: formData.jobDetails.reportingManager?._id || formData.jobDetails.reportingManager || null,
        },
        employeeTypeId: formData.employeeTypeId?._id || formData.employeeTypeId,
        categoryId: formData.categoryId?._id || formData.categoryId,
        subCategoryId: formData.subCategoryId?._id || formData.subCategoryId,
      };
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      if (response.ok) {
        toast.success("Employee updated successfully! 🎉");
        setTimeout(() => {
          router.back();
        }, 1000);
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error || "Failed to update employee"}`);
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("An error occurred while updating the employee");
    } finally {
      setSaving(false);
    }
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
      formData.employeeTypeId,
      formData.categoryId,
      formData.jobDetails.designation,
      formData.salaryDetails.basicSalary,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
                <div>
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Progress Skeleton */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          </div>

          {/* Sections Skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-64 ml-11" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Edit Employee Profile
                  </h1>
                  <p className="text-slate-600 text-sm mt-0.5">
                    Update employee information and salary structure
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Progress Indicator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Form Completion
            </h3>
            <span className="text-sm font-medium text-slate-600">
              {progress}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div
              className={`flex items-center space-x-2 ${formData.personalDetails.firstName &&
                validators.name(formData.personalDetails.firstName)
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {formData.personalDetails.firstName &&
                validators.name(formData.personalDetails.firstName) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Personal Information</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${formData.jobDetails.organizationId &&
                formData.jobDetails.departmentId &&
                formData.employeeTypeId &&
                formData.categoryId
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {formData.jobDetails.organizationId &&
                formData.jobDetails.departmentId &&
                formData.employeeTypeId &&
                formData.categoryId ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Organization Details</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${formData.salaryDetails.basicSalary &&
                validators.positiveNumber(formData.salaryDetails.basicSalary) &&
                formData.probation &&
                formData.isAttending &&
                formData.workingHr
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {formData.salaryDetails.basicSalary &&
                validators.positiveNumber(formData.salaryDetails.basicSalary) &&
                formData.probation &&
                formData.isAttending &&
                formData.workingHr ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Financial Information</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${formData.payslipStructure.basicSalary > 0 &&
                formData.payslipStructure.earnings.length > 0
                ? "text-green-700"
                : "text-slate-500"
                }`}
            >
              {formData.payslipStructure.basicSalary > 0 &&
                formData.payslipStructure.earnings.length > 0 ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
              )}
              <span>Salary Structure</span>
            </div>
          </div>
        </div>
        {/* Organization Details */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              Organization Details
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Select organization, department, employee type, category, and
              sub-category in order
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                    value={formData.jobDetails.organizationId?._id || formData.jobDetails.organizationId || ""}
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Department <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.jobDetails.departmentId?._id || formData.jobDetails.departmentId || ""}
                    onChange={(e) =>
                      handleSelectChange("jobDetails.departmentId", e.target.value)
                    }
                    options={departments}
                    placeholder={
                      formData.jobDetails.organizationId
                        ? "Select department"
                        : "Select organization first"
                    }
                    error={errors["jobDetails.departmentId"]}
                    disabled={!formData.jobDetails.organizationId}
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee Type <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.employeeTypeId?._id || formData.employeeTypeId || ""}
                    onChange={(e) =>
                      handleSelectChange("employeeTypeId", e.target.value)
                    }
                    options={employeeTypes}
                    placeholder={
                      formData.jobDetails.organizationId &&
                        formData.jobDetails.departmentId
                        ? "Select employee type"
                        : formData.jobDetails.organizationId
                          ? "Select department first"
                          : "Select organization first"
                    }
                    error={errors.employeeTypeId}
                    disabled={
                      !formData.jobDetails.organizationId ||
                      !formData.jobDetails.departmentId
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.categoryId?._id || formData.categoryId || ""}
                    onChange={(e) =>
                      handleSelectChange("categoryId", e.target.value)
                    }
                    options={categories}
                    placeholder={
                      formData.jobDetails.organizationId &&
                        formData.jobDetails.departmentId &&
                        formData.employeeTypeId
                        ? "Select category"
                        : "Complete previous fields first"
                    }
                    error={errors.categoryId}
                    disabled={
                      !formData.jobDetails.organizationId ||
                      !formData.jobDetails.departmentId ||
                      !formData.employeeTypeId
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Sub-category
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.subCategoryId?._id || formData.subCategoryId || ""}
                    onChange={(e) =>
                      handleSelectChange("subCategoryId", e.target.value)
                    }
                    options={subCategories}
                    placeholder={
                      formData.jobDetails.organizationId &&
                        formData.jobDetails.departmentId &&
                        formData.employeeTypeId &&
                        formData.categoryId
                        ? "Select sub-category"
                        : "Complete previous fields first"
                    }
                    error={errors.subCategoryId}
                    disabled={
                      !formData.jobDetails.organizationId ||
                      !formData.jobDetails.departmentId ||
                      !formData.employeeTypeId ||
                      !formData.categoryId
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Personal Details */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                <User className="w-4 h-4 text-yellow-600" />
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
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="personalDetails.firstName"
                    value={formData.personalDetails.firstName}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    maxLength={40}
                    placeholder="John"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.firstName"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
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
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="personalDetails.lastName"
                    value={formData.personalDetails.lastName}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    maxLength={40}
                    placeholder="Doe"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.lastName"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
                {errors["personalDetails.lastName"] && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors["personalDetails.lastName"]}</span>
                  </div>
                )}
              </div>
            </div>
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
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                  maxLength={40}
                  placeholder="john.doe@company.com"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.email"]
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
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                  placeholder="987 654 3210"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.phone"]
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
                    value={formData.personalDetails.dateOfBirth}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.dateOfBirth"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
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
                    handleSelectChange("personalDetails.gender", e.target.value)
                  }
                  options={genderOptions}
                  placeholder="Select gender"
                />
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
                        onChange={handleInputChange}
                        placeholder="123 Main St, Apt 4B"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">City</label>
                      <input
                        name="personalDetails.currentAddress.city"
                        value={formData.personalDetails.currentAddress?.city || ""}
                        onChange={handleInputChange}
                        placeholder="New York"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">State</label>
                        <input
                          name="personalDetails.currentAddress.state"
                          value={formData.personalDetails.currentAddress?.state || ""}
                          onChange={handleInputChange}
                          placeholder="NY"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
                        <input
                          name="personalDetails.currentAddress.zipCode"
                          value={formData.personalDetails.currentAddress?.zipCode || ""}
                          onChange={handleInputChange}
                          placeholder="10001"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
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
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
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
                        onChange={handleInputChange}
                        placeholder="123 Main St, Apt 4B"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">City</label>
                      <input
                        name="personalDetails.permanentAddress.city"
                        value={formData.personalDetails.permanentAddress?.city || ""}
                        onChange={handleInputChange}
                        placeholder="New York"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">State</label>
                        <input
                          name="personalDetails.permanentAddress.state"
                          value={formData.personalDetails.permanentAddress?.state || ""}
                          onChange={handleInputChange}
                          placeholder="NY"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
                        <input
                          name="personalDetails.permanentAddress.zipCode"
                          value={formData.personalDetails.permanentAddress?.zipCode || ""}
                          onChange={handleInputChange}
                          placeholder="10001"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Date of Joining <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="personalDetails.dateOfJoining"
                  type="date"
                  value={formData.personalDetails.dateOfJoining}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["personalDetails.dateOfJoining"]
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
                onChange={(e) => handleSelectChange("status", e.target.value)}
                options={statusOptions}
                placeholder="Select status"
              />
            </div>
          </div>
        </div>
        {/* Organization Details */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              Organization Details
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Select organization, department, employee type, and category
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
              {/* 2. Department Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Department <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
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
                      formData.jobDetails.organizationId
                        ? "Select department"
                        : "Select organization first"
                    }
                    error={errors["jobDetails.departmentId"]}
                    disabled={!formData.jobDetails.organizationId}
                  />
                )}
              </div>
              {/* 3. Employee Type Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Employee Type <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.employeeTypeId}
                    onChange={(e) =>
                      handleSelectChange("employeeTypeId", e.target.value)
                    }
                    options={employeeTypes}
                    placeholder={
                      formData.jobDetails.organizationId &&
                        formData.jobDetails.departmentId
                        ? "Select employee type"
                        : formData.jobDetails.organizationId
                          ? "Select department first"
                          : "Select organization first"
                    }
                    error={errors.employeeTypeId}
                    disabled={
                      !formData.jobDetails.organizationId ||
                      !formData.jobDetails.departmentId
                    }
                  />
                )}
              </div>
              {/* 4. Category Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Category <span className="text-red-500">*</span>
                </label>
                {fetchLoading ? (
                  <div className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-slate-100 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <SimpleSelect
                    value={formData.categoryId}
                    onChange={(e) =>
                      handleSelectChange("categoryId", e.target.value)
                    }
                    options={categories}
                    placeholder={
                      formData.jobDetails.organizationId &&
                        formData.jobDetails.departmentId &&
                        formData.employeeTypeId
                        ? "Select category"
                        : "Complete previous fields first"
                    }
                    error={errors.categoryId}
                    disabled={
                      !formData.jobDetails.organizationId ||
                      !formData.jobDetails.departmentId ||
                      !formData.employeeTypeId
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Job Details */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                <Briefcase className="w-4 h-4 text-blue-600" />
              </div>
              Job Details
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Employee's role and work information
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Designation <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="jobDetails.designation"
                  value={formData.jobDetails.designation}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                  placeholder="Software Engineer"
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["jobDetails.designation"]
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300"
                    }`}
                />
              </div>
              {errors["jobDetails.designation"] && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors["jobDetails.designation"]}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Employment Type
              </label>
              <SimpleSelect
                value={formData.jobDetails.employmentType}
                onChange={(e) =>
                  handleSelectChange("jobDetails.employmentType", e.target.value)
                }
                options={employmentTypeOptions}
                placeholder="Select employment type"
              />
            </div>

            {/* New Job Details Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              {formData.category !== "Team Lead" && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Team Lead
                  </label>
                  <SimpleSelect
                    value={formData.jobDetails.teamLead?._id || formData.jobDetails.teamLead || ""}
                    onChange={(e) =>
                      handleSelectChange("jobDetails.teamLead", e.target.value)
                    }
                    options={employeesList}
                    placeholder="Select Team Lead"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Work Location
                </label>
                <input
                  name="jobDetails.workLocation"
                  value={formData.jobDetails.workLocation}
                  onChange={handleInputChange}
                  placeholder="Bangalore"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Role
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
                  placeholder="Select Role"
                />
              </div>
            </div>


          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              Financial Information
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Salary details, bank account information, and compliance data
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Basic Salary (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  name="salaryDetails.basicSalary"
                  type="number"
                  value={formData.salaryDetails.basicSalary}
                  onChange={handleInputChange}
                  onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                  placeholder="50000"
                  step="0.01"
                  maxLength={16}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.basicSalary"]
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300"
                    }`}
                />
              </div>
              {errors["salaryDetails.basicSalary"] && (
                <div className="flex items-center space-x-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors["salaryDetails.basicSalary"]}</span>
                </div>
              )}
            </div>
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
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    placeholder="ABCDE 1234 F"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.panNumber"]
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
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="salaryDetails.aadharNumber"
                    value={formData.salaryDetails.aadharNumber}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    placeholder="1234 5678 9012"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.aadharNumber"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
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
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="salaryDetails.bankAccount.accountNumber"
                    type="number"
                    value={formData.salaryDetails.bankAccount.accountNumber}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    placeholder="1234567890"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.bankAccount.accountNumber"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
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
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="salaryDetails.bankAccount.bankName"
                    value={formData.salaryDetails.bankAccount.bankName}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    placeholder="State Bank of India"
                    maxLength={40}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.bankAccount.bankName"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
                {errors["salaryDetails.bankAccount.bankName"] && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors["salaryDetails.bankAccount.bankName"]}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="salaryDetails.bankAccount.ifscCode"
                    value={formData.salaryDetails.bankAccount.ifscCode}
                    onChange={handleInputChange}
                    onBlur={(e) => handleBlur(e.target.name, e.target.value)}
                    placeholder="SBIN0001234"
                    maxLength={11}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.bankAccount.ifscCode"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
                {errors["salaryDetails.bankAccount.ifscCode"] && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors["salaryDetails.bankAccount.ifscCode"]}</span>
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
                  onChange={handleInputChange}
                  maxLength={30}
                  placeholder="Mumbai Central Branch"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["salaryDetails.bankAccount.branch"]
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-300"
                    }`}
                />
              </div>
            </div>
            {errors["salaryDetails.bankAccount.branch"] && (
              <div className="flex items-center space-x-1 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{errors["salaryDetails.bankAccount.branch"]}</span>
              </div>
            )}

            {/* Branch Address */}
            <div className="space-y-2 mt-4">
              <label className="block text-sm font-semibold text-slate-700">
                Branch Address
              </label>
              <input
                name="salaryDetails.bankAccount.branchAddress"
                value={formData.salaryDetails.bankAccount.branchAddress}
                onChange={handleInputChange} // Note: Using handleInputChange for salaryDetails nested field
                placeholder="123 Bank Street, City"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              />
            </div>
          </div>
        </div>
        {/* Payslip Structure */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              Salary Structure
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Configure salary components, earnings, and deductions with PT & PF
              auto-calculation
            </p>
          </div>
          <div className="p-6">
            <PayslipStructureSection
              payslipStructure={formData.payslipStructure}
              onStructureChange={handlePayslipStructureChange}
              errors={errors}
              employeeGender={formData.personalDetails.gender}
              pfApplicable={formData.pfApplicable}
              workState={formData.jobDetails.workState}
              isCompliant={formData.isCompliant}
            />
          </div>
        </div>
        {/* Additional Information & Documents */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              Additional Information & Documents
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Employee status, preferences, attendance approval, and document
              uploads
            </p>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Working Hours <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    name="workingHr"
                    type="number"
                    value={formData.workingHr}
                    onChange={handleChange}
                    placeholder="8"
                    step="0.5"
                    min="0"
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors["workingHr"]
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-300"
                      }`}
                  />
                </div>
                {errors["workingHr"] && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors["workingHr"]}</span>
                  </div>
                )}
              </div>
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
                        handleRadioChange("pfApplicable", e.target.value)
                      }
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                        handleRadioChange("pfApplicable", e.target.value)
                      }
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
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
                        handleRadioChange("esicApplicable", e.target.value)
                      }
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="esicApplicable"
                      value="no"
                      checked={formData.esicApplicable === "no"}
                      onChange={(e) =>
                        handleRadioChange("esicApplicable", e.target.value)
                      }
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
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
                      className="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
            </div>
            {/* Compliance Radio Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 pt-6 border-t border-slate-100">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Is Compliant Employee
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      value="yes"
                      checked={formData.isCompliant === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCompliant: true }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isCompliant"
                      value="no"
                      checked={formData.isCompliant === false}
                      onChange={(e) => setFormData(prev => ({ ...prev, isCompliant: false }))}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span className="text-sm text-slate-700">No</span>
                  </label>
                </div>
              </div>
              {formData.isCompliant && (
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
                        onChange={(e) => setFormData(prev => ({ ...prev, isTDSApplicable: true }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">Yes</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="isTDSApplicable"
                        value="no"
                        checked={formData.isTDSApplicable === false}
                        onChange={(e) => setFormData(prev => ({ ...prev, isTDSApplicable: false }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">No</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Supervisor Selection Section */}
            {formData.attendanceApproval.required === "yes" && (
              <div className="bg-slate-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Attendance Approval Supervisors
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  Select supervisors who will approve attendance for each shift
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        No supervisors available for this organization. Please
                        create employee profiles first before assigning
                        supervisors.
                      </p>
                    </div>
                  )}
              </div>
            )}
            {/* Document Upload Section */}
            {formData.categoryId && (
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Employee Documents
                </h3>
                <p className="text-slate-600 text-sm">
                  Upload all required documents for employee verification. Files
                  will be uploaded to Cloudinary. Required documents are marked
                  with <span className="text-red-500">*</span>
                </p>
                <DocumentUploadSection
                  uploadedFiles={uploadedFiles}
                  onFilesChange={handleFilesChange}
                  onFileRemove={handleFileRemove}
                  employeeCategory={formData.category}
                  categoryId={formData.categoryId?._id || formData.categoryId}
                />
              </div>
            )}
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || fetchLoading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Employee
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}