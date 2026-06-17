"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Calendar,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast, Toaster } from "react-hot-toast";

export default function EmployeeLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedAction !== "all") params.append("action", selectedAction);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/v1/admin/payroll/logs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.logs || []);
        if (data.pagination) {
          setPagination({
            total: data.pagination.total,
            pages: data.pagination.pages,
          });
        }
      } else {
        toast.error("Failed to fetch logs");
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Error loading logs");
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, currentPage, sortBy, debouncedSearch, selectedAction, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionIcon = (action) => {
    switch (action) {
      case "created":
        return <Plus className="w-4 h-4" />;
      case "updated":
        return <Edit className="w-4 h-4" />;
      case "deleted":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case "created":
        return "bg-green-100 text-green-700 border-green-200";
      case "updated":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "deleted":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportLogs = () => {
    const csvContent = [
      [
        "Date & Time",
        "Action",
        "Entity",
        "Description",
        "Performed By",
        "IP Address",
      ],
      ...logs.map((log) => [
        formatDate(log.createdAt),
        log.action,
        log.entity,
        `"${log.description}"`, // Quote description to handle commas
        `${log.performedBy?.name || "System"} ${log.performedBy?.role ? `(${log.performedBy.role})` : ""}`,
        log.ipAddress,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Logs exported successfully!");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-indigo-500 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  System Activity Logs
                </h1>
                <p className="text-slate-600 text-sm mt-0.5">
                  Track all application events, updates, and user actions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={exportLogs}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-900">Filters</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-600 transition-transform ${showFilters ? "rotate-180" : ""
                  }`}
              />
            </button>
          </div>

          {showFilters && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search description, user..."
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Action Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => {
                      setSelectedAction(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Actions</option>
                    <option value="created">Created</option>
                    <option value="updated">Updated</option>
                    <option value="deleted">Deleted</option>
                    <option value="generated">Generated</option>
                    <option value="login">Login</option>
                  </select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="space-y-2 flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedAction("all");
                      setDateFrom("");
                      setDateTo("");
                      setSortBy("newest");
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">
                Activity Logs ({pagination.total})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">No logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Performed By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logs.map((log) => (
                      <tr
                        key={log._id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-slate-900">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(
                              log.action
                            )}`}
                          >
                            {getActionIcon(log.action)}
                            {log.action.charAt(0).toUpperCase() +
                              log.action.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {log.description}
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <details className="mt-1">
                              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">View Details</summary>
                              <pre className="mt-1 text-xs bg-slate-100 p-2 rounded overflow-auto max-w-xs">{JSON.stringify(log.details, null, 2)}</pre>
                            </details>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                              {log.performedBy?.name || "System"}
                              {log.performedBy?.role && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                  {log.performedBy.role}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {log.performedBy?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">
                            {log.ipAddress || "-"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, pagination.total)} of{" "}
                      {pagination.total} logs
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="px-3 py-2 text-sm text-slate-600 font-medium">
                          Page {currentPage} of {pagination.pages}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))
                        }
                        disabled={currentPage === pagination.pages}
                        className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}