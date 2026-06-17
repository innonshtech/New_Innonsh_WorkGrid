"use client";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
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
  IndianRupee,
  Percent,
  Receipt,
  Building2,
  Target,
  CalendarDays,
  BarChart,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

import toast, { Toaster } from "react-hot-toast";
import {
  validators,
  formatPhoneNumber,
  formatPanNumber,
  formatAadharNumber,
  calculateProfessionalTax,
  calculatePF,
} from "@/utils/validation";
import {
  Bar,
  Pie,
  Line,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "unifoods",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unifoods",
  folder: "employee-documents",
};

// Helper Functions from EmployeeDetail
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return "N/A";
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age--;
  }
  return age;
};

const calculateTenure = (joinDate) => {
  if (!joinDate) return "N/A";
  const today = new Date();
  const join = new Date(joinDate);
  const years = today.getFullYear() - join.getFullYear();
  const months = today.getMonth() - join.getMonth();
  let tenure = "";
  if (years > 0) tenure += `${years} year${years > 1 ? "s" : ""} `;
  if (months > 0 || years === 0)
    tenure += `${months} month${months !== 1 ? "s" : ""}`;
  return tenure.trim() || "0 months";
};

const getComputedGross = (salary) => {
  if (salary?.grossSalary) return salary.grossSalary;
  let basic = salary?.basicSalary || 0;
  let earningsTotal = (salary?.earnings || []).reduce((acc, e) => {
    if (!e.enabled) return acc;
    if (e.calculationType === 'percentage') {
      return acc + (basic * e.percentage) / 100;
    }
    return acc + (e.fixedAmount || 0);
  }, 0);
  return basic + earningsTotal;
};

const getCategoryColor = (category) => {
  const colors = {
    'Aadhar Card': 'bg-slate-50 text-blue-700 border-blue-200',
    'PAN Card': 'bg-green-50 text-green-700 border-green-200',
    'Bank Statement': 'bg-purple-50 text-purple-700 border-purple-200',
    'Salary Slip': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Driving License': 'bg-red-50 text-red-700 border-red-200',
    'Experience Letter': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Offer Letter': 'bg-pink-50 text-pink-700 border-pink-200',
    'Resume': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Other': 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return colors[category] || colors['Other'];
};

const getCategoryIcon = (category) => {
  const icons = {
    'Aadhar Card': IdCard,
    'PAN Card': CreditCard,
    'Bank Statement': Banknote,
    'Salary Slip': IndianRupee,
    'Driving License': FileText,
    'Experience Letter': Briefcase,
    'Offer Letter': Mail,
    'Resume': User,
    'Other': FileText,
  };
  return icons[category] || FileText;
};

// Reused Components from EmployeeDetail
const getStatusBadge = (status) => {
  const statusStyles = {
    Active: "bg-green-50 text-green-700 border-green-200",
    Inactive: "bg-slate-50 text-slate-700 border-slate-200",
    Suspended: "bg-yellow-50 text-yellow-700 border-yellow-200",
    Terminated: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${statusStyles[status] || "bg-slate-50 text-slate-700 border-slate-200"
        }`}
    >
      {status}
    </span>
  );
};

const TaskProgressBar = ({ tasks }) => {
  const statusCount = tasks?.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  const statusColors = {
    Completed: "bg-green-500",
    "In Progress": "bg-yellow-500",
    Pending: "bg-slate-500",
    Blocked: "bg-red-500",
    Deferred: "bg-slate-500",
  };
  const statusOrder = [
    "Completed",
    "In Progress",
    "Pending",
    "Blocked",
    "Deferred",
  ];
  return (
    <div className="mt-4">
      <div className="flex h-3 bg-slate-200 rounded-full overflow-hidden">
        {statusOrder.map((status) => {
          const count = statusCount[status] || 0;
          const percentage =
            tasks?.length > 0 ? (count / tasks?.length) * 100 : 0;
          if (count === 0) return null;
          return (
            <div
              key={status}
              className={`${statusColors[status]} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
              title={`${status}: ${count} tasks (${percentage.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>Total: {tasks?.length} tasks</span>
        <span>
          {tasks?.length > 0
            ? (
              (tasks?.filter((t) => t.status === "Completed").length /
                tasks?.length) *
              100
            ).toFixed(0)
            : 0}
          % Overall Completion
        </span>
      </div>
    </div>
  );
};

const AttendanceStatusBadge = ({ status }) => {
  const statusConfig = {
    Present: {
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    Absent: {
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertCircle,
    },
    "Half-day": {
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: Clock,
    },
    WFH: {
      color: "bg-teal-50 text-teal-700 border-teal-200",
      icon: Clock,
    },
    Leave: {
      color: "bg-slate-50 text-blue-700 border-blue-200",
      icon: Calendar,
    },
    Holiday: {
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: CalendarDays,
    },
    Weekend: {
      color: "bg-slate-50 text-slate-700 border-slate-200",
      icon: Calendar,
    },
  };
  const config = statusConfig[status] || statusConfig.Present;
  const IconComponent = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium border ${config.color}`}
    >
      <IconComponent className="w-3 h-3" />
      {status}
    </span>
  );
};

const AttendanceStatsCards = ({ attendance }) => {
  const stats = calculateAttendanceStats(attendance, "week");
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-green-700">{stats.present}</div>
        <div className="text-sm text-green-600">Present</div>
        <div className="text-xs text-green-500 mt-1">{stats.presentRate}%</div>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
        <div className="text-sm text-red-600">Absent</div>
        <div className="text-xs text-red-500 mt-1">{stats.absentRate}%</div>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-yellow-700">{stats.halfDay}</div>
        <div className="text-sm text-yellow-600">Half Day</div>
        <div className="text-xs text-yellow-500 mt-1">{stats.halfDayRate}%</div>
      </div>
      <div className="bg-slate-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-2xl font-bold text-blue-700">{stats.attendanceRate}%</div>
        <div className="text-sm text-blue-600">Overall Rate</div>
        <div
          className={`text-xs mt-1 ${stats.trend > 0
            ? "text-green-500"
            : stats.trend < 0
              ? "text-red-500"
              : "text-yellow-500"
            }`}
        >
          {stats.trend > 0 ? "↗" : stats.trend < 0 ? "↘" : "→"}{" "}
          {Math.abs(stats.trend)}%
        </div>
      </div>
    </div>
  );
};

