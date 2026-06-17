'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  Clock,
  PieChart,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  LineChart,
  Calculator,
  CalendarDays,
  History,
  XCircle,
  RefreshCw,
  Settings,

  Zap
} from 'lucide-react';

// Aging Bucket Component
function AgingBucket({ title, amount, count, color, percentage, trend }) {
  return (
    <div className={`group bg-white rounded-xl border ${color.replace('text-', 'border-')}200 p-6 hover: transition-all duration-200 ${color.replace('text-', 'bg-')}50 hover:scale-105`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-')}50 border ${color.replace('text-', 'border-')}200`}>
          <Calendar className={`h-6 w-6 ${color}`} />
        </div>
        <div className="flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <ArrowUp className="h-3 w-3 text-red-600" />
          ) : (
            <ArrowDown className="h-3 w-3 text-green-600" />
          )}
          <span className={`font-medium ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {Math.abs(trend)}%
          </span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
          ₹{amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
        </p>
        <p className="text-xs text-slate-500 mt-1">{count} invoices • {percentage}%</p>
      </div>
    </div>
  );
}

// Credit Days Monitoring Component
function CreditDaysMonitor({ customers, timeRange }) {
  const [creditDaysData, setCreditDaysData] = useState({
    overallAverage: 0,
    trend: 0,
    industryBenchmark: 45,
    bestPerformer: null,
    worstPerformer: null,
    distribution: [],
    monthlyTrend: []
  });

  useEffect(() => {
    // Calculate credit days metrics
    if (customers.length > 0) {
      const overallAverage = customers.reduce((sum, c) => sum + c.avgPaymentDays, 0) / customers.length;

      // Calculate trend (simplified)
      const previousAverage = overallAverage * 0.95; // Mock previous period
      const trend = ((overallAverage - previousAverage) / previousAverage) * 100;
      // Find best and worst performers
      const bestPerformer = customers.reduce((best, current) =>
        current.avgPaymentDays < best.avgPaymentDays ? current : best
      );
      const worstPerformer = customers.reduce((worst, current) =>
        current.avgPaymentDays > worst.avgPaymentDays ? current : worst
      );
      // Distribution by ranges
      const distribution = [
        { range: '0-30 days', count: customers.filter(c => c.avgPaymentDays <= 30).length, color: 'bg-green-500' },
        { range: '31-45 days', count: customers.filter(c => c.avgPaymentDays > 30 && c.avgPaymentDays <= 45).length, color: 'bg-slate-500' },
        { range: '46-60 days', count: customers.filter(c => c.avgPaymentDays > 45 && c.avgPaymentDays <= 60).length, color: 'bg-yellow-500' },
        { range: '60+ days', count: customers.filter(c => c.avgPaymentDays > 60).length, color: 'bg-red-500' }
      ];
      // Monthly trend data (mock)
      const monthlyTrend = [
        { month: 'Jan', average: 42, target: 45 },
        { month: 'Feb', average: 41, target: 44 },
        { month: 'Mar', average: 43, target: 43 },
        { month: 'Apr', average: 40, target: 42 },
        { month: 'May', average: 38, target: 41 },
        { month: 'Jun', average: 37, target: 40 }
      ];
      setCreditDaysData({
        overallAverage,
        trend,
        industryBenchmark: 45,
        bestPerformer,
        worstPerformer,
        distribution,
        monthlyTrend
      });
    }
  }, [customers, timeRange]);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            Credit Days Metrics
          </h2>
          <p className="text-slate-600 text-sm mt-1">Key indicators for payment performance</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="group bg-white rounded-xl border border-blue-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {creditDaysData.trend > 0 ? (
                    <ArrowUp className="h-3 w-3 text-red-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-green-600" />
                  )}
                  <span className={`font-medium ${creditDaysData.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(creditDaysData.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Average Credit Days</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                  {creditDaysData.overallAverage.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-xl border border-purple-200 p-6 hover: transition-all duration-200 bg-purple-50 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <ArrowDown className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-green-600">-5%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Industry Benchmark</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                  {creditDaysData.industryBenchmark}
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-xl border border-green-200 p-6 hover: transition-all duration-200 bg-green-50 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="font-medium text-green-600">+12%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Best Performer</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors truncate">
                  {creditDaysData.bestPerformer?.name || '-'}
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-xl border border-red-200 p-6 hover: transition-all duration-200 bg-red-50 hover:scale-105">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3 w-3 text-red-600" />
                  <span className="font-medium text-red-600">+8%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Needs Improvement</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors truncate">
                  {creditDaysData.worstPerformer?.name || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                <PieChart className="w-4 h-4 text-green-600" />
              </div>
              Credit Days Distribution
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {creditDaysData.distribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.range}</span>
                    <span className="font-medium">
                      {item.count} customers ({(item.count / customers.length * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${(item.count / customers.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                <LineChart className="w-4 h-4 text-purple-600" />
              </div>
              Monthly Trend vs Target
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {creditDaysData.monthlyTrend.map((month, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{month.month}</span>
                    <div className="flex gap-4">
                      <span className="font-medium">Actual: {month.average} days</span>
                      <span className="text-slate-500">Target: {month.target} days</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 relative">
                    <div
                      className="h-3 rounded-full bg-slate-500 absolute"
                      style={{ width: `${(month.average / 60) * 100}%` }}
                    ></div>
                    <div
                      className="h-3 rounded-full border-2 border-purple-500 absolute"
                      style={{ width: `${(month.target / 60) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Performance</span>
                    <span className={month.average <= month.target ? 'text-green-600' : 'text-red-600'}>
                      {month.average <= month.target ? '✓ Meeting Target' : '✗ Above Target'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
            Customer Credit Days Performance
          </h2>
          <p className="text-slate-600 text-sm mt-1">Sorted by payment efficiency</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {customers
              .sort((a, b) => a.avgPaymentDays - b.avgPaymentDays)
              .map((customer, index) => (
                <div key={customer.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${customer.avgPaymentDays <= 30 ? 'bg-green-100 text-green-600' :
                    customer.avgPaymentDays <= 45 ? 'bg-blue-100 text-blue-600' :
                      customer.avgPaymentDays <= 60 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{customer.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Credit Terms: {customer.paymentTerms} days •
                      Utilization: {((customer.totalOutstanding / customer.creditLimit) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${customer.avgPaymentDays <= customer.paymentTerms ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {customer.avgPaymentDays} days
                    </p>
                    <p className="text-xs text-slate-500">
                      {customer.avgPaymentDays <= customer.paymentTerms ? 'Within Terms' : 'Over Terms'}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Customer Aging Detail Component
function CustomerAgingDetail({ customer, onClose }) {
  const agingData = [
    { period: 'Current', amount: customer.currentAmount, color: 'bg-green-500' },
    { period: '1-30 Days', amount: customer.aging1to30, color: 'bg-slate-500' },
    { period: '31-60 Days', amount: customer.aging31to60, color: 'bg-yellow-500' },
    { period: '61-90 Days', amount: customer.aging61to90, color: 'bg-orange-500' },
    { period: '90+ Days', amount: customer.aging90Plus, color: 'bg-red-500' }
  ];
  const creditDaysAnalysis = {
    currentPerformance: customer.avgPaymentDays,
    paymentTerms: customer.paymentTerms,
    variance: customer.avgPaymentDays - customer.paymentTerms,
    efficiency: ((customer.paymentTerms / customer.avgPaymentDays) * 100).toFixed(1),
    trend: -2.3 // Mock trend data
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Total Outstanding</label>
            <p className="text-2xl font-bold text-slate-900">₹{customer.totalOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Credit Limit</label>
            <p className="text-xl font-semibold text-slate-900">₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Utilization</label>
            <p className="text-2xl font-bold text-slate-900">
              {((customer.totalOutstanding / customer.creditLimit) * 100).toFixed(1)}%
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Avg Payment Days</label>
            <p className="text-xl font-semibold text-slate-900">{customer.avgPaymentDays} days</p>
          </div>
        </div>
      </div>

      {/* Credit Days Analysis */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="font-medium text-slate-900 mb-3">Credit Days Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-600">Current</p>
            <p className="text-lg font-bold text-slate-900">{creditDaysAnalysis.currentPerformance} days</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Terms</p>
            <p className="text-lg font-bold text-slate-900">{creditDaysAnalysis.paymentTerms} days</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Variance</p>
            <p className={`text-lg font-bold ${creditDaysAnalysis.variance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {creditDaysAnalysis.variance > 0 ? '+' : ''}{creditDaysAnalysis.variance} days
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Efficiency</p>
            <p className="text-lg font-bold text-slate-900">{creditDaysAnalysis.efficiency}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Aging Breakdown</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {agingData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.period}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{
                        width: `${(item.amount / customer.totalOutstanding) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-20 text-right">
                    ₹{item.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recent Invoices</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {customer.recentInvoices?.map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">{invoice.invoiceNo}</p>
                  <p className="text-xs text-slate-500">Due: {invoice.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">₹{invoice.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                  <p className={`text-xs ${invoice.status === 'Overdue' ? 'text-red-600' :
                    invoice.status === 'Paid' ? 'text-green-600' : 'text-slate-500'
                    }`}>
                    {invoice.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function PerformanceIndexPage() {
  const [customers, setCustomers] = useState([]);
  const [agingSummary, setAgingSummary] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');

  // Sample data initialization
  useEffect(() => {
    // Mock customers data with aging breakdown - Updated to 2025
    const mockCustomers = [
      {
        id: 1,
        name: 'Tech Solutions Inc.',
        creditLimit: 500000,
        totalOutstanding: 375000,
        currentAmount: 150000,
        aging1to30: 125000,
        aging31to60: 75000,
        aging61to90: 25000,
        aging90Plus: 0,
        avgPaymentDays: 28,
        paymentTerms: 30,
        riskLevel: 'Low',
        paymentPerformance: 95,
        recentInvoices: [
          { invoiceNo: 'INV-001', amount: 50000, dueDate: '2025-12-15', status: 'Current' },
          { invoiceNo: 'INV-002', amount: 75000, dueDate: '2025-11-30', status: 'Current' },
          { invoiceNo: 'INV-003', amount: 25000, dueDate: '2025-11-15', status: 'Paid' }
        ]
      },
      {
        id: 2,
        name: 'Global Manufacturing Ltd.',
        creditLimit: 300000,
        totalOutstanding: 285000,
        currentAmount: 80000,
        aging1to30: 95000,
        aging31to60: 60000,
        aging61to90: 35000,
        aging90Plus: 15000,
        avgPaymentDays: 45,
        paymentTerms: 30,
        riskLevel: 'High',
        paymentPerformance: 65,
        recentInvoices: [
          { invoiceNo: 'INV-004', amount: 15000, dueDate: '2025-09-30', status: 'Overdue' },
          { invoiceNo: 'INV-005', amount: 35000, dueDate: '2025-10-15', status: 'Overdue' },
          { invoiceNo: 'INV-006', amount: 80000, dueDate: '2025-12-28', status: 'Current' }
        ]
      },
      {
        id: 3,
        name: 'Retail Chain Partners',
        creditLimit: 750000,
        totalOutstanding: 420000,
        currentAmount: 200000,
        aging1to30: 120000,
        aging31to60: 80000,
        aging61to90: 20000,
        aging90Plus: 0,
        avgPaymentDays: 32,
        paymentTerms: 45,
        riskLevel: 'Medium',
        paymentPerformance: 82,
        recentInvoices: [
          { invoiceNo: 'INV-007', amount: 120000, dueDate: '2025-12-20', status: 'Current' },
          { invoiceNo: 'INV-008', amount: 80000, dueDate: '2025-11-25', status: 'Current' },
          { invoiceNo: 'INV-009', amount: 20000, dueDate: '2025-10-30', status: 'Overdue' }
        ]
      },
      {
        id: 4,
        name: 'Service Providers Co.',
        creditLimit: 200000,
        totalOutstanding: 185000,
        currentAmount: 45000,
        aging1to30: 60000,
        aging31to60: 40000,
        aging61to90: 30000,
        aging90Plus: 10000,
        avgPaymentDays: 52,
        paymentTerms: 30,
        riskLevel: 'High',
        paymentPerformance: 58,
        recentInvoices: [
          { invoiceNo: 'INV-010', amount: 10000, dueDate: '2025-08-15', status: 'Overdue' },
          { invoiceNo: 'INV-011', amount: 30000, dueDate: '2025-09-30', status: 'Overdue' },
          { invoiceNo: 'INV-012', amount: 45000, dueDate: '2025-12-10', status: 'Current' }
        ]
      },
      {
        id: 5,
        name: 'Innovation Labs',
        creditLimit: 400000,
        totalOutstanding: 156000,
        currentAmount: 90000,
        aging1to30: 46000,
        aging31to60: 20000,
        aging61to90: 0,
        aging90Plus: 0,
        avgPaymentDays: 25,
        paymentTerms: 30,
        riskLevel: 'Low',
        paymentPerformance: 98,
        recentInvoices: [
          { invoiceNo: 'INV-013', amount: 90000, dueDate: '2025-12-28', status: 'Current' },
          { invoiceNo: 'INV-014', amount: 46000, dueDate: '2025-11-31', status: 'Current' },
          { invoiceNo: 'INV-015', amount: 20000, dueDate: '2025-10-20', status: 'Paid' }
        ]
      }
    ];
    setCustomers(mockCustomers);

    // Calculate aging summary
    const summary = {
      current: mockCustomers.reduce((sum, c) => sum + c.currentAmount, 0),
      aging1to30: mockCustomers.reduce((sum, c) => sum + c.aging1to30, 0),
      aging31to60: mockCustomers.reduce((sum, c) => sum + c.aging31to60, 0),
      aging61to90: mockCustomers.reduce((sum, c) => sum + c.aging61to90, 0),
      aging90Plus: mockCustomers.reduce((sum, c) => sum + c.aging90Plus, 0),
      totalOutstanding: mockCustomers.reduce((sum, c) => sum + c.totalOutstanding, 0)
    };
    setAgingSummary(summary);
  }, []);

  // Calculate statistics
  const totalOutstanding = agingSummary.totalOutstanding || 0;
  const averageAging = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.avgPaymentDays, 0) / customers.length
    : 0;

  const highRiskCustomers = customers.filter(c => c.riskLevel === 'High').length;
  const totalCustomers = customers.length;

  const agingBuckets = [
    {
      title: 'Current',
      amount: agingSummary.current || 0,
      count: customers.filter(c => c.currentAmount > 0).length,
      color: 'text-green-600',
      percentage: totalOutstanding > 0 ? ((agingSummary.current / totalOutstanding) * 100) : 0,
      trend: -2.5
    },
    {
      title: '1-30 Days',
      amount: agingSummary.aging1to30 || 0,
      count: customers.filter(c => c.aging1to30 > 0).length,
      color: 'text-blue-600',
      percentage: totalOutstanding > 0 ? ((agingSummary.aging1to30 / totalOutstanding) * 100) : 0,
      trend: 1.2
    },
    {
      title: '31-60 Days',
      amount: agingSummary.aging31to60 || 0,
      count: customers.filter(c => c.aging31to60 > 0).length,
      color: 'text-yellow-600',
      percentage: totalOutstanding > 0 ? ((agingSummary.aging31to60 / totalOutstanding) * 100) : 0,
      trend: 3.8
    },
    {
      title: '61-90 Days',
      amount: agingSummary.aging61to90 || 0,
      count: customers.filter(c => c.aging61to90 > 0).length,
      color: 'text-orange-600',
      percentage: totalOutstanding > 0 ? ((agingSummary.aging61to90 / totalOutstanding) * 100) : 0,
      trend: 0.5
    },
    {
      title: '90+ Days',
      amount: agingSummary.aging90Plus || 0,
      count: customers.filter(c => c.aging90Plus > 0).length,
      color: 'text-red-600',
      percentage: totalOutstanding > 0 ? ((agingSummary.aging90Plus / totalOutstanding) * 100) : 0,
      trend: -1.2
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterRisk === 'all' || customer.riskLevel.toLowerCase() === filterRisk.toLowerCase())
  );

  const getRiskBadge = (riskLevel) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (riskLevel) {
      case 'Low':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'Medium':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'High':
        return `${baseClasses} bg-red-100 text-red-700`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700`;
    }
  };

  const getPerformanceBadge = (performance) => {
    if (performance >= 90) return 'bg-green-100 text-green-700';
    if (performance >= 75) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-[#FB9D00] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Performance Index Dashboard</h1>
                <p className="text-slate-600 text-sm mt-0.5">Track outstanding payments and credit days</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-slate-600 hover:text-[#FB9D00] hover:bg-[#FB9D00]/10 rounded-lg transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              {/* <button className="p-2.5 text-slate-600 hover:text-[#FB9D00] hover:bg-[#FB9D00]/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button> */}

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              Key Performance Indicators
            </h2>
            <p className="text-slate-600 text-sm mt-1">Real-time metrics for AR performance</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white rounded-xl border border-blue-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">+5%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    ₹{totalOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              </div>

              <div className="group bg-white rounded-xl border border-orange-200 p-6 hover: transition-all duration-200 bg-orange-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <ArrowDown className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">-2%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Average Credit Days</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {averageAging.toFixed(1)} days
                  </p>
                </div>
              </div>

              <div className="group bg-white rounded-xl border border-red-200 p-6 hover: transition-all duration-200 bg-red-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-red-600" />
                    <span className="font-medium text-red-600">+3</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">High Risk Accounts</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {highRiskCustomers}
                  </p>
                </div>
              </div>

              <div className="group bg-white rounded-xl border border-green-200 p-6 hover: transition-all duration-200 bg-green-50 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="font-medium text-green-600">+1</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Total Customers</p>
                  <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                    {totalCustomers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Aging Overview', icon: BarChart3 },
                { id: 'creditDays', label: 'Credit Days Monitor', icon: CalendarDays },
                { id: 'customers', label: 'Customer Details', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: Activity },
                { id: 'trends', label: 'Trend Analysis', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-[#FB9D00] text-[#FB9D00]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Aging Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Aging Buckets */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                        <Calendar className="w-4 h-4 text-[#FB9D00]" />
                      </div>
                      Aging Buckets
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {agingBuckets.map((bucket, index) => (
                        <AgingBucket
                          key={index}
                          title={bucket.title}
                          amount={bucket.amount}
                          count={bucket.count}
                          color={bucket.color}
                          percentage={bucket.percentage}
                          trend={bucket.trend}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Aging Distribution Chart */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <PieChart className="w-4 h-4 text-blue-600" />
                      </div>
                      Aging Distribution
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {agingBuckets.map((bucket, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{bucket.title}</span>
                            <span className="font-medium">
                              ₹{bucket.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })} ({bucket.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${bucket.color.replace('text-', 'bg-')}`}
                              style={{ width: `${bucket.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                          <AlertTriangle className="w-4 h-4 text-purple-600" />
                        </div>
                        Risk Distribution
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {['Low', 'Medium', 'High'].map(risk => {
                          const count = customers.filter(c => c.riskLevel === risk).length;
                          const percentage = (count / customers.length) * 100;
                          return (
                            <div key={risk} className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">{risk} Risk</span>
                              <div className="flex items-center gap-3">
                                <div className="w-20 bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${risk === 'Low' ? 'bg-green-500' :
                                      risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-900 w-8">
                                  {count}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                          <Users className="w-4 h-4 text-red-600" />
                        </div>
                        Top Accounts by Aging
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {customers
                          .sort((a, b) => (b.aging61to90 + b.aging90Plus) - (a.aging61to90 + a.aging90Plus))
                          .slice(0, 5)
                          .map(customer => (
                            <div key={customer.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${customer.riskLevel === 'Low' ? 'bg-green-100 text-green-600' :
                                customer.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                                }`}>
                                <Users className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900 text-sm">{customer.name}</h4>
                                <p className="text-xs text-slate-600 mt-1">
                                  {customer.avgPaymentDays} avg days • {((customer.totalOutstanding / customer.creditLimit) * 100).toFixed(1)}% utilization
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-900">
                                  ₹{(customer.aging61to90 + customer.aging90Plus).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                                <p className="text-xs text-red-600">90+ Days Aging</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Days Monitor Tab */}
            {activeTab === 'creditDays' && (
              <CreditDaysMonitor customers={customers} timeRange={timeRange} />
            )}

            {/* Customer Details Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Customer Aging Details</h2>
                    <p className="text-slate-600 text-sm">Detailed breakdown of outstanding amounts by aging period</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search customers..."
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
                      value={filterRisk}
                      onChange={(e) => setFilterRisk(e.target.value)}
                    >
                      <option value="all">All Risks</option>
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="high">High Risk</option>
                    </select>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Total Outstanding
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Avg Credit Days
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Payment Terms
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Variance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredCustomers.map((customer) => {
                        const variance = customer.avgPaymentDays - customer.paymentTerms;
                        return (
                          <tr key={customer.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                                <p className="text-sm text-slate-500">
                                  Limit: ₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              ₹{customer.totalOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${customer.avgPaymentDays <= customer.paymentTerms ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {customer.avgPaymentDays} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {customer.paymentTerms} days
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variance <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {variance > 0 ? '+' : ''}{variance} days
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getRiskBadge(customer.riskLevel)}>
                                {customer.riskLevel}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setSelectedCustomer(customer)}
                                className="flex items-center gap-1 text-[#FB9D00] hover:text-[#E68A00]"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Payment Performance */}
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        Payment Performance
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {customers
                          .sort((a, b) => b.paymentPerformance - a.paymentPerformance)
                          .map(customer => (
                            <div key={customer.id} className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 truncate flex-1">{customer.name}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${customer.paymentPerformance >= 90 ? 'bg-green-500' :
                                      customer.paymentPerformance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                    style={{ width: `${customer.paymentPerformance}%` }}
                                  ></div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceBadge(customer.paymentPerformance)}`}>
                                  {customer.paymentPerformance}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Aging Concentration */}
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        Aging Concentration
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {[
                          { label: 'Low Risk (0-30 days)', value: agingSummary.current + agingSummary.aging1to30, color: 'bg-green-500' },
                          { label: 'Medium Risk (31-60 days)', value: agingSummary.aging31to60, color: 'bg-yellow-500' },
                          { label: 'High Risk (61-90 days)', value: agingSummary.aging61to90, color: 'bg-orange-500' },
                          { label: 'Critical Risk (90+ days)', value: agingSummary.aging90Plus, color: 'bg-red-500' }
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">{item.label}</span>
                              <span className="font-medium">₹{item.value.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${(item.value / totalOutstanding) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Segmentation */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      Customer Segmentation by Risk
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['Low', 'Medium', 'High'].map(risk => {
                        const segmentCustomers = customers.filter(c => c.riskLevel === risk);
                        const totalSegmentOutstanding = segmentCustomers.reduce((sum, c) => sum + c.totalOutstanding, 0);

                        return (
                          <div key={risk} className="text-center p-4 border border-slate-200 rounded-lg">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${risk === 'Low' ? 'bg-green-100' :
                              risk === 'Medium' ? 'bg-yellow-100' : 'bg-red-100'
                              }`}>
                              <Users className={`h-6 w-6 ${risk === 'Low' ? 'text-green-600' :
                                risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                                }`} />
                            </div>
                            <h4 className="font-semibold text-slate-900 mt-2">{risk} Risk</h4>
                            <p className="text-2xl font-bold text-slate-900 mt-1">
                              {segmentCustomers.length}
                            </p>
                            <p className="text-sm text-slate-600">Customers</p>
                            <p className="text-lg font-semibold text-slate-900 mt-2">
                              ₹{totalSegmentOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </p>
                            <p className="text-sm text-slate-600">Total Outstanding</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Aging Trend */}
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        Aging Trend (Last 6 Months)
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {agingBuckets.map((bucket, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{bucket.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-900">
                                ₹{bucket.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </span>
                              {bucket.trend > 0 ? (
                                <ArrowUp className="h-4 w-4 text-red-600" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-green-600" />
                              )}
                              <span className={`text-sm ${bucket.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {Math.abs(bucket.trend)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Collection Effectiveness */}
                  <div className="bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        Collection Effectiveness
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Current Collection Rate</span>
                          <span className="text-sm font-medium text-green-600">78.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Aging Reduction Target</span>
                          <span className="text-sm font-medium text-blue-600">-15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">High Risk Reduction</span>
                          <span className="text-sm font-medium text-red-600">-8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Activity className="w-4 h-4 text-indigo-600" />
                      </div>
                      Key Performance Indicators
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900">DSO</h4>
                        <p className="text-2xl font-bold text-slate-900">42.3</p>
                        <p className="text-sm text-slate-600">Days</p>
                      </div>
                      <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <Activity className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900">Collection Rate</h4>
                        <p className="text-2xl font-bold text-slate-900">78.5%</p>
                        <p className="text-sm text-slate-600">Efficiency</p>
                      </div>
                      <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <TrendingDown className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900">Bad Debt %</h4>
                        <p className="text-2xl font-bold text-slate-900">2.1%</p>
                        <p className="text-sm text-slate-600">of Total</p>
                      </div>
                      <div className="text-center p-4 border border-slate-200 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-slate-900">On-Time Payment</h4>
                        <p className="text-2xl font-bold text-slate-900">67.8%</p>
                        <p className="text-sm text-slate-600">Customers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#FB9D00]" />
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedCustomer.name} - Aging Analysis
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-slate-500"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <CustomerAgingDetail
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
              />
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}