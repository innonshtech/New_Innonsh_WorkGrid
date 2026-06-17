"use client";

import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockTeamMembers = [
  { id: 'user1', name: 'You', role: 'Senior Verifier', avatar: '👤' },
  { id: 'user2', name: 'Sarah Chen', role: 'Verification Specialist', avatar: '💁' },
  { id: 'user3', name: 'Mike Ross', role: 'Junior Verifier', avatar: '👨‍💼' },
  { id: 'user4', name: 'Lisa Wang', role: 'Team Lead', avatar: '👩‍💼' }
];

const mockVerificationHistory = [
  {
    id: 'ACT-001',
    orderId: 'ORD-015',
    action: 'verified',
    verifier: 'You',
    timestamp: '2025-01-15 14:30:25',
    processingTime: '8 min',
    customer: 'John Doe',
    company: 'ABC Corp',
    total: 1250.00,
    priority: 'high',
    notes: 'Urgent order - expedited processing'
  },
  {
    id: 'ACT-002',
    orderId: 'ORD-014',
    action: 'verified',
    verifier: 'Sarah Chen',
    timestamp: '2025-01-15 14:15:10',
    processingTime: '12 min',
    customer: 'Sarah Wilson',
    company: 'Global Enterprises',
    total: 3200.00,
    priority: 'high',
    notes: 'All documents verified'
  },
  {
    id: 'ACT-003',
    orderId: 'ORD-013',
    action: 'info_requested',
    verifier: 'Mike Ross',
    timestamp: '2025-01-15 13:45:30',
    processingTime: '5 min',
    customer: 'Mike Johnson',
    company: 'Tech Solutions Inc',
    total: 2100.75,
    priority: 'medium',
    notes: 'Requested additional company documents'
  },
  {
    id: 'ACT-004',
    orderId: 'ORD-012',
    action: 'rejected',
    verifier: 'You',
    timestamp: '2025-01-15 13:20:15',
    processingTime: '6 min',
    customer: 'Jane Smith',
    company: 'XYZ Ltd',
    total: 850.50,
    priority: 'medium',
    notes: 'Incomplete order information'
  },
  {
    id: 'ACT-005',
    orderId: 'ORD-011',
    action: 'verified',
    verifier: 'Lisa Wang',
    timestamp: '2025-01-15 12:55:40',
    processingTime: '7 min',
    customer: 'Robert Brown',
    company: 'Innovate Tech',
    total: 1750.00,
    priority: 'low',
    notes: 'Standard verification'
  },
  {
    id: 'ACT-006',
    orderId: 'ORD-010',
    action: 'verified',
    verifier: 'You',
    timestamp: '2025-01-15 11:30:20',
    processingTime: '9 min',
    customer: 'Emily Davis',
    company: 'Creative Solutions',
    total: 950.00,
    priority: 'medium',
    notes: 'Quick verification - all good'
  },
  {
    id: 'ACT-007',
    orderId: 'ORD-009',
    action: 'verified',
    verifier: 'Sarah Chen',
    timestamp: '2025-01-15 10:45:15',
    processingTime: '11 min',
    customer: 'David Kim',
    company: 'Tech Innovators',
    total: 2800.00,
    priority: 'high',
    notes: 'Complex order - required additional checks'
  },
  {
    id: 'ACT-008',
    orderId: 'ORD-008',
    action: 'rejected',
    verifier: 'Mike Ross',
    timestamp: '2025-01-15 10:20:30',
    processingTime: '4 min',
    customer: 'Anna Lopez',
    company: 'StartUp Co',
    total: 1200.00,
    priority: 'medium',
    notes: 'Invalid payment method'
  }
];

const mockPerformanceStats = {
  personal: {
    verifiedToday: 12,
    avgProcessingTime: '8.2 min',
    efficiency: '96%',
    rejectionRate: '2.1%',
    totalVerified: 45
  },
  team: {
    totalVerified: 128,
    avgProcessingTime: '9.8 min',
    teamEfficiency: '92%',
    totalRejected: 8,
    totalInfoRequests: 5
  },
  trends: {
    dailyAverage: 25,
    weeklyTotal: 175,
    monthlyTotal: 680
  }
};

