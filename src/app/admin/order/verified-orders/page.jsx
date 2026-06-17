"use client";

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Eye,
  Loader2,
  ArrowRight,
  Package,
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockVerifiedOrders = [
  {
    id: 'ORD-015',
    customer: 'John Doe',
    company: 'ABC Corp',
    orderDate: '2025-01-15',
    verifiedDate: '2025-01-15',
    verifiedBy: 'You',
    verificationTime: '2 min ago',
    total: 1250.00,
    items: 3,
    priority: 'high',
    nextStep: 'Awaiting ART Verification',
    status: 'verified',
    itemsList: [
      { name: 'Laptop Dell XPS 15', quantity: 1, price: 1200 },
      { name: 'Mouse Wireless', quantity: 2, price: 25 }
    ],
    processingTime: '8 minutes',
    notes: 'Urgent order - expedited verification'
  },
  {
    id: 'ORD-014',
    customer: 'Sarah Wilson',
    company: 'Global Enterprises',
    orderDate: '2025-01-15',
    verifiedDate: '2025-01-15',
    verifiedBy: 'Sarah Chen',
    verificationTime: '15 min ago',
    total: 3200.00,
    items: 1,
    priority: 'high',
    nextStep: 'Awaiting ART Verification',
    status: 'verified',
    itemsList: [
      { name: 'Industrial Printer', quantity: 1, price: 3200 }
    ],
    processingTime: '12 minutes',
    notes: 'Customer provided all required documents'
  },
  {
    id: 'ORD-013',
    customer: 'Mike Johnson',
    company: 'Tech Solutions Inc',
    orderDate: '2025-01-14',
    verifiedDate: '2025-01-15',
    verifiedBy: 'Mike Ross',
    verificationTime: '1 hour ago',
    total: 2100.75,
    items: 5,
    priority: 'medium',
    nextStep: 'Under ART Review',
    status: 'in_review',
    itemsList: [
      { name: 'Server Rack', quantity: 1, price: 1500 },
      { name: 'Network Switch', quantity: 2, price: 250.375 },
      { name: 'Cables', quantity: 10, price: 5 }
    ],
    processingTime: '15 minutes',
    notes: ''
  },
  {
    id: 'ORD-012',
    customer: 'Jane Smith',
    company: 'XYZ Ltd',
    orderDate: '2025-01-14',
    verifiedDate: '2025-01-14',
    verifiedBy: 'You',
    verificationTime: '2 hours ago',
    total: 850.50,
    items: 2,
    priority: 'medium',
    nextStep: 'ART Verified - Ready for SCM',
    status: 'art_approved',
    itemsList: [
      { name: 'Monitor 24"', quantity: 2, price: 425.25 }
    ],
    processingTime: '10 minutes',
    notes: 'Standard verification process'
  },
  {
    id: 'ORD-011',
    customer: 'Robert Brown',
    company: 'Innovate Tech',
    orderDate: '2025-01-14',
    verifiedDate: '2025-01-14',
    verifiedBy: 'Lisa Wang',
    verificationTime: '3 hours ago',
    total: 1750.00,
    items: 4,
    priority: 'low',
    nextStep: 'Awaiting ART Verification',
    status: 'verified',
    itemsList: [
      { name: 'Tablet Samsung', quantity: 2, price: 500 },
      { name: 'Keyboard', quantity: 2, price: 375 }
    ],
    processingTime: '7 minutes',
    notes: ''
  },
  {
    id: 'ORD-010',
    customer: 'Emily Davis',
    company: 'Creative Solutions',
    orderDate: '2025-01-13',
    verifiedDate: '2025-01-13',
    verifiedBy: 'You',
    verificationTime: '1 day ago',
    total: 950.00,
    items: 3,
    priority: 'medium',
    nextStep: 'ART Approved',
    status: 'art_approved',
    itemsList: [
      { name: 'Webcam HD', quantity: 3, price: 316.67 }
    ],
    processingTime: '9 minutes',
    notes: 'Quick verification - all documents in order'
  }
];

