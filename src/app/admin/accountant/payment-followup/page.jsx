'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Download,
  Upload,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  BarChart3,
  Settings,
  Eye,
  Plus,
  Edit,
  Trash2,
  Ban,
  Unlock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Zap
} from 'lucide-react';
import Link from 'next/link';

// Reminder Rule Form Component
function ReminderRuleForm({ onSave, onClose, editingRule = null }) {
  const [formData, setFormData] = useState({
    name: '',
    triggerType: 'days_before_due',
    triggerDays: 7,
    channel: 'email',
    template: 'standard',
    customerGroups: [],
    minAmount: 0,
    isActive: true,
    escalation: false,
    maxReminders: 3
  });

  useEffect(() => {
    if (editingRule) {
      setFormData(editingRule);
    }
  }, [editingRule]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const customerGroups = ['All', 'Retail', 'Wholesale', 'VIP', 'New Customer', 'High Risk'];
  const templates = ['Standard', 'Urgent', 'Friendly', 'Legal Notice'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Rule Name *</label>
          <input
            type="text"
            placeholder="Enter rule name"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Trigger Type *</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.triggerType}
            onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
            required
          >
            <option value="days_before_due">Days Before Due Date</option>
            <option value="days_after_due">Days After Due Date</option>
            <option value="on_due_date">On Due Date</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {formData.triggerType === 'days_before_due' ? 'Days Before Due' :
              formData.triggerType === 'days_after_due' ? 'Days After Due' : 'Notification Day'}
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.triggerDays}
            onChange={(e) => setFormData({ ...formData, triggerDays: parseInt(e.target.value) || 0 })}
            required
            min="0"
            max="90"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Channel *</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            required
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Email & SMS</option>
            <option value="app">In-App Notification</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Template</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.template}
            onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          >
            {templates.map(template => (
              <option key={template.toLowerCase()} value={template.toLowerCase()}>
                {template}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Minimum Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter minimum amount"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.minAmount}
            onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Customer Groups</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {customerGroups.map((group) => (
            <label key={group} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.customerGroups.includes(group)}
                onChange={(e) => {
                  const groups = e.target.checked
                    ? [...formData.customerGroups, group]
                    : formData.customerGroups.filter(g => g !== group);
                  setFormData({ ...formData, customerGroups: groups });
                }}
                className="rounded border-slate-200 text-[#FB9D00] focus:ring-[#FB9D00]"
              />
              <span className="text-sm text-slate-700">{group}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-slate-200 text-[#FB9D00] focus:ring-[#FB9D00]"
          />
          <span className="text-sm font-medium text-slate-700">Active Rule</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.escalation}
            onChange={(e) => setFormData({ ...formData, escalation: e.target.checked })}
            className="rounded border-slate-200 text-[#FB9D00] focus:ring-[#FB9D00]"
          />
          <span className="text-sm font-medium text-slate-700">Enable Escalation</span>
        </label>
      </div>

      {formData.escalation && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Maximum Reminders</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.maxReminders}
            onChange={(e) => setFormData({ ...formData, maxReminders: parseInt(e.target.value) || 3 })}
            min="1"
            max="10"
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#FB9D00] text-white rounded-lg hover:bg-[#E68A00] transition-colors"
        >
          {editingRule ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}

// Credit Limit Adjustment Form
function CreditLimitForm({ customer, onSave, onClose }) {
  const [formData, setFormData] = useState({
    currentLimit: customer?.creditLimit || 0,
    newLimit: customer?.creditLimit || 0,
    reason: '',
    adjustmentType: 'increase',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        currentLimit: customer.creditLimit,
        newLimit: customer.creditLimit,
        reason: '',
        adjustmentType: 'increase',
        effectiveDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      customerId: customer.id,
      customerName: customer.name,
      changeAmount: formData.newLimit - formData.currentLimit
    });
  };

  const adjustmentReasons = [
    'Good Payment History',
    'Increased Business Volume',
    'Seasonal Adjustment',
    'Risk Assessment Improvement',
    'Special Promotion',
    'Poor Payment History',
    'High Risk Behavior',
    'Overdue Payments',
    'Credit Review'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {customer && (
        <div className="bg-slate-50 p-4 rounded-xl">
          <h4 className="font-medium text-slate-900">Customer: {customer.name}</h4>
          <p className="text-sm text-slate-600">
            Current Credit Limit: ₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
          </p>
          <p className="text-sm text-slate-600">
            Current Utilization: {((customer.outstandingAmount / customer.creditLimit) * 100).toFixed(1)}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Adjustment Type *</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.adjustmentType}
            onChange={(e) => setFormData({ ...formData, adjustmentType: e.target.value })}
            required
          >
            <option value="increase">Increase Limit</option>
            <option value="decrease">Decrease Limit</option>
            <option value="freeze">Freeze Limit</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">New Credit Limit (₹) *</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.newLimit}
            onChange={(e) => setFormData({ ...formData, newLimit: parseFloat(e.target.value) || 0 })}
            required
            min="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Reason *</label>
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            required
          >
            <option value="">Select Reason</option>
            {adjustmentReasons.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Effective Date *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Notes</label>
        <textarea
          rows="3"
          placeholder="Additional notes about this adjustment..."
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FB9D00] focus:border-[#FB9D00]"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {formData.newLimit !== formData.currentLimit && (
        <div className={`p-4 rounded-xl border ${formData.newLimit > formData.currentLimit
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-center gap-2">
            {formData.newLimit > formData.currentLimit ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${formData.newLimit > formData.currentLimit ? 'text-green-800' : 'text-red-800'
              }`}>
              {formData.newLimit > formData.currentLimit ? 'Increase' : 'Decrease'} by ₹{Math.abs(formData.newLimit - formData.currentLimit).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </span>
          </div>
          <p className={`text-sm mt-1 ${formData.newLimit > formData.currentLimit ? 'text-green-700' : 'text-red-700'
            }`}>
            New utilization: {((customer.outstandingAmount / formData.newLimit) * 100).toFixed(1)}%
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#FB9D00] text-white rounded-lg hover:bg-[#E68A00] transition-colors"
        >
          Apply Adjustment
        </button>
      </div>
    </form>
  );
}

// Main Component
export default function CreditControlPage() {
  const [customers, setCustomers] = useState([]);
  const [reminderRules, setReminderRules] = useState([]);
  const [sentReminders, setSentReminders] = useState([]);
  const [creditAdjustments, setCreditAdjustments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample data initialization - Updated dates to November 2025 context
  useEffect(() => {
    // Mock customers data
    setCustomers([
      {
        id: 1,
        name: 'Customer A',
        email: 'customerA@email.com',
        phone: '+1234567890',
        creditLimit: 50000,
        outstandingAmount: 25000,
        paymentTerms: 30,
        lastPaymentDate: '2025-10-15',
        nextDueDate: '2025-12-15',
        avgPaymentDays: 28,
        riskLevel: 'Low',
        status: 'Active',
        isBlocked: false,
        overdueAmount: 0,
        totalOrders: 45
      },
      {
        id: 2,
        name: 'Customer B',
        email: 'customerB@email.com',
        phone: '+1234567891',
        creditLimit: 20000,
        outstandingAmount: 18000,
        paymentTerms: 15,
        lastPaymentDate: '2025-10-10',
        nextDueDate: '2025-11-25',
        avgPaymentDays: 45,
        riskLevel: 'High',
        status: 'Active',
        isBlocked: true,
        overdueAmount: 5000,
        totalOrders: 12
      },
      {
        id: 3,
        name: 'Customer C',
        email: 'customerC@email.com',
        phone: '+1234567892',
        creditLimit: 100000,
        outstandingAmount: 75000,
        paymentTerms: 45,
        lastPaymentDate: '2025-10-20',
        nextDueDate: '2025-12-05',
        avgPaymentDays: 42,
        riskLevel: 'Medium',
        status: 'Active',
        isBlocked: false,
        overdueAmount: 15000,
        totalOrders: 89
      },
      {
        id: 4,
        name: 'Customer D',
        email: 'customerD@email.com',
        phone: '+1234567893',
        creditLimit: 30000,
        outstandingAmount: 28000,
        paymentTerms: 30,
        lastPaymentDate: '2025-10-05',
        nextDueDate: '2025-12-05',
        avgPaymentDays: 35,
        riskLevel: 'High',
        status: 'Active',
        isBlocked: false,
        overdueAmount: 8000,
        totalOrders: 23
      }
    ]);

    // Mock reminder rules
    setReminderRules([
      {
        id: 1,
        name: '7-Day Pre-Due Reminder',
        triggerType: 'days_before_due',
        triggerDays: 7,
        channel: 'email',
        template: 'standard',
        customerGroups: ['All'],
        minAmount: 1000,
        isActive: true,
        escalation: false,
        maxReminders: 1
      },
      {
        id: 2,
        name: 'Overdue Escalation',
        triggerType: 'days_after_due',
        triggerDays: 3,
        channel: 'both',
        template: 'urgent',
        customerGroups: ['High Risk'],
        minAmount: 5000,
        isActive: true,
        escalation: true,
        maxReminders: 3
      },
      {
        id: 3,
        name: 'VIP Pre-Due Alert',
        triggerType: 'days_before_due',
        triggerDays: 3,
        channel: 'sms',
        template: 'friendly',
        customerGroups: ['VIP'],
        minAmount: 0,
        isActive: true,
        escalation: false,
        maxReminders: 1
      }
    ]);

    // Mock sent reminders
    setSentReminders([
      {
        id: 1,
        customerId: 2,
        ruleId: 2,
        type: 'email',
        sentDate: '2025-11-28',
        dueDate: '2025-11-25',
        status: 'sent',
        subject: 'Urgent: Payment Overdue',
        content: 'Your payment of ₹5,000 is 3 days overdue...'
      },
      {
        id: 2,
        customerId: 4,
        ruleId: 1,
        type: 'sms',
        sentDate: '2025-11-29',
        dueDate: '2025-12-05',
        status: 'sent',
        subject: 'Payment Reminder',
        content: 'Friendly reminder: Payment due in 7 days...'
      }
    ]);

    // Mock credit adjustments
    setCreditAdjustments([
      {
        id: 1,
        customerId: 2,
        customerName: 'Customer B',
        previousLimit: 30000,
        newLimit: 20000,
        changeAmount: -10000,
        reason: 'Poor Payment History',
        adjustmentType: 'decrease',
        effectiveDate: '2025-11-20',
        notes: 'Multiple overdue payments',
        approvedBy: 'Admin User',
        status: 'completed'
      },
      {
        id: 2,
        customerId: 1,
        customerName: 'Customer A',
        previousLimit: 40000,
        newLimit: 50000,
        changeAmount: 10000,
        reason: 'Good Payment History',
        adjustmentType: 'increase',
        effectiveDate: '2025-11-25',
        notes: 'Consistent on-time payments',
        approvedBy: 'Admin User',
        status: 'completed'
      }
    ]);
  }, []);

  // Handler functions
  const handleSaveReminderRule = (ruleData) => {
    if (editingRule) {
      setReminderRules(rules => rules.map(rule =>
        rule.id === editingRule.id ? { ...ruleData, id: editingRule.id } : rule
      ));
    } else {
      const newRule = {
        ...ruleData,
        id: Date.now()
      };
      setReminderRules(rules => [...rules, newRule]);
    }
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleSaveCreditAdjustment = (adjustmentData) => {
    const newAdjustment = {
      ...adjustmentData,
      id: Date.now(),
      previousLimit: selectedCustomer.creditLimit,
      approvedBy: 'Current User',
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setCreditAdjustments(adjustments => [...adjustments, newAdjustment]);

    // Update customer credit limit
    setCustomers(customers => customers.map(customer =>
      customer.id === selectedCustomer.id
        ? { ...customer, creditLimit: adjustmentData.newLimit }
        : customer
    ));

    setIsDialogOpen(false);
    setSelectedCustomer(null);
  };

  const toggleCustomerBlock = (customerId) => {
    setCustomers(customers => customers.map(customer =>
      customer.id === customerId
        ? { ...customer, isBlocked: !customer.isBlocked }
        : customer
    ));
  };

  const sendManualReminder = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const newReminder = {
      id: Date.now(),
      customerId,
      ruleId: null,
      type: 'manual',
      sentDate: new Date().toISOString().split('T')[0],
      dueDate: customer.nextDueDate,
      status: 'sent',
      subject: 'Manual Payment Reminder',
      content: `Manual reminder sent for payment due on ${customer.nextDueDate}`
    };
    setSentReminders(reminders => [...reminders, newReminder]);
  };

  const calculateRiskScore = (customer) => {
    let score = 100;

    // Deduct points for overdue payments
    if (customer.overdueAmount > 0) score -= 30;

    // Deduct points for high utilization
    const utilization = (customer.outstandingAmount / customer.creditLimit) * 100;
    if (utilization > 80) score -= 20;
    else if (utilization > 60) score -= 10;

    // Deduct points for late payments
    if (customer.avgPaymentDays > customer.paymentTerms) {
      score -= (customer.avgPaymentDays - customer.paymentTerms) * 2;
    }

    return Math.max(0, score);
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return 'Low';
    if (score >= 60) return 'Medium';
    if (score >= 40) return 'High';
    return 'Critical';
  };

  // Statistics calculations
  const blockedCustomers = customers.filter(c => c.isBlocked).length;
  const highRiskCustomers = customers.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length;
  const totalOverdue = customers.reduce((sum, c) => sum + c.overdueAmount, 0);
  const pendingReminders = customers.filter(c => {
    const dueDate = new Date(c.nextDueDate);
    const today = new Date('2025-11-14');
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 7 && daysUntilDue > 0;
  }).length;

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === 'all' ||
      (filterStatus === 'blocked' && customer.isBlocked) ||
      (filterStatus === 'active' && !customer.isBlocked))
  );

  const openDialog = (type, customer = null) => {
    setDialogType(type);
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-[#FB9D00] rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Credit Control Dashboard</h1>
                <p className="text-slate-600 text-sm mt-0.5">Manage reminders, blocks, and credit limits</p>
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
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="border-b border-slate-200">
            <div className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'reminders', label: 'Reminders', icon: Bell },
                { id: 'adjustments', label: 'Credit Limits', icon: TrendingUp },
                { id: 'rules', label: 'Rules', icon: Settings }
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* KPIs */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      Credit Control Metrics
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Key indicators for risk and collections</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="group bg-white rounded-xl border border-red-200 p-6 hover: transition-all duration-200 bg-red-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                            <Ban className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <ArrowDown className="h-3 w-3 text-red-600" />
                            <span className="font-medium text-red-600">+1</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Blocked Customers</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                            {blockedCustomers}
                          </p>
                        </div>
                      </div>

                      <div className="group bg-white rounded-xl border border-yellow-200 p-6 hover: transition-all duration-200 bg-yellow-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                            <AlertTriangle className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+2</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">High Risk Customers</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                            {highRiskCustomers}
                          </p>
                        </div>
                      </div>

                      <div className="group bg-white rounded-xl border border-orange-200 p-6 hover: transition-all duration-200 bg-orange-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                            <Clock className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+15%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Overdue</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                            ₹{totalOverdue.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </p>
                        </div>
                      </div>

                      <div className="group bg-white rounded-xl border border-blue-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                            <Bell className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+3</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Pending Reminders</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FB9D00] transition-colors">
                            {pendingReminders}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                        <Shield className="w-4 h-4 text-[#FB9D00]" />
                      </div>
                      Customer Risk Assessment
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Monitor customer risk levels and take preventive actions</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {customers.map(customer => {
                        const riskScore = calculateRiskScore(customer);
                        const riskLevel = getRiskLevel(riskScore);

                        return (
                          <div key={customer.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${riskLevel === 'Low' ? 'bg-green-100 text-green-600' :
                              riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                riskLevel === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                              }`}>
                              <Shield className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 text-sm">{customer.name}</h4>
                              <p className="text-xs text-slate-600 mt-1">
                                Utilization: {((customer.outstandingAmount / customer.creditLimit) * 100).toFixed(1)}% •
                                Overdue: ₹{customer.overdueAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevel === 'Low' ? 'bg-green-100 text-green-700' :
                                riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  riskLevel === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {riskLevel} Risk ({riskScore}%)
                              </span>
                              <button
                                onClick={() => toggleCustomerBlock(customer.id)}
                                className={`px-3 py-1 rounded text-sm ${customer.isBlocked
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                              >
                                {customer.isBlocked ? 'Unblock' : 'Block'}
                              </button>
                              <button
                                onClick={() => openDialog('creditAdjustment', customer)}
                                className="px-3 py-1 bg-[#FB9D00]/10 text-[#FB9D00] rounded text-sm hover:bg-[#FB9D00]/20"
                              >
                                Adjust Limit
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Customer Management</h2>
                    <p className="text-slate-600 text-sm">Monitor customer status and manage order blocking</p>
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
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Customers</option>
                      <option value="blocked">Blocked</option>
                      <option value="active">Active</option>
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
                          Credit Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Utilization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Overdue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Next Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                              <p className="text-sm text-slate-500">{customer.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${(customer.outstandingAmount / customer.creditLimit) * 100 < 60 ? 'bg-green-600' :
                                  (customer.outstandingAmount / customer.creditLimit) * 100 < 80 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                style={{ width: `${Math.min((customer.outstandingAmount / customer.creditLimit) * 100, 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {((customer.outstandingAmount / customer.creditLimit) * 100).toFixed(1)}%
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {customer.overdueAmount > 0 ? (
                              <span className="text-red-600 font-medium">
                                ₹{customer.overdueAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </span>
                            ) : (
                              <span className="text-green-600">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {customer.nextDueDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleCustomerBlock(customer.id)}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${customer.isBlocked
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}
                            >
                              {customer.isBlocked ? (
                                <>
                                  <Ban className="h-3 w-3 mr-1" />
                                  Blocked
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => sendManualReminder(customer.id)}
                                className="text-[#FB9D00] hover:text-[#E68A00] p-1"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDialog('creditAdjustment', customer)}
                                className="text-green-600 hover:text-green-900 p-1"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleCustomerBlock(customer.id)}
                                className={customer.isBlocked ? "text-green-600 hover:text-green-900 p-1" : "text-red-600 hover:text-red-900 p-1"}
                              >
                                {customer.isBlocked ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                          <Bell className="w-4 h-4 text-blue-600" />
                        </div>
                        Sent Reminders
                      </h2>
                      <p className="text-slate-600 text-sm mt-1">History of all automated and manual reminders</p>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {sentReminders.map(reminder => {
                          const customer = customers.find(c => c.id === reminder.customerId);
                          return (
                            <div key={reminder.id} className="flex items-start gap-4 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reminder.type === 'email' ? 'bg-blue-100 text-blue-600' :
                                reminder.type === 'sms' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                {reminder.type === 'email' ? <Mail className="h-4 w-4" /> :
                                  reminder.type === 'sms' ? <MessageSquare className="h-4 w-4" /> :
                                    <Bell className="h-4 w-4" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-slate-900">{customer?.name}</h4>
                                <p className="text-sm text-slate-600 mt-1">{reminder.subject}</p>
                                <span className="text-xs text-slate-500">{reminder.sentDate}</span>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {reminder.status}
                                </span>
                                <p className="text-sm text-slate-600 mt-1">Due: {reminder.dueDate}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Upcoming Reminders */}
                    <div className="bg-white rounded-xl border border-slate-200">
                      <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#FB9D00]" />
                          Upcoming Reminders
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-4">
                          {customers
                            .filter(customer => {
                              const dueDate = new Date(customer.nextDueDate);
                              const today = new Date('2025-11-14');
                              const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                              return daysUntilDue <= 7 && daysUntilDue > 0;
                            })
                            .map(customer => (
                              <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-slate-900 text-sm">{customer.name}</h4>
                                  <p className="text-xs text-slate-600">
                                    Due in {Math.ceil((new Date(customer.nextDueDate) - new Date('2025-11-14')) / (1000 * 60 * 60 * 24))} days
                                  </p>
                                </div>
                                <button
                                  onClick={() => sendManualReminder(customer.id)}
                                  className="text-[#FB9D00] hover:text-[#E68A00] text-sm font-medium"
                                >
                                  Remind
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200">
                      <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-600" />
                          Quick Actions
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              customers.forEach(customer => {
                                const dueDate = new Date(customer.nextDueDate);
                                const today = new Date('2025-11-14');
                                const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                if (daysUntilDue <= 3 && daysUntilDue > 0) {
                                  sendManualReminder(customer.id);
                                }
                              });
                            }}
                            className="w-full bg-[#FB9D00] text-white py-2 rounded-lg hover:bg-[#E68A00] transition-colors text-sm"
                          >
                            Send 3-Day Reminders
                          </button>
                          <button
                            onClick={() => {
                              customers.filter(c => c.overdueAmount > 0).forEach(customer => {
                                sendManualReminder(customer.id);
                              });
                            }}
                            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            Send Overdue Reminders
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Credit Adjustments Tab */}
            {activeTab === 'adjustments' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Credit Limit Adjustments</h2>
                    <p className="text-slate-600 text-sm">Manage customer credit limits based on payment behavior</p>
                  </div>
                  <button
                    onClick={() => {
                      // Auto-adjust based on behavior
                      customers.forEach(customer => {
                        const riskScore = calculateRiskScore(customer);
                        if (riskScore < 40 && customer.creditLimit > 10000) {
                          const newLimit = Math.max(10000, customer.creditLimit * 0.8);
                          handleSaveCreditAdjustment({
                            customerId: customer.id,
                            customerName: customer.name,
                            currentLimit: customer.creditLimit,
                            newLimit,
                            reason: 'Automatic: High Risk Behavior',
                            adjustmentType: 'decrease',
                            effectiveDate: new Date().toISOString().split('T')[0],
                            notes: 'Auto-adjusted based on risk score'
                          });
                        } else if (riskScore > 80 && customer.avgPaymentDays <= customer.paymentTerms) {
                          const newLimit = customer.creditLimit * 1.2;
                          handleSaveCreditAdjustment({
                            customerId: customer.id,
                            customerName: customer.name,
                            currentLimit: customer.creditLimit,
                            newLimit,
                            reason: 'Automatic: Good Payment History',
                            adjustmentType: 'increase',
                            effectiveDate: new Date().toISOString().split('T')[0],
                            notes: 'Auto-adjusted based on good payment behavior'
                          });
                        }
                      });
                    }}
                    className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Auto-Adjust Limits
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Previous Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          New Limit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Change
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {creditAdjustments.map((adjustment) => (
                        <tr key={adjustment.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {adjustment.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ₹{adjustment.previousLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            ₹{adjustment.newLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${adjustment.changeAmount > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {adjustment.changeAmount > 0 ? '+' : ''}
                              ₹{Math.abs(adjustment.changeAmount).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {adjustment.reason}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {adjustment.effectiveDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {adjustment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Reminder Rules</h2>
                    <p className="text-slate-600 text-sm">Configure automated payment reminder rules</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRule(null);
                      setDialogType('reminderRule');
                      setIsDialogOpen(true);
                    }}
                    className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#E68A00] transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Rule
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Rule Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Trigger
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Customer Groups
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {reminderRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {rule.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {rule.triggerDays} {rule.triggerType === 'days_before_due' ? 'days before' :
                              rule.triggerType === 'days_after_due' ? 'days after' : 'on'} due
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {rule.channel}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {rule.customerGroups.join(', ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setReminderRules(rules => rules.map(r =>
                                  r.id === rule.id ? { ...r, isActive: !r.isActive } : r
                                ));
                              }}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                                }`}
                            >
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditingRule(rule);
                                  setDialogType('reminderRule');
                                  setIsDialogOpen(true);
                                }}
                                className="text-[#FB9D00] hover:text-[#E68A00]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setReminderRules(rules => rules.filter(r => r.id !== rule.id));
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {dialogType === 'reminderRule' && (editingRule ? 'Edit Reminder Rule' : 'Create Reminder Rule')}
                {dialogType === 'creditAdjustment' && 'Adjust Credit Limit'}
              </h2>
            </div>
            <div className="p-6">
              {dialogType === 'reminderRule' && (
                <ReminderRuleForm
                  onSave={handleSaveReminderRule}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setEditingRule(null);
                  }}
                  editingRule={editingRule}
                />
              )}
              {dialogType === 'creditAdjustment' && (
                <CreditLimitForm
                  customer={selectedCustomer}
                  onSave={handleSaveCreditAdjustment}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedCustomer(null);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}