export default function HistoryReports() {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filters, setFilters] = useState({
    verifier: 'all',
    action: 'all',
    dateRange: 'today',
    priority: 'all'
  });
  const [selectedReport, setSelectedReport] = useState('activity');
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API calls
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHistory(mockVerificationHistory);
      setFilteredHistory(mockVerificationHistory);
      setPerformanceStats(mockPerformanceStats);
      setTeamMembers(mockTeamMembers);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [filters, history]);

  const filterHistory = () => {
    let filtered = [...history];

    // Filter by verifier
    if (filters.verifier !== 'all') {
      filtered = filtered.filter(item =>
        filters.verifier === 'you' ? item.verifier === 'You' : item.verifier === filters.verifier
      );
    }

    // Filter by action
    if (filters.action !== 'all') {
      filtered = filtered.filter(item => item.action === filters.action);
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(item => item.priority === filters.priority);
    }

    // Filter by date range (simplified)
    if (filters.dateRange === 'today') {
      filtered = filtered.filter(item => item.timestamp.includes('2025-01-15'));
    }

    setFilteredHistory(filtered);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'verified':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'info_requested':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'verified':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'info_requested':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'info_requested':
        return 'Info Requested';
      default:
        return 'Processed';
    }
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-lg border ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' });
  };

  const handleExportReport = async (type) => {
    setIsExporting(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`${type} report exported successfully!`);
    setIsExporting(false);
  };

  const getVerifierStats = (verifierName) => {
    const userHistory = history.filter(item => item.verifier === verifierName);
    const verified = userHistory.filter(item => item.action === 'verified').length;
    const rejected = userHistory.filter(item => item.action === 'rejected').length;
    const infoRequests = userHistory.filter(item => item.action === 'info_requested').length;
    const total = userHistory.length;

    return {
      verified,
      rejected,
      infoRequests,
      total,
      efficiency: total > 0 ? Math.round((verified / total) * 100) : 0
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">
            Loading reports data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  History & Reports
                </h1>
                <p className="text-slate-600">
                  Track personal and team verification activity
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleExportReport('CSV')}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={() => handleExportReport('PDF')}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'activity', label: 'Activity History', icon: FileText },
                { id: 'performance', label: 'Performance Metrics', icon: TrendingUp },
                { id: 'team', label: 'Team Overview', icon: Users },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${selectedReport === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity History Report */}
        {selectedReport === 'activity' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                      <Filter className="w-4 h-4 text-blue-600" />
                    </div>
                    Activity Filters
                  </h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Filter verification activity records
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <button
                    onClick={() => setFilters({ verifier: 'all', action: 'all', dateRange: 'today', priority: 'all' })}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Verifier</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={filters.verifier}
                    onChange={(e) => setFilters(prev => ({ ...prev, verifier: e.target.value }))}
                  >
                    <option value="all">All Verifiers</option>
                    <option value="you">You</option>
                    {teamMembers
                      .filter(member => member.name !== 'You')
                      .map(member => (
                        <option key={member.id} value={member.name}>{member.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  >
                    <option value="all">All Actions</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="info_requested">Info Requested</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                  <select
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-slate-900">Verification Activity History</h2>
                  <span className="text-sm text-slate-500">
                    {filteredHistory.length} records found
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order & Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Verifier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Customer & Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Processing Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredHistory.map((activity) => {
                      const ActionIcon = getActionIcon(activity.action);
                      return (
                        <tr key={activity.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="text-sm font-semibold text-blue-600">{activity.orderId}</div>
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(activity.action).split(' ')[0]}`}>
                                  <ActionIcon className="w-4 h-4" />
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getActionColor(activity.action)}`}>
                                  {getActionText(activity.action)}
                                </span>
                              </div>
                              <div>{getPriorityBadge(activity.priority)}</div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900">{activity.verifier}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {formatTimestamp(activity.timestamp)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-slate-900">{activity.customer}</div>
                            <div className="text-sm text-slate-500">{activity.company}</div>
                            <div className="text-sm font-semibold text-slate-900 mt-1">
                              ${activity.total.toFixed(2)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <div className="text-sm">
                                <div className="font-medium text-slate-900">{activity.processingTime}</div>
                                <div className="text-xs text-slate-500">Processing Time</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600 max-w-xs">
                              {activity.notes}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredHistory.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No activity found</h3>
                    <p className="text-slate-500">No verification activity matches your current filters.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Performance Metrics Report */}
        {selectedReport === 'performance' && performanceStats && (
          <div className="space-y-8">
            {/* Personal Performance */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                Your Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Verified Today</p>
                      <p className="text-2xl font-bold text-blue-700">{performanceStats.personal.verifiedToday}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Avg Processing Time</p>
                      <p className="text-2xl font-bold text-green-700">{performanceStats.personal.avgProcessingTime}</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Efficiency Rate</p>
                      <p className="text-2xl font-bold text-purple-700">{performanceStats.personal.efficiency}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Rejection Rate</p>
                      <p className="text-2xl font-bold text-orange-700">{performanceStats.personal.rejectionRate}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">Total Verified</p>
                      <p className="text-2xl font-bold text-indigo-700">{performanceStats.personal.totalVerified}</p>
                    </div>
                    <Target className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <Users className="w-4 h-4 text-slate-600" />
                </div>
                Team Performance Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Team Total Verified</p>
                      <p className="text-2xl font-bold text-slate-700">{performanceStats.team.totalVerified}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Team Avg Time</p>
                      <p className="text-2xl font-bold text-slate-700">{performanceStats.team.avgProcessingTime}</p>
                    </div>
                    <Clock className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Team Efficiency</p>
                      <p className="text-2xl font-bold text-slate-700">{performanceStats.team.teamEfficiency}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Rejected</p>
                      <p className="text-2xl font-bold text-slate-700">{performanceStats.team.totalRejected}</p>
                    </div>
                    <XCircle className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trends */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                Performance Trends
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border border-slate-200 rounded-xl hover: transition-">
                  <div className="text-3xl font-bold text-blue-600">{performanceStats.trends.dailyAverage}</div>
                  <div className="text-lg text-slate-700 font-medium mt-2">Daily Average</div>
                  <div className="text-sm text-slate-500 mt-2">Orders processed per day</div>
                </div>
                <div className="text-center p-6 border border-slate-200 rounded-xl hover: transition-">
                  <div className="text-3xl font-bold text-green-600">{performanceStats.trends.weeklyTotal}</div>
                  <div className="text-lg text-slate-700 font-medium mt-2">Weekly Total</div>
                  <div className="text-sm text-slate-500 mt-2">This week's performance</div>
                </div>
                <div className="text-center p-6 border border-slate-200 rounded-xl hover: transition-">
                  <div className="text-3xl font-bold text-purple-600">{performanceStats.trends.monthlyTotal}</div>
                  <div className="text-lg text-slate-700 font-medium mt-2">Monthly Total</div>
                  <div className="text-sm text-slate-500 mt-2">This month's performance</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Overview Report */}
        {selectedReport === 'team' && (
          <div className="space-y-8">
            {/* Team Members Performance */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  Team Member Performance
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {teamMembers.map((member) => {
                    const stats = getVerifierStats(member.name);
                    return (
                      <div key={member.id} className="border border-slate-200 rounded-xl p-4 hover: transition-">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-lg">{member.avatar}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-sm text-slate-500">{member.role}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-bold text-green-600">{stats.verified}</div>
                            <div className="text-green-700">Verified</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="font-bold text-red-600">{stats.rejected}</div>
                            <div className="text-red-700">Rejected</div>
                          </div>
                          <div className="text-center p-2 bg-slate-50 rounded-lg border border-blue-200">
                            <div className="font-bold text-blue-600">{stats.infoRequests}</div>
                            <div className="text-blue-700">Info Req</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="font-bold text-purple-600">{stats.efficiency}%</div>
                            <div className="text-purple-700">Efficiency</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Team Activity Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                </div>
                Team Activity Summary
              </h2>
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const stats = getVerifierStats(member.name);
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600">{member.avatar}</span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{member.name}</div>
                          <div className="text-sm text-slate-500">{member.role}</div>
                        </div>
                      </div>
                      <div className="flex space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-slate-900">{stats.total}</div>
                          <div className="text-slate-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-600">{stats.verified}</div>
                          <div className="text-slate-500">Verified</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-600">{stats.rejected}</div>
                          <div className="text-slate-500">Rejected</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-blue-600">{stats.infoRequests}</div>
                          <div className="text-slate-500">Info Requests</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}