export default function VerifiedOrders() {
  const [verifiedOrders, setVerifiedOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    verifiedBy: 'all',
    timeRange: 'today'
  });
  const [stats, setStats] = useState({
    total: 0,
    awaitingART: 0,
    underReview: 0,
    artApproved: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerifiedOrders(mockVerifiedOrders);
      setFilteredOrders(mockVerifiedOrders);
      calculateStats(mockVerifiedOrders);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filters, verifiedOrders]);

  const calculateStats = (ordersList) => {
    const awaitingART = ordersList.filter(order => order.nextStep.includes('Awaiting ART')).length;
    const underReview = ordersList.filter(order => order.nextStep.includes('Under ART Review')).length;
    const artApproved = ordersList.filter(order => order.nextStep.includes('ART Approved') || order.nextStep.includes('Ready for SCM')).length;

    setStats({
      total: ordersList.length,
      awaitingART,
      underReview,
      artApproved
    });
  };

  const filterOrders = () => {
    let filtered = [...verifiedOrders];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filter by verified by
    if (filters.verifiedBy !== 'all') {
      filtered = filtered.filter(order => order.verifiedBy === (filters.verifiedBy === 'you' ? 'You' : filters.verifiedBy));
    }

    // Filter by time range
    if (filters.timeRange === 'today') {
      filtered = filtered.filter(order => order.verifiedDate === '2025-01-15');
    } else if (filters.timeRange === 'yesterday') {
      filtered = filtered.filter(order => order.verifiedDate === '2025-01-14');
    }

    setFilteredOrders(filtered);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'bg-blue-100 text-blue-700 border-blue-200', text: 'ODT Verified', icon: CheckCircle },
      in_review: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', text: 'Under ART Review', icon: Clock },
      art_approved: { color: 'bg-green-100 text-green-700 border-green-200', text: 'ART Approved', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.verified;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border ${config.color}`}>
        <IconComponent className="w-4 h-4" />
        {config.text}
      </span>
    );
  };

  const getNextStepBadge = (nextStep) => {
    const stepConfig = {
      'Awaiting ART Verification': { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
      'Under ART Review': { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: AlertCircle },
      'ART Verified - Ready for SCM': { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      'ART Approved': { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle }
    };

    const config = stepConfig[nextStep] || stepConfig['Awaiting ART Verification'];
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border ${config.color}`}>
        <IconComponent className="w-4 h-4" />
        {nextStep}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-lg border ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getUniqueVerifiers = () => {
    const verifiers = [...new Set(verifiedOrders.map(order => order.verifiedBy))];
    return verifiers;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">
            Loading verified orders...
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
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Verified Orders
                </h1>
                <p className="text-slate-600">
                  Orders processed by ODT team and their current status
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Verified</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Verified</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-xs text-slate-500 mt-1">All time</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Awaiting ART</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.awaitingART}</p>
                  <p className="text-xs text-slate-500 mt-1">Next step</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Under ART Review</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.underReview}</p>
                  <p className="text-xs text-slate-500 mt-1">In progress</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">ART Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.artApproved}</p>
                  <p className="text-xs text-slate-500 mt-1">Completed</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                  <Filter className="w-4 h-4 text-blue-600" />
                </div>
                Filter Verified Orders
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Filter orders by status, verifier, and time range
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Statuses</option>
                <option value="verified">ODT Verified</option>
                <option value="in_review">Under ART Review</option>
                <option value="art_approved">ART Approved</option>
              </select>

              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={filters.verifiedBy}
                onChange={(e) => setFilters(prev => ({ ...prev, verifiedBy: e.target.value }))}
              >
                <option value="all">All Verifiers</option>
                <option value="you">You</option>
                {getUniqueVerifiers()
                  .filter(verifier => verifier !== 'You')
                  .map(verifier => (
                    <option key={verifier} value={verifier}>{verifier}</option>
                  ))
                }
              </select>

              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                value={filters.timeRange}
                onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
              </select>

              <button
                onClick={() => setFilters({ status: 'all', verifiedBy: 'all', timeRange: 'all' })}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Verified Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Verified Orders History</h2>
              <span className="text-sm text-slate-500">
                Showing {filteredOrders.length} of {verifiedOrders.length} orders
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Verification Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount & Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Current Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Next Step
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => openOrderDetails(order)}
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="text-lg font-semibold text-blue-600 hover:text-blue-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {order.id}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <User className="w-4 h-4" />
                          {order.customer}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Building className="w-4 h-4" />
                          {order.company}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Ordered: {order.orderDate}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <User className="w-4 h-4" />
                          {order.verifiedBy}
                        </div>
                        <div className="text-sm text-slate-500">{order.verificationTime}</div>
                        <div className="text-xs text-slate-400">
                          Verified: {order.verifiedDate}
                        </div>
                        <div className="text-xs text-green-600 font-medium flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          Processed in: {order.processingTime}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-slate-900">${order.total.toFixed(2)}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {order.items} items
                        </div>
                        <div className="mt-1">
                          {getPriorityBadge(order.priority)}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="px-6 py-4">
                      {getNextStepBadge(order.nextStep)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No verified orders found</h3>
                <p className="text-slate-500">
                  {verifiedOrders.length === 0
                    ? "No orders have been verified yet."
                    : "No orders match your current filters."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal */}
        {isDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Order Verification Details - {selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <AlertCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Order Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Customer:</span>
                        <span className="text-sm text-slate-900">{selectedOrder.customer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Company:</span>
                        <span className="text-sm text-slate-900">{selectedOrder.company}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Order Date:</span>
                        <span className="text-sm text-slate-900">{selectedOrder.orderDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Priority:</span>
                        <span className="text-sm text-slate-900 capitalize">{selectedOrder.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      Verification Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Verified By:</span>
                        <span className="text-sm text-slate-900">{selectedOrder.verifiedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Verified Date:</span>
                        <span className="text-sm text-slate-900">{selectedOrder.verifiedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Processing Time:</span>
                        <span className="text-sm text-green-600 font-medium">{selectedOrder.processingTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-600">Current Status:</span>
                        <div>{getStatusBadge(selectedOrder.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Step */}
                <div className="bg-slate-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <ArrowRight className="w-5 h-5" />
                    Next Step in Workflow
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-blue-900 font-medium">{selectedOrder.nextStep}</div>
                        <div className="text-blue-700 text-sm">
                          {selectedOrder.nextStep.includes('Awaiting')
                            ? 'Waiting for ART team to process this order'
                            : selectedOrder.nextStep.includes('Under Review')
                              ? 'Currently being reviewed by ART team'
                              : 'Ready for next processing stage'}
                        </div>
                      </div>
                    </div>
                    {getNextStepBadge(selectedOrder.nextStep)}
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    Order Items
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {selectedOrder.itemsList.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm text-slate-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-900">{item.quantity}</td>
                            <td className="px-6 py-4 text-sm text-slate-900">${item.price.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm text-slate-900">${(item.quantity * item.price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100">
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-sm font-medium text-slate-900 text-right">Total:</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">${selectedOrder.total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-indigo-600" />
                      Verification Notes
                    </h4>
                    <p className="text-sm text-indigo-800">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Add action for tracking or follow-up
                    console.log('Track order:', selectedOrder.id);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Track Progress
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}