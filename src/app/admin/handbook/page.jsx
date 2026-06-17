"use client";
import { useState, useEffect } from "react";
import { Plus, FileText, Download, Trash2, Search, BookOpen } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { useLanguage } from "@/context/LanguageContext";
import UploadDocumentModal from "@/components/modals/UploadDocumentModal";
import { toast } from "sonner";

export default function HandbookPage() {
    const { user } = useSession(); // Corrected destructuring
    const { t } = useLanguage();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/handbook");
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            const res = await fetch(`/api/handbook?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Document deleted");
                fetchDocuments();
            } else {
                toast.error("Failed to delete document");
            }
        } catch (error) {
            toast.error("Error deleting document");
        }
    };

    const handleViewDownload = (doc) => {
        try {
            const fileUrl = doc.fileUrl;
            if (!fileUrl) {
                toast.error("No file URL available");
                return;
            }

            if (fileUrl.startsWith("data:")) {
                const parts = fileUrl.split(",");
                const mime = parts[0].match(/:(.*?);/)[1];
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                
                if (mime === "application/pdf") {
                    window.open(blobUrl, "_blank");
                } else {
                    const a = document.createElement("a");
                    a.href = blobUrl;
                    a.download = doc.title || "document";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            } else {
                window.open(fileUrl, "_blank");
            }
        } catch (error) {
            console.error("Error viewing document:", error);
            toast.error("Error opening document");
        }
    };

    const isAdmin = user?.role === "admin" || user?.role === "hr";

    const filteredDocs = documents.filter(doc =>
        (doc?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc?.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{t("employeeHandbook")}</h1>
                    <p className="text-slate-500">{t("handbookSubtitle")}</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium hover:"
                    >
                        <Plus size={18} />
                        {t("uploadDocument")}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t("searchDocuments")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center p-10 text-slate-500">{t("loading") || "Loading..."}</div>
            ) : filteredDocs.length === 0 ? (
                <div className="text-center p-10 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                    <p>{t("noDocumentsFound")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDocs.map((doc) => (
                        <div key={doc._id} className="bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover: transition-all group p-5 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <FileText size={24} />
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(doc._id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 line-clamp-2">{doc.title}</h3>
                                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wide">{doc.category}</p>
                                <p className="text-xs text-slate-400 mt-2">Added {new Date(doc.createdAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                            </div>

                            <button
                                onClick={() => handleViewDownload(doc)}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 font-medium text-sm transition-colors"
                            >
                                <Download size={16} />
                                {t("viewDownload")}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <UploadDocumentModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => {
                    fetchDocuments();
                    toast.success("Document uploaded successfully");
                }}
                userId={user?._id}
            />
        </div>
    );
}
