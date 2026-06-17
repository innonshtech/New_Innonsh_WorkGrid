"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Users,
  BarChart3,
  Plus,
  Search,
  Loader2,
  User,
  TrendingUp,
  Target,
  FileText,
  AlertCircle,
  ChevronDown,
  Filter,
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockDashboardData = {
  overview: {
    pendingVerification: 24,
    processedToday: 18,
    avgProcessingTime: '12 min',
    rejectionRate: '3.2%'
  },
  priorityBreakdown: {
    high: 8,
    medium: 12,
    low: 4
  },
  todayStats: {
    verified: 15,
    rejected: 2,
    infoRequested: 1,
    pending: 6
  },
  recentActivity: [
    { id: 1, orderId: 'ORD-015', action: 'verified', user: 'You', time: '2 min ago' },
    { id: 2, orderId: 'ORD-014', action: 'rejected', user: 'Sarah Chen', time: '5 min ago' },
    { id: 3, orderId: 'ORD-013', action: 'info_requested', user: 'Mike Ross', time: '12 min ago' },
    { id: 4, orderId: 'ORD-012', action: 'verified', user: 'You', time: '18 min ago' },
    { id: 5, orderId: 'ORD-011', action: 'verified', user: 'Lisa Wang', time: '25 min ago' }
  ],
  performance: {
    dailyTarget: 25,
    currentProgress: 18,
    weeklyAverage: 22,
    efficiency: '94%'
  },
  trends: {
    daily: [18, 22, 15, 20, 17, 25, 19],
    weekly: [120, 135, 110, 125, 140, 130, 118]
  }
};

export default function ODTDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Simulate API call
    const fetchDashboardData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(mockDashboardData);
      setIsLoading(false);
    };

    fetchDashboardData();
  }, [timeRange]);

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

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">
            Loading dashboard data...
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
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  ODT Dashboard
                </h1>
                <p className="text-slate-600">
                  Order Desk Team - Performance Overview
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium">
                <Upload className="w-4 h-4" />
                Import
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2.5 text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors font-medium">
                <Plus className="w-4 h-4" />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Orders Pending Verification */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Orders Pending Verification
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {dashboardData.overview.pendingVerification}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Ready for review
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Priority:</span>
                  <div className="flex space-x-2">
                    <span className="text-red-600 font-medium">{dashboardData.priorityBreakdown.high} High</span>
                    <span className="text-indigo-600 font-medium">{dashboardData.priorityBreakdown.medium} Med</span>
                    <span className="text-green-600 font-medium">{dashboardData.priorityBreakdown.low} Low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Processed Today */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Orders Processed Today
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {dashboardData.overview.processedToday}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    +12% from yesterday
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Target:</span>
                  <span className="font-medium text-slate-900">
                    {dashboardData.performance.currentProgress}/{dashboardData.performance.dailyTarget}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(dashboardData.performance.currentProgress / dashboardData.performance.dailyTarget) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Average Processing Time */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Avg Processing Time
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {dashboardData.overview.avgProcessingTime}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    -2 min from last week
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Efficiency:</span>
                  <span className="font-medium text-green-600">{dashboardData.performance.efficiency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Rate */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Rejection Rate
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {dashboardData.overview.rejectionRate}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    -0.8% from average
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Today:</span>
                  <span className="font-medium text-slate-900">
                    {dashboardData.todayStats.rejected} rejected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="bg-white rounded-xl border border-slate-200 mb-8 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                Performance Overview
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Real-time order processing metrics and analytics
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

              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Second Row - Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Activity Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-700">Verified Orders</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{dashboardData.todayStats.verified}</span>
                    <span className="text-sm text-slate-500 ml-2">orders</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-700">Rejected Orders</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{dashboardData.todayStats.rejected}</span>
                    <span className="text-sm text-slate-500 ml-2">orders</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-slate-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-700">Info Requests</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{dashboardData.todayStats.infoRequested}</span>
                    <span className="text-sm text-slate-500 ml-2">requests</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-slate-400 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-700">Still Pending</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">{dashboardData.todayStats.pending}</span>
                    <span className="text-sm text-slate-500 ml-2">orders</span>
                  </div>
                </div>
              </div>

              {/* Progress Chart */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Today's Progress</span>
                  <span>{dashboardData.performance.currentProgress}/{dashboardData.performance.dailyTarget}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${(dashboardData.performance.currentProgress / dashboardData.performance.dailyTarget) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => {
                  const ActionIcon = getActionIcon(activity.action);
                  return (
                    <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(activity.action).split(' ')[0]}`}>
                          <ActionIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            Order {activity.orderId}
                          </div>
                          <div className="text-xs text-slate-500">
                            {activity.user} • {activity.time}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getActionColor(activity.action)}`}>
                        {getActionText(activity.action)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Target className="w-3 h-3 text-indigo-600" />
              </div>
              Quick Actions
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              Common order processing tasks
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-blue-300 hover:bg-slate-50 transition-all group">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-medium text-slate-900">
                  Start Verifying
                </span>
                <span className="text-sm text-slate-600 mt-1">
                  {dashboardData.overview.pendingVerification} orders waiting
                </span>
              </button>

              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-slate-900">
                  View Verified
                </span>
                <span className="text-sm text-slate-600 mt-1">
                  {dashboardData.todayStats.verified} today
                </span>
              </button>

              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <span className="font-medium text-slate-900">
                  Rejected Orders
                </span>
                <span className="text-sm text-slate-600 mt-1">
                  {dashboardData.todayStats.rejected} today
                </span>
              </button>

              <button className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-slate-900">
                  Generate Report
                </span>
                <span className="text-sm text-slate-600 mt-1">
                  Daily performance
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}