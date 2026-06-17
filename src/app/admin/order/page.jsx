"use client";

import { useState, useEffect } from 'react';

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
  const [dashboardData, setDashboardData] = useState(null);
  const [timeRange, setTimeRange] = useState('today');
  const [isLoading, setIsLoading] = useState(true);

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
        return '✅';
      case 'rejected':
        return '❌';
      case 'info_requested':
        return '❓';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'verified':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'info_requested':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ODT Dashboard</h1>
            <p className="text-gray-600 mt-2">Order Desk Team - Performance Overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <div className="text-sm text-gray-500">
              Last updated: Just now
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Orders Pending Verification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Pending Verification</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.overview.pendingVerification}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">Ready for review</span>
              </div>
            </div>
            <div className="text-blue-600 bg-blue-100 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Priority Breakdown:</span>
              <div className="flex space-x-2">
                <span className="text-red-600 font-medium">{dashboardData.priorityBreakdown.high} High</span>
                <span className="text-yellow-600 font-medium">{dashboardData.priorityBreakdown.medium} Med</span>
                <span className="text-green-600 font-medium">{dashboardData.priorityBreakdown.low} Low</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Processed Today */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Orders Processed Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.overview.processedToday}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-600 text-sm font-medium">+12% from yesterday</span>
              </div>
            </div>
            <div className="text-green-600 bg-green-100 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium text-gray-900">
                {dashboardData.performance.currentProgress}/{dashboardData.performance.dailyTarget}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: `${(dashboardData.performance.currentProgress / dashboardData.performance.dailyTarget) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Average Processing Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.overview.avgProcessingTime}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-600 text-sm font-medium">-2 min from last week</span>
              </div>
            </div>
            <div className="text-purple-600 bg-purple-100 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Efficiency:</span>
              <span className="font-medium text-green-600">{dashboardData.performance.efficiency}</span>
            </div>
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejection Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {dashboardData.overview.rejectionRate}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-green-600 text-sm font-medium">-0.8% from average</span>
              </div>
            </div>
            <div className="text-orange-600 bg-orange-100 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m12 6l6-6m-6-6l6 6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Today:</span>
              <span className="font-medium text-gray-900">
                {dashboardData.todayStats.rejected} rejected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Today's Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Verified Orders</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{dashboardData.todayStats.verified}</span>
                <span className="text-sm text-gray-500 ml-2">orders</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Rejected Orders</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{dashboardData.todayStats.rejected}</span>
                <span className="text-sm text-gray-500 ml-2">orders</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-slate-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Info Requests</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{dashboardData.todayStats.infoRequested}</span>
                <span className="text-sm text-gray-500 ml-2">requests</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Still Pending</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gray-900">{dashboardData.todayStats.pending}</span>
                <span className="text-sm text-gray-500 ml-2">orders</span>
              </div>
            </div>
          </div>
          
          {/* Simple Progress Chart */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Today's Progress</span>
              <span>{dashboardData.performance.currentProgress}/{dashboardData.performance.dailyTarget}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(dashboardData.performance.currentProgress / dashboardData.performance.dailyTarget) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getActionIcon(activity.action)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Order {activity.orderId}
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.user} • {activity.time}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(activity.action)}`}>
                  {getActionText(activity.action)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-slate-50 transition-colors group">
            <div className="text-center">
              <div className="text-blue-600 group-hover:text-blue-700 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                Start Verifying
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.overview.pendingVerification} orders waiting
              </p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group">
            <div className="text-center">
              <div className="text-green-600 group-hover:text-green-700 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                View Verified
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.todayStats.verified} today
              </p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors group">
            <div className="text-center">
              <div className="text-red-600 group-hover:text-red-700 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">
                Rejected Orders
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {dashboardData.todayStats.rejected} today
              </p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group">
            <div className="text-center">
              <div className="text-purple-600 group-hover:text-purple-700 mb-2">
                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                Generate Report
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Daily performance
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}