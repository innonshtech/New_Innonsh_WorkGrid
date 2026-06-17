"use client";
import React, { useState, useEffect } from "react";
import {
    IdCard,
    CreditCard,
    Banknote,
    Car,
    Shield,
    DollarSign,
    Briefcase as Case,
    GraduationCap,
    FileText,
    CheckCircle,
    Eye,
    Trash2,
    AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

const CLOUDINARY_CONFIG = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "unifoods",
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unifoods",
    folder: "employee-documents",
};

export default function DocumentUploadSection({
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
                const categoryResponse = await fetch(`/api/v1/admin/crm/employeecategory/${typeof categoryId === 'object' ? categoryId._id : categoryId}`);
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
