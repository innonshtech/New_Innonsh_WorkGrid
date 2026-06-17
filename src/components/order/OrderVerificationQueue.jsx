"use client";

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  Building,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';

// Mock data - replace with actual API calls
const initialOrders = [
  {
    id: 'ORD-001',
    customer: 'John Doe',
    company: 'ABC Corp',
    orderDate: '2025-01-15',
    dueDate: '2025-01-20',
    total: 1250.00,
    items: 3,
    status: 'pending',
    priority: 'high',
    itemsList: [
      { name: 'Laptop Dell XPS 15', quantity: 1, price: 1200 },
      { name: 'Mouse Wireless', quantity: 2, price: 25 }
    ],
    shippingAddress: '123 Main St, New York, NY 10001',
    specialInstructions: 'Contact before delivery'
  },
  {
    id: 'ORD-002',
    customer: 'Jane Smith',
    company: 'XYZ Ltd',
    orderDate: '2025-01-15',
    dueDate: '2025-01-22',
    total: 850.50,
    items: 2,
    status: 'pending',
    priority: 'medium',
    itemsList: [
      { name: 'Monitor 24"', quantity: 2, price: 425.25 }
    ],
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90210',
    specialInstructions: ''
  },
  {
    id: 'ORD-003',
    customer: 'Mike Johnson',
    company: 'Tech Solutions Inc',
    orderDate: '2025-01-14',
    dueDate: '2025-01-25',
    total: 2100.75,
    items: 5,
    status: 'pending',
    priority: 'low',
    itemsList: [
      { name: 'Server Rack', quantity: 1, price: 1500 },
      { name: 'Network Switch', quantity: 2, price: 250.375 },
      { name: 'Cables', quantity: 10, price: 5 }
    ],
    shippingAddress: '789 Tech Park, Austin, TX 73301',
    specialInstructions: 'Ground floor delivery only'
  },
  {
    id: 'ORD-004',
    customer: 'Sarah Wilson',
    company: 'Global Enterprises',
    orderDate: '2025-01-15',
    dueDate: '2025-01-18',
    total: 3200.00,
    items: 1,
    status: 'pending',
    priority: 'high',
    itemsList: [
      { name: 'Industrial Printer', quantity: 1, price: 3200 }
    ],
    shippingAddress: '321 Business Rd, Chicago, IL 60601',
    specialInstructions: 'URGENT - Call upon arrival'
  }
];

export default function OrderVerificationQueue() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    search: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(initialOrders);
      setFilteredOrders(initialOrders);
      calculateStats(initialOrders);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filters, orders]);

  const calculateStats = (ordersList) => {
    const high = ordersList.filter(order => order.priority === 'high').length;
    const medium = ordersList.filter(order => order.priority === 'medium').length;
    const low = ordersList.filter(order => order.priority === 'low').length;
    
    setStats({
      total: ordersList.length,
      highPriority: high,
      mediumPriority: medium,
      lowPriority: low
    });
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    if (filters.priority !== 'all') {
      filtered = filtered.filter(order => order.priority === filters.priority);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.toLowerCase().includes(searchLower) ||
        order.company.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredOrders(filtered);
  };

  const handleVerifyOrder = (orderId) => {
    if (confirm('Are you sure you want to verify and accept this order?')) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      // In real app, you would make an API call here
      console.log(`Order ${orderId} verified and sent to ART`);
    }
  };

  const handleRejectOrder = (orderId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (reason) {
      setOrders(prev => prev.filter(order => order.id !== orderId));
      // In real app, you would make an API call here
      console.log(`Order ${orderId} rejected. Reason: ${reason}`);
    }
  };

  const handleRequestInfo = (order) => {
    setSelectedOrderForAction(order);
    setIsRequestInfoModalOpen(true);
  };

  const submitInfoRequest = () => {
    if (requestMessage.trim()) {
      // In real app, you would make an API call here
      console.log(`Info requested for order ${selectedOrderForAction.id}: ${requestMessage}`);
      setOrders(prev => prev.filter(order => order.id !== selectedOrderForAction.id));
      setRequestMessage('');
      setIsRequestInfoModalOpen(false);
      setSelectedOrderForAction(null);
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-lg border ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span className="inline-flex items-center px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">
            Loading orders...
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
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Order Verification Queue
                </h1>
                <p className="text-slate-600">
                  Step 1: Verify new orders placed by customers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
              <div className="text-sm text-slate-600">Orders Pending</div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Medium Priority</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.mediumPriority}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Low Priority</p>
                  <p className="text-2xl font-bold text-green-600">{stats.lowPriority}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total in Queue</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Filter className="w-6 h-6 text-blue-600" />
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
                Filter Orders
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Search and filter orders for verification
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer, or Company..."
                  className="w-80 pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>

              {/* Priority Filter */}
              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">Orders Awaiting Verification</h2>
              <span className="text-sm text-slate-500">
                {filteredOrders.length} orders found
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
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount & Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="text-lg font-semibold text-blue-600 hover:text-blue-900 text-left flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          {order.id}
                        </button>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Building className="w-4 h-4" />
                          {order.company}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <User className="w-4 h-4" />
                          {order.customer}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 max-w-xs">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{order.shippingAddress}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium">Ordered: {order.orderDate}</div>
                            <div className="text-slate-500">Due: {order.dueDate}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-slate-900">${order.total.toFixed(2)}</div>
                        <div className="text-slate-500">{order.items} items</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {getStatusBadge(order.status)}
                        {getPriorityBadge(order.priority)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleVerifyOrder(order.id)}
                          className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept & Verify
                        </button>
                        <button
                          onClick={() => handleRequestInfo(order)}
                          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Request More Info
                        </button>
                        <button
                          onClick={() => handleRejectOrder(order.id)}
                          className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Order
                        </button>
                      </div>
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
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
                <p className="text-slate-500">
                  {orders.length === 0 
                    ? "All orders have been processed. Great work!" 
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
                    Order Details - {selectedOrder.id}
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Customer Name</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedOrder.customer}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Company</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedOrder.company}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Shipping Address</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedOrder.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Order Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Order Date</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedOrder.orderDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Due Date</label>
                        <p className="text-sm text-slate-900 mt-1">{selectedOrder.dueDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Priority</label>
                        <div className="mt-1">{getPriorityBadge(selectedOrder.priority)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
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

                {/* Special Instructions */}
                {selectedOrder.specialInstructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      Special Instructions
                    </h4>
                    <p className="text-sm text-yellow-800">{selectedOrder.specialInstructions}</p>
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
                    handleVerifyOrder(selectedOrder.id);
                    setIsDetailModalOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept & Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Info Modal */}
        {isRequestInfoModalOpen && selectedOrderForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  Request More Information
                </h3>
                <p className="text-sm text-slate-600 mt-1">Order {selectedOrderForAction.id}</p>
              </div>
              
              <div className="p-6">
                <label htmlFor="requestMessage" className="block text-sm font-medium text-slate-700 mb-2">
                  What information do you need from the customer?
                </label>
                <textarea
                  id="requestMessage"
                  rows="4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  placeholder="Please specify what additional information you need..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setIsRequestInfoModalOpen(false);
                    setRequestMessage('');
                    setSelectedOrderForAction(null);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitInfoRequest}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={!requestMessage.trim()}
                >
                  <AlertCircle className="w-4 h-4" />
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}