const AttendanceDistributionChart = ({ attendance }) => {
  const statusCount = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {});
  const data = {
    labels: Object.keys(statusCount),
    datasets: [
      {
        data: Object.values(statusCount),
        backgroundColor: [
          "#10b981", // Present - green
          "#ef4444", // Absent - red
          "#f59e0b", // Half-day - yellow
          "#3b82f6", // Leave - blue
          "#8b5cf6", // Holiday - purple
          "#6b7280", // Weekend - gray
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };
  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

const calculateAttendanceStats = (attendance, period) => {
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "Present").length;
  const absent = attendance.filter((a) => a.status === "Absent").length;
  const halfDay = attendance.filter((a) => a.status === "Half-day").length;
  const leave = attendance.filter((a) => a.status === "Leave").length;
  const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentRate = total > 0 ? Math.round((absent / total) * 100) : 0;
  const halfDayRate = total > 0 ? Math.round((halfDay / total) * 100) : 0;
  const trend = presentRate > 85 ? 2 : presentRate > 70 ? 0 : -2;
  return {
    total,
    present,
    absent,
    halfDay,
    leave,
    presentRate,
    absentRate,
    halfDayRate,
    attendanceRate: presentRate,
    trend,
  };
};

// Reused Components from EmployeeEdit
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
        value={value}
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
      value={value}
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
      try {
        setLoadingDocuments(true);
        const categoryResponse = await fetch(`/api/v1/admin/crm/employeecategory/${categoryId}`);
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
                return PcCase;
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
    const IconComponent = getCategoryIcon(category.name);
    const status = getUploadStatus(category.id);
    const categoryFiles = getFilesForCategory(category.id);
    return (
      <div
        key={category.id}
        className={`border-2 border-dashed rounded-xl p-4 hover: transition- ${getCategoryColor(category.name)}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <IconComponent className="w-5 h-5" />
            <span className="font-semibold text-sm">{category.name}</span>
            {category.required && <span className="text-red-500 ml-1">*</span>}
          </div>
          {status.isComplete && (
            <CheckCircle className="w-4 h-4" />
          )}
        </div>
        <div className="space-y-2">
          <div className="text-xs text-slate-600">{category.description}</div>
          <p className="text-xs text-slate-500">
            {status.uploaded}/{category.maxFiles} files
            {category.required && (
              <span className="ml-1 text-red-500">Required</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleUploadClick(category.id)}
          disabled={uploading || status.uploaded >= category.maxFiles || !cloudinaryReady}
          className={`mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${uploading || status.uploaded >= category.maxFiles || !cloudinaryReady
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-white hover:bg-slate-50 border border-slate-300"
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
            {categoryFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-sm">{getFileIcon(file.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
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
          d.name !== "Provident Fund (Employee)"
      )
      .reduce((sum, d) => sum + calculateDeductionAmount(d), 0);
    return employeePF + pt + otherDeductions;
  };
  const calculateNetSalary = () => {
    // Use stored Gross Salary (CTC) if available, otherwise calculate from components
    const gross = payslipStructure.grossSalary || calculateTotalEarnings();
    return gross - calculateTotalDeductions();
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
          editable: false,
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
                      deduction.name === "Professional Tax" ||
                      deduction.name === "Provident Fund (Employee)"
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
                          deduction.name === "Professional Tax" ||
                          deduction.name === "Provident Fund (Employee)"
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
                          deduction.name === "Professional Tax" ||
                          deduction.name === "Provident Fund (Employee)"
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
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Gross Salary (Total Earnings)
          </h4>
          <p className="text-2xl font-bold text-green-600">
            ₹
            {(payslipStructure.grossSalary || calculateTotalEarnings()).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
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
        <div className="space-y-4">
          {pfApplicable === "yes" && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-red-600" />
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
          {payslipStructure.deductions.filter(
            (d) =>
              d.enabled &&
              d.name !== "Professional Tax" &&
              d.name !== "Provident Fund (Employee)"
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
                        d.name !== "Provident Fund (Employee)"
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
        </div>
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
                {(payslipStructure.grossSalary || calculateTotalEarnings()).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', maximumFractionDigits: 2,
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

export default function EmployeeDetail({ employeeId }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        const response = await fetch(`/api/v1/admin/payroll/employees/${employeeId}`);
        if (!response.ok) throw new Error("Failed to fetch employee details");
        const data = await response.json();
        setEmployee(data);

        // Calculate attendance stats if attendance data exists
        if (data.attendance) {
          setAttendanceStats(calculateAttendanceStats(data.attendance, 'month'));
        }
      } catch (err) {
        setError(err.message);
        toast.error("Error fetching employee details");
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId]);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/v1/admin/payroll/employees/${employeeId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete employee");
      toast.success("Employee deleted successfully");
      router.push("/admin/payroll/employees");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to delete employee");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Loading employee profile...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <Users className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Employee Not Found</h3>
        <p className="text-slate-600 mb-6">The employee details could not be retrieved.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboardComponent },
    { id: "personal", label: "Personal Info", icon: User },
    { id: "job", label: "Job & Compensation", icon: Briefcase },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "attendance", label: "Attendance", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {employee.personalDetails?.firstName?.[0]}
                    {employee.personalDetails?.lastName?.[0]}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center bg-white`}>
                    <div className={`w-3 h-3 rounded-full ${employee.status === 'Active' ? 'bg-green-500' : 'bg-slate-400'}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {employee.personalDetails?.firstName} {employee.personalDetails?.lastName}
                    </h1>
                    {employee.status === 'Active' ? (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium border border-green-200">Active</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium border border-slate-200">{employee.status}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                      <CreditCard className="w-3.5 h-3.5" />
                      {employee.employeeId}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {employee.jobDetails?.designation || "No Designation"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <a href={`mailto:${employee.personalDetails?.email}`} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      {employee.personalDetails?.email || "N/A"}
                    </a>
                    <a href={`tel:${employee.personalDetails?.phone}`} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      {employee.personalDetails?.phone || "N/A"}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start">
                <Link
                  href={`/admin/employees/${employee._id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mb-px pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap outline-none
                    ${isActive
                      ? "border-yellow-500 text-yellow-700 bg-yellow-50/50 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-yellow-600" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && <OverviewTab employee={employee} attendanceStats={attendanceStats} />}
        {activeTab === "personal" && <PersonalInfoTab employee={employee} />}
        {activeTab === "job" && <JobCompensationTab employee={employee} />}
        {activeTab === "documents" && <DocumentsTab employee={employee} />}
        {activeTab === "attendance" && <AttendanceTab employee={employee} attendanceStats={attendanceStats} />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Employee?</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete <strong>{employee.personalDetails?.firstName} {employee.personalDetails?.lastName}</strong>? This action cannot be undone and will remove all associated records.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Layout Dashboard Icon needs a fallback if not imported, but 'lucide-react' likely has it.
// To be safe let's use Grid if not available, but user has lucide-react.
const LayoutDashboardComponent = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="7" height="9" x="3" y="3" rx="1" />
    <rect width="7" height="5" x="14" y="3" rx="1" />
    <rect width="7" height="9" x="14" y="12" rx="1" />
    <rect width="7" height="5" x="3" y="16" rx="1" />
  </svg>
);

// ================= SUB-COMPONENTS FOR TABS =================

function OverviewTab({ employee, attendanceStats }) {
  const personal = employee.personalDetails || {};
  const job = employee.jobDetails || {};
  const salary = employee?.payslipStructure || {};
  const bank = employee.salaryDetails?.bankAccount || {};
  console.log(salary)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Key Status Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Current Status</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400">Employment Status</p>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${employee.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-700 border border-slate-100'
                }`}>
                <div className={`w-2 h-2 rounded-full ${employee.status === 'Active' ? 'bg-green-500' : 'bg-slate-500'}`} />
                {employee.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Employee Type</p>
              <span className="block font-medium text-slate-900 mt-1">{job.employeeType || "N/A"}</span>
            </div>
          </div>
          <div className="h-px bg-slate-100 my-4" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Join Date</p>
              <p className="font-medium text-slate-700">{formatDate(personal.dateOfJoining)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Tenure</p>
              <p className="font-medium text-slate-700">{calculateTenure(personal.dateOfJoining)}</p>
            </div>
          </div>
        </div>

        {/* Compensation Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-24 h-24 text-green-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Compensation</h3>
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs text-slate-400">Gross Salary</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(getComputedGross(salary))}</p>
              <p className="text-xs text-slate-500">per month</p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-slate-400">Basic</p>
                <p className="font-medium text-slate-700">{formatCurrency(salary.basicSalary || 0)}</p>
              </div>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">
                <CreditCard className="w-3 h-3" />
                {salary.salaryType === 'perday' ? 'Paid Daily' : 'Paid Monthly'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Contact & Bank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Quick Info</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Work Location</p>
                <p className="text-sm font-medium text-slate-700">{job.workLocation || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Department</p>
                <p className="text-sm font-medium text-slate-700">{job.department || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Banknote className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Bank Account</p>
                <p className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                  {bank.bankName ? `${bank.bankName} ••••${bank.accountNumber?.slice(-4)}` : "Not Configured"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Current Shift</p>
                <p className="text-sm font-medium text-slate-700">
                  {job.defaultShift?.name ? `${job.defaultShift.name} (${job.defaultShift.startTime} - ${job.defaultShift.endTime})` : "General"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance Mini Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Attendance Overview</h3>
            <Link href={`/payroll/attendance`} className="text-sm text-yellow-600 font-medium hover:text-yellow-700">View Detailed Report</Link>
          </div>
          {attendanceStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm text-green-600 mb-1">Present</p>
                <p className="text-2xl font-bold text-green-700">{attendanceStats.present}</p>
                <p className="text-xs text-green-600 mt-1">{attendanceStats.presentRate}% Rate</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-600 mb-1">Absent</p>
                <p className="text-2xl font-bold text-red-700">{attendanceStats.absent}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <p className="text-sm text-yellow-600 mb-1">Half Days</p>
                <p className="text-2xl font-bold text-yellow-700">{attendanceStats.halfDay}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">Leaves Taken</p>
                <p className="text-2xl font-bold text-blue-700">{attendanceStats.leave}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">No attendance data available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalInfoTab({ employee }) {
  const p = employee.personalDetails || {};
  const s = employee.salaryDetails || {};
  const bank = employee.salaryDetails?.bankAccount || {};

  const formatAddress = (address) => {
    if (!address) return "N/A";
    if (typeof address === 'string') return address;
    const { street, city, state, zipCode } = address;
    return [street, city, state, zipCode].filter(Boolean).join(", ");
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-base font-semibold text-slate-900">{value || "N/A"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Personal Information</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem icon={User} label="Full Name" value={`${p.firstName} ${p.lastName}`} />
          <InfoItem icon={Calendar} label="Date of Birth" value={`${formatDate(p.dateOfBirth)} (${calculateAge(p.dateOfBirth)} years)`} />
          <InfoItem icon={Users} label="Gender" value={p.gender} />
          <InfoItem icon={UserCheck} label="Blood Group" value={p.bloodGroup} />
          <InfoItem icon={Mail} label="Email Address" value={p.email} />
          <InfoItem icon={Phone} label="Phone Number" value={p.phone} />
          <InfoItem icon={IdCard} label="Aadhar Number" value={s.aadharNumber} />
          <InfoItem icon={CreditCard} label="PAN Number" value={s.panNumber} />
          <div className="md:col-span-2 lg:col-span-3">
            <InfoItem icon={MapPin} label="Current Address" value={formatAddress(p.address)} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <InfoItem icon={MapPin} label="Permanent Address" value={formatAddress(p.permanentAddress)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Bank Details</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoItem icon={CreditCard} label="Bank Name" value={bank.bankName} />
          <InfoItem icon={CreditCard} label="Bank Account Number" value={bank.accountNumber} />
          <InfoItem icon={CreditCard} label="IFSC Code" value={bank.ifscCode} />
          <InfoItem icon={CreditCard} label="Bank Branch" value={bank.branch} />
        </div>
      </div>
    </div>
  );
}

function JobCompensationTab({ employee }) {
  const p = employee.personalDetails || {};
  const j = employee.jobDetails || {};
  const s = employee?.payslipStructure || {};
  const bank = employee.salaryDetails?.bankAccount || {};

  const employerPFObj = s.deductions?.find(d => d.name === "Provident Fund (Employer)");
  let displayEmployerPF = 0;
  if (employerPFObj && employerPFObj.enabled) {
    displayEmployerPF = employerPFObj.calculationType === 'percentage'
      ? Math.round(((s.basicSalary || 0) * (employerPFObj.percentage || 0)) / 100)
      : (employerPFObj.fixedAmount || 0);
  } else {
    displayEmployerPF = Math.round(Math.min((s.basicSalary || 0), 15000) * 0.13);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Job Details</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
          <div>
            <p className="text-sm text-slate-500 mb-1">Designation</p>
            <p className="font-semibold text-slate-900">{j.designation || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Department</p>
            <p className="font-semibold text-slate-900">{j.department || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Reports To</p>
            <p className="font-semibold text-slate-900">
              {typeof j.reportingManager === 'object' && j.reportingManager !== null 
                ? `${j.reportingManager.personalDetails?.firstName || ''} ${j.reportingManager.personalDetails?.lastName || ''}` 
                : (j.reportingManager || "N/A")}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Joining Date</p>
            <p className="font-semibold text-slate-900">{formatDate(p.dateOfJoining)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Work Location</p>
            <p className="font-semibold text-slate-900">{j.workLocation || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Shift Timing</p>
            <p className="font-semibold text-slate-900">
              {j.defaultShift?.name ? `${j.defaultShift.name} (${j.defaultShift.startTime} - ${j.defaultShift.endTime})` : (j.shiftTiming || "General")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Salary Structure</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white">
                <p className="text-slate-400 text-sm mb-1">Total Gross Salary</p>
                <p className="text-3xl font-bold">₹{getComputedGross(s).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Basic Pay</span>
                    <span className="font-medium">₹{s.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-xl">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-slate-500" />
                  Bank Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank</span>
                    <span className="font-medium">{bank.bankName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account</span>
                    <span className="font-medium">{bank.accountNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC</span>
                    <span className="font-medium">{bank.ifscCode || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border border-slate-200 rounded-xl mt-4">
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                Statutory Benefits
              </h4>
              <div className="space-y-2 text-sm">
                {employee.gratuityApplicable === 'yes' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gratuity (Prov.)</span>
                    <span className="font-medium text-green-600">
                      ₹{Math.round(((s.basicSalary || 0) * 15 / 26) / 12).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                      <span className="text-xs text-slate-400 ml-1">/mo</span>
                    </span>
                  </div>
                )}
                {employee.pfApplicable === 'yes' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">PF (Employer)</span>
                    <span className="font-medium">
                      ₹{displayEmployerPF.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                )}
                {employee.esicApplicable === 'yes' && (getComputedGross(s) <= 21000) && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">ESIC (Employer)</span>
                    <span className="font-medium">
                      ₹{Math.ceil((getComputedGross(s) || 0) * 0.0325).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                    </span>
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-400 border-t border-slate-100 pt-2">
                  * Employer contributions are over and above Gross Salary (CTC components)
                </div>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Earnings */}
            <div>
              <h4 className="text-sm font-bold text-green-700 uppercase tracking-wide mb-3">Earnings</h4>
              <div className="bg-green-50/50 rounded-xl border border-green-100 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-green-100">
                      <td className="py-2 px-3 text-slate-600">Basic Salary</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">₹{s.basicSalary?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</td>
                    </tr>
                    {s.earnings?.filter(e => e.enabled).map((e, i) => (
                      <tr key={i} className="border-b border-green-100 last:border-0">
                        <td className="py-2 px-3 text-slate-600">{e.name}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {e.calculationType === 'percentage' ? `${e.percentage}%` : `₹${e.fixedAmount}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">Deductions</h4>
              <div className="bg-red-50/50 rounded-xl border border-red-100 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {s.deductions?.filter(d => d.enabled && !d.name.toLowerCase().includes("(employer)")).map((d, i) => (
                      <tr key={i} className="border-b border-red-100 last:border-0">
                        <td className="py-2 px-3 text-slate-600">{d.name}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {d.calculationType === 'percentage' ? `${d.percentage}%` : `₹${d.fixedAmount}`}
                        </td>
                      </tr>
                    ))}
                    {(!s.deductions || s.deductions.filter(d => d.enabled && !d.name.toLowerCase().includes("(employer)")).length === 0) && (
                      <tr><td colSpan="2" className="py-4 text-center text-slate-400 italic">No Deductions</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab({ employee }) {

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">Employee Documents</h3>
        <p className="text-sm text-slate-500">Manage and view documents for {employee.personalDetails?.firstName}.</p>
      </div>
      <div className="p-6">
        <DocumentUploadSection
          uploadedFiles={employee.documents || []}
          onFilesChange={() => { }} // Read-only view here mostly
          onFileRemove={() => { }}
          employeeCategory={employee.jobDetails?.employeeCategory}
          categoryId={employee.jobDetails?.employeeCategory}
        />

        {(!employee.documents || employee.documents.length === 0) && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-medium">No Documents Uploaded</h3>
            <p className="text-slate-500 text-sm mt-1">Hasn't uploaded any documents yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceTab({ employee, attendanceStats }) {
  const attendance = employee.attendance || [];

  if (attendance.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-slate-900 font-medium">No Attendance Records</h3>
        <p className="text-slate-500 text-sm mt-1">Attendance data will appear here once recorded.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Statistics</h3>
        <AttendanceStatsCards attendance={attendance} />
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Distribution</h4>
          <AttendanceDistributionChart attendance={attendance} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Recent Attendance Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Check In</th>
                <th className="px-6 py-3 font-medium">Check Out</th>
                <th className="px-6 py-3 font-medium">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.slice(0, 10).map((record, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 text-slate-900 font-medium">{formatDate(record.date)}</td>
                  <td className="px-6 py-3"><AttendanceStatusBadge status={record.status} /></td>
                  <td className="px-6 py-3 text-slate-600">{record.checkIn || "--:--"}</td>
                  <td className="px-6 py-3 text-slate-600">{record.checkOut || "--:--"}</td>
                  <td className="px-6 py-3 text-slate-600">{record.workHours ? `${record.workHours}h` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
