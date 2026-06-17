'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Filter, MoreVertical, Eye, FileText, CheckCircle, AlertCircle,
  Clock, User, Download, ChevronDown, RefreshCw, BarChart3, Settings,
  Calendar, TrendingUp, Shield, FilterX, Archive, Star
} from 'lucide-react';

export default function ComplianceReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState(null);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchComplianceReports();
  }, [debouncedSearchTerm, typeFilter, statusFilter]);

  const fetchComplianceReports = async () => {
    try {
      setLoading(!reports.length);
      setRefreshing(reports.length > 0);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (typeFilter) params.append('reportType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/v1/admin/payroll/compliance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.complianceReports || []);
      } else {
        setError(data.error || 'Failed to fetch compliance reports');
        console.error('Failed to fetch compliance reports:', data.error);
      }
    } catch (error) {
      setError('Network error occurred while fetching data');
      console.error('Error fetching compliance reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      Compliant: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle,
        dot: 'bg-green-500'
      },
      'Non-Compliant': {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertCircle,
        dot: 'bg-red-500'
      },
      'Partially Compliant': {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: Clock,
        dot: 'bg-amber-500'
      },
    };
    return statusConfig[status] || statusConfig['Partially Compliant'];
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

  const getTypeConfig = (type) => {
    const typeConfig = {
      Monthly: { bg: 'bg-slate-50', text: 'text-blue-700', border: 'border-blue-200' },
      Quarterly: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      Annual: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      'Ad-hoc': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    };
    return typeConfig[type] || typeConfig['Ad-hoc'];
  };

  const getTypeBadge = (type) => {
    const config = getTypeConfig(type);
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {type}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasActiveFilters = searchTerm || typeFilter || statusFilter;

  // Calculate analytics
  const totalReports = reports.length;
  const compliantReports = reports.filter(r => r.overallStatus === 'Compliant').length;
  const nonCompliantReports = reports.filter(r => r.overallStatus === 'Non-Compliant').length;
  const partiallyCompliantReports = reports.filter(r => r.overallStatus === 'Partially Compliant').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Loading Compliance Reports</h3>
              <p className="text-sm text-slate-600 mt-1">Please wait while we fetch regulatory data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Compliance Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Monitor regulatory compliance and generate reports</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Reports</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{totalReports}</p>
                <p className="text-xs text-slate-500 mt-1">All compliance records</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center border border-yellow-100">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Compliant</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{compliantReports}</p>
                <p className="text-xs text-slate-500 mt-1">Fully compliant</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Non-Compliant</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{nonCompliantReports}</p>
                <p className="text-xs text-slate-500 mt-1">Needs attention</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Partial Compliance</p>
                <p className="text-2xl font-bold text-slate-900 mt-2">{partiallyCompliantReports}</p>
                <p className="text-xs text-slate-500 mt-1">Under review</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-slate-900">Compliance Reports ({totalReports})</h2>
                {hasActiveFilters && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                    Filtered Results
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchComplianceReports}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>

                <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>

                <Link
                  href="/admin/payroll/compliance/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Generate Report
                </Link>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Search Reports</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by report ID, type, or period..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Types</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                  <option value="Ad-hoc">Ad-hoc</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white"
                >
                  <option value="">All Status</option>
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Partially Compliant">Partially Compliant</option>
                </select>
              </div>

              <div className="lg:col-span-2 flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('');
                      setStatusFilter('');
                    }}
                    className="w-full px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors font-medium"
                    title="Clear all filters"
                  >
                    <FilterX className="w-4 h-4 mr-2" />
                    Clear
                  </button>
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
                  <h4 className="text-sm font-semibold text-red-800">Error Loading Reports</h4>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Report Information</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Type & Period</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Compliance Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Generated Date</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center">
                          <Shield className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {hasActiveFilters ? 'No matching compliance reports' : 'No compliance reports found'}
                          </h3>
                          <p className="text-slate-500 text-sm mt-1 max-w-md">
                            {hasActiveFilters
                              ? 'Try adjusting your search criteria or filters to find the reports you\'re looking for.'
                              : 'Start by generating your first compliance report to monitor regulatory requirements.'
                            }
                          </p>
                        </div>
                        {hasActiveFilters ? (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setTypeFilter('');
                              setStatusFilter('');
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                          >
                            <FilterX className="w-4 h-4" />
                            Clear All Filters
                          </button>
                        ) : (
                          <Link
                            href="/admin/payroll/compliance/generate"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Generate First Report
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                            <FileText className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {report.reportId}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Compliance Report
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          {getTypeBadge(report.reportType)}
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDate(report.period?.from)} - {formatDate(report.period?.to)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(report.overallStatus)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(report.createdAt)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/payroll/compliance/${report._id}`}
                            className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="View detailed report"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {/* <button
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Download report"
                          >
                            <Download className="w-4 h-4" />
                          </button> */}
                          {/* <button
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}