'use client';

import { useState, useEffect } from 'react';
import {
  Calculator,
  Percent,
  Users,
  Package,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Filter,
  Download,
  Upload,
  BarChart3,
  Settings,
  Target,
  Clock,
  DollarSign,
  ShoppingCart,
  Tag,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Search
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Discount Rule Form Component
function DiscountRuleForm({ onSave, onClose, editingRule = null }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: 0,
    minQuantity: 0,
    minAmount: 0,
    customerGroups: [],
    productCategories: [],
    validFrom: '',
    validUntil: '',
    isActive: true,
    priority: 1,
    maxDiscount: 0,
    cumulative: false
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

  const customerGroups = ['Retail', 'Wholesale', 'VIP', 'New Customer', 'Loyalty'];
  const productCategories = ['Electronics', 'Clothing', 'Food', 'Home & Garden', 'Sports', 'Books'];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[80vh]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 p-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rule Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rule Name *</label>
            <input
              type="text"
              placeholder="Enter rule name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Discount Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Discount Type *</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
              <option value="bogo">Buy One Get One</option>
              <option value="tiered">Tiered Pricing</option>
            </select>
          </div>

          {/* Discount Value */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {formData.type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
            </label>
            <input
              type="number"
              placeholder={formData.type === 'percentage' ? 'Enter percentage' : 'Enter amount'}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              required
              min="0"
              max={formData.type === 'percentage' ? '100' : undefined}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Priority *</label>
            <input
              type="number"
              placeholder="Enter priority (1-10)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
              required
              min="1"
              max="10"
            />
          </div>

          {/* Min Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Minimum Quantity</label>
            <input
              type="number"
              placeholder="Enter minimum quantity"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
              min="0"
            />
          </div>

          {/* Min Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Minimum Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter minimum amount"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })}
              min="0"
            />
          </div>

          {/* Max Discount */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Maximum Discount (₹)</label>
            <input
              type="number"
              placeholder="Enter maximum discount"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.maxDiscount}
              onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
              min="0"
            />
          </div>

          {/* Valid From */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Valid From</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
          </div>

          {/* Valid Until */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Valid Until</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>
        </div>

        {/* Customer Groups */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer Groups</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {customerGroups.map((group) => (
              <label key={group} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerGroups.includes(group)}
                  onChange={(e) => {
                    const groups = e.target.checked
                      ? [...formData.customerGroups, group]
                      : formData.customerGroups.filter((g) => g !== group);
                    setFormData({ ...formData, customerGroups: groups });
                  }}
                  className="rounded border-slate-300 text-[#FC9C00] focus:ring-[#FC9C00]"
                />
                <span className="text-sm text-slate-700">{group}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Product Categories */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Product Categories</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {productCategories.map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.productCategories.includes(category)}
                  onChange={(e) => {
                    const categories = e.target.checked
                      ? [...formData.productCategories, category]
                      : formData.productCategories.filter((c) => c !== category);
                    setFormData({ ...formData, productCategories: categories });
                  }}
                  className="rounded border-slate-300 text-[#FC9C00] focus:ring-[#FC9C00]"
                />
                <span className="text-sm text-slate-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-[#FC9C00] focus:ring-[#FC9C00]"
            />
            <span className="text-sm font-medium text-slate-700">Active Rule</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.cumulative}
              onChange={(e) => setFormData({ ...formData, cumulative: e.target.checked })}
              className="rounded border-slate-300 text-[#FC9C00] focus:ring-[#FC9C00]"
            />
            <span className="text-sm font-medium text-slate-700">Cumulative with other discounts</span>
          </label>
        </div>
      </div>

      {/* Sticky Footer with Buttons - Always Visible */}
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200 bg-white sticky bottom-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#FC9C00] text-white rounded-lg hover:bg-[#E68A00] transition-colors font-medium"
        >
          {editingRule ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}

// Discount Calculator Component
function DiscountCalculator({ rules, products, customers, onApplyDiscount }) {
  const [calculationData, setCalculationData] = useState({
    customerType: 'Retail',
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
    appliedDiscounts: [],
    finalAmount: 0
  });

  const sampleProducts = [
    { id: 1, name: 'Laptop', category: 'Electronics', price: 50000 },
    { id: 2, name: 'T-Shirt', category: 'Clothing', price: 1500 },
    { id: 3, name: 'Book', category: 'Books', price: 500 },
    { id: 4, name: 'Headphones', category: 'Electronics', price: 3000 },
    { id: 5, name: 'Sneakers', category: 'Sports', price: 4000 }
  ];

  const addItem = () => {
    setCalculationData({
      ...calculationData,
      items: [...calculationData.items, { productId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = calculationData.items.filter((_, i) => i !== index);
    setCalculationData({ ...calculationData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...calculationData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Update unit price when product is selected
    if (field === 'productId') {
      const product = sampleProducts.find(p => p.id === parseInt(value));
      if (product) {
        newItems[index].unitPrice = product.price;
      }
    }

    setCalculationData({ ...calculationData, items: newItems });
  };

  const calculateDiscounts = () => {
    const totalAmount = calculationData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    let applicableRules = [];
    let totalDiscount = 0;

    // Filter applicable rules based on conditions
    rules.forEach(rule => {
      if (!rule.isActive) return;

      // Check customer type
      if (rule.customerGroups.length > 0 && !rule.customerGroups.includes(calculationData.customerType)) {
        return;
      }

      // Check minimum amount
      if (rule.minAmount > 0 && totalAmount < rule.minAmount) {
        return;
      }

      // Check minimum quantity
      if (rule.minQuantity > 0) {
        const totalQuantity = calculationData.items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity < rule.minQuantity) {
          return;
        }
      }

      // Check product categories
      if (rule.productCategories.length > 0) {
        const hasMatchingProduct = calculationData.items.some(item => {
          const product = sampleProducts.find(p => p.id === parseInt(item.productId));
          return product && rule.productCategories.includes(product.category);
        });
        if (!hasMatchingProduct) return;
      }

      applicableRules.push(rule);
    });

    // Sort rules by priority (highest first)
    applicableRules.sort((a, b) => b.priority - a.priority);

    // Apply discounts
    const appliedDiscounts = [];
    let remainingAmount = totalAmount;

    applicableRules.forEach(rule => {
      let discountAmount = 0;

      if (rule.type === 'percentage') {
        discountAmount = (remainingAmount * rule.value) / 100;
        if (rule.maxDiscount > 0) {
          discountAmount = Math.min(discountAmount, rule.maxDiscount);
        }
      } else if (rule.type === 'fixed') {
        discountAmount = rule.value;
      } else if (rule.type === 'bogo') {
        // Simple BOGO logic
        const totalQuantity = calculationData.items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalQuantity >= 2) {
          const cheapestItem = Math.min(...calculationData.items.map(item => item.unitPrice));
          discountAmount = cheapestItem;
        }
      }

      if (discountAmount > 0) {
        appliedDiscounts.push({
          ruleName: rule.name,
          type: rule.type,
          amount: discountAmount,
          description: `${rule.type === 'percentage' ? rule.value + '%' : '₹' + rule.value} discount`
        });
        totalDiscount += discountAmount;
        remainingAmount -= discountAmount;
      }
    });

    const finalAmount = totalAmount - totalDiscount;

    setCalculationData({
      ...calculationData,
      totalAmount,
      appliedDiscounts,
      finalAmount
    });

    return { totalAmount, appliedDiscounts, finalAmount };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Discount Calculator</h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Customer Type</label>
          <select
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
            value={calculationData.customerType}
            onChange={(e) => setCalculationData({ ...calculationData, customerType: e.target.value })}
          >
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="VIP">VIP</option>
            <option value="New Customer">New Customer</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-slate-700">Items</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-[#FC9C00] hover:text-[#E68A00] text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {calculationData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <label className="text-xs text-slate-600">Product</label>
                <select
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-[#FC9C00] focus:border-[#FC9C00] text-sm"
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                >
                  <option value="">Select Product</option>
                  {sampleProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (₹{product.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="text-xs text-slate-600">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-[#FC9C00] focus:border-[#FC9C00] text-sm"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="col-span-3">
                <label className="text-xs text-slate-600">Price</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-[#FC9C00] focus:border-[#FC9C00] text-sm"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-span-1">
                {calculationData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full p-1 text-red-600 hover:text-red-700 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={calculateDiscounts}
          className="w-full bg-[#FC9C00] text-white py-2 rounded-lg hover:bg-[#E68A00] transition-colors"
        >
          Calculate Discounts
        </button>

        {calculationData.appliedDiscounts.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-medium text-slate-900 mb-3">Calculation Results</h4>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Amount:</span>
                <span className="font-medium">₹{calculationData.totalAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-slate-600">Applied Discounts:</div>
                {calculationData.appliedDiscounts.map((discount, index) => (
                  <div key={index} className="flex justify-between text-sm pl-4">
                    <span className="text-green-600">{discount.ruleName}</span>
                    <span className="text-green-600">-₹{discount.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span className="text-slate-900">Final Amount:</span>
                <span className="text-[#FC9C00]">₹{calculationData.finalAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Savings:</span>
                <span className="text-green-600">
                  ₹{(calculationData.totalAmount - calculationData.finalAmount).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Discount Management Component
export default function DiscountManagementPage() {
  const [discountRules, setDiscountRules] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sample discount rules data
  useEffect(() => {
    setDiscountRules([
      {
        id: 1,
        name: 'VIP Customer Discount',
        type: 'percentage',
        value: 15,
        minQuantity: 0,
        minAmount: 0,
        customerGroups: ['VIP'],
        productCategories: [],
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        isActive: true,
        priority: 1,
        maxDiscount: 5000,
        cumulative: false,
        applications: 245,
        totalDiscount: 125000
      },
      {
        id: 2,
        name: 'Bulk Order Discount',
        type: 'percentage',
        value: 10,
        minQuantity: 10,
        minAmount: 0,
        customerGroups: ['Wholesale', 'Retail'],
        productCategories: [],
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        isActive: true,
        priority: 2,
        maxDiscount: 10000,
        cumulative: true,
        applications: 89,
        totalDiscount: 89000
      },
      {
        id: 3,
        name: 'Seasonal Electronics Sale',
        type: 'percentage',
        value: 20,
        minQuantity: 0,
        minAmount: 10000,
        customerGroups: ['Retail', 'VIP'],
        productCategories: ['Electronics'],
        validFrom: '2024-06-01',
        validUntil: '2024-06-30',
        isActive: true,
        priority: 3,
        maxDiscount: 0,
        cumulative: false,
        applications: 156,
        totalDiscount: 312000
      },
      {
        id: 4,
        name: 'New Customer Welcome',
        type: 'fixed',
        value: 500,
        minQuantity: 0,
        minAmount: 2000,
        customerGroups: ['New Customer'],
        productCategories: [],
        validFrom: '2024-01-01',
        validUntil: '2024-12-31',
        isActive: true,
        priority: 4,
        maxDiscount: 0,
        cumulative: true,
        applications: 342,
        totalDiscount: 171000
      }
    ]);
  }, []);

  const handleSaveRule = (ruleData) => {
    if (editingRule) {
      setDiscountRules(rules => rules.map(rule =>
        rule.id === editingRule.id ? { ...ruleData, id: editingRule.id } : rule
      ));
    } else {
      const newRule = {
        ...ruleData,
        id: Date.now(),
        applications: 0,
        totalDiscount: 0
      };
      setDiscountRules(rules => [...rules, newRule]);
    }
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = (ruleId) => {
    if (confirm('Are you sure you want to delete this discount rule?')) {
      setDiscountRules(rules => rules.filter(rule => rule.id !== ruleId));
    }
  };

  const toggleRuleStatus = (ruleId) => {
    setDiscountRules(rules => rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const filteredRules = discountRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && rule.isActive) ||
      (filterStatus === 'inactive' && !rule.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalDiscountGiven = discountRules.reduce((sum, rule) => sum + rule.totalDiscount, 0);
  const totalApplications = discountRules.reduce((sum, rule) => sum + rule.applications, 0);
  const activeRules = discountRules.filter(rule => rule.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 bg-[#FC9C00] rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Automated Discount Management</h1>
                <p className="text-slate-600 text-sm mt-0.5">Create and manage automated discount rules with real-time calculation</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-slate-600 hover:text-[#FC9C00] hover:bg-[#FC9C00]/10 rounded-lg transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              {/* <button className="p-2.5 text-slate-600 hover:text-[#FC9C00] hover:bg-[#FC9C00]/10 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button> */}
              <Link href="/export/discounts">
                <button className="flex items-center gap-2 bg-[#FC9C00] text-white px-4 py-2 rounded-lg hover:bg-[#E68A00] transition-colors">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </Link>
              <button
                onClick={() => {
                  setEditingRule(null);
                  setIsDialogOpen(true);
                }}
                className="flex items-center gap-2 bg-[#FC9C00] text-white px-4 py-2 rounded-lg hover:bg-[#E68A00] transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Discount Rule
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'rules', label: 'Discount Rules', icon: Settings },
                { id: 'calculator', label: 'Calculator', icon: Calculator },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                      ? 'border-[#FC9C00] text-[#FC9C00]'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#FB9D00] hover:bg-[#e68d00] rounded-xl flex items-center justify-center transition-colors">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      Key Performance Indicators
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Real-time discount management metrics</p>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+12%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Discount Given</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FC9C00] transition-colors">
                            ₹{totalDiscountGiven.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </p>
                        </div>
                      </div>

                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+45</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Applications</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FC9C00] transition-colors">
                            {totalApplications}
                          </p>
                        </div>
                      </div>

                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+2</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Active Rules</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-[#FC9C00] transition-colors">
                            {activeRules}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performing Rules */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      Top Performing Rules
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Most applied discount rules by volume</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {discountRules
                        .sort((a, b) => b.applications - a.applications)
                        .slice(0, 5)
                        .map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${rule.isActive ? 'bg-green-100' : 'bg-slate-100'
                                }`}>
                                <Tag className={`h-4 w-4 ${rule.isActive ? 'text-green-600' : 'text-slate-400'
                                  }`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm">{rule.name}</h4>
                                <p className="text-sm text-slate-500">
                                  {rule.type === 'percentage' ? `${rule.value}%` : `₹${rule.value}`} discount
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-slate-900">{rule.applications} applications</p>
                              <p className="text-sm text-green-600">₹{rule.totalDiscount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Discount Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#FB9D00] hover:bg-[#e68d00] rounded-xl flex items-center justify-center transition-colors">
                        <Settings className="w-4 h-4 text-white" />
                      </div>
                      Discount Rules
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Manage automated discount rules and conditions</p>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search rules..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                        <select
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FC9C00] focus:border-[#FC9C00]"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="all">All Rules</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Rule Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Conditions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Applications
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
                          {filteredRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                                  <p className="text-sm text-slate-500">
                                    Priority: {rule.priority} • {rule.cumulative ? 'Cumulative' : 'Non-cumulative'}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FC9C00]/10 text-[#FC9C00]/80">
                                  {rule.type === 'percentage' ? `${rule.value}%` : `₹${rule.value}`}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-900 space-y-1">
                                  {rule.minQuantity > 0 && (
                                    <p>Min Qty: {rule.minQuantity}</p>
                                  )}
                                  {rule.minAmount > 0 && (
                                    <p>Min Amount: ₹{rule.minAmount}</p>
                                  )}
                                  {rule.customerGroups.length > 0 && (
                                    <p>Customers: {rule.customerGroups.join(', ')}</p>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-slate-900">
                                  <p>{rule.applications} times</p>
                                  <p className="text-green-600">₹{rule.totalDiscount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => toggleRuleStatus(rule.id)}
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
                                    onClick={() => handleEditRule(rule)}
                                    className="text-[#FC9C00] hover:text-[#E68A00]"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRule(rule.id)}
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
                </div>
              </div>
            )}

            {/* Calculator Tab */}
            {activeTab === 'calculator' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
                  <DiscountCalculator
                    rules={discountRules.filter(rule => rule.isActive)}
                    products={[]}
                    customers={[]}
                    onApplyDiscount={(discounts) => console.log('Applied discounts:', discounts)}
                  />
                </div>

                <div className="space-y-6">
                  {/* Active Rules Summary */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Rules</h3>
                    <div className="space-y-3">
                      {discountRules
                        .filter(rule => rule.isActive)
                        .sort((a, b) => a.priority - b.priority)
                        .map((rule) => (
                          <div key={rule.id} className="p-3 border border-slate-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm">{rule.name}</h4>
                                <p className="text-sm text-slate-500">
                                  {rule.type === 'percentage' ? `${rule.value}%` : `₹${rule.value}`}
                                  {rule.minAmount > 0 && ` • Min ₹${rule.minAmount}`}
                                  {rule.minQuantity > 0 && ` • Min ${rule.minQuantity} items`}
                                </p>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[#FC9C00]/10 text-[#FC9C00]/80">
                                P{rule.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Discount Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Rules</span>
                        <span className="text-sm font-medium">{discountRules.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Active Rules</span>
                        <span className="text-sm font-medium text-green-600">{activeRules}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Given</span>
                        <span className="text-sm font-medium text-green-600">
                          ₹{totalDiscountGiven.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Applications</span>
                        <span className="text-sm font-medium">{totalApplications}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Discount Performance</h3>
                    <div className="space-y-4">
                      {discountRules.map((rule) => (
                        <div key={rule.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{rule.name}</span>
                            <span className="font-medium">{rule.applications} apps</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-[#FC9C00] h-2 rounded-full"
                              style={{
                                width: `${(rule.applications / Math.max(...discountRules.map(r => r.applications))) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Discount Impact</h3>
                    <div className="space-y-4">
                      {discountRules.map((rule) => (
                        <div key={rule.id} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">{rule.name}</span>
                            <span className="font-medium text-green-600">
                              ₹{rule.totalDiscount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{
                                width: `${(rule.totalDiscount / Math.max(totalDiscountGiven, 1)) * 100}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Rule Effectiveness</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Rule Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Avg. Discount per Application
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Success Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            ROI
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {discountRules.map((rule) => {
                          const avgDiscount = rule.applications > 0 ? rule.totalDiscount / rule.applications : 0;
                          const successRate = Math.min(100, (rule.applications / 1000) * 100); // Simplified success rate
                          const roi = (rule.totalDiscount / (rule.totalDiscount * 0.1)) * 100; // Simplified ROI

                          return (
                            <tr key={rule.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {rule.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{avgDiscount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${successRate > 70 ? 'bg-green-100 text-green-800' :
                                  successRate > 40 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                  {successRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {roi.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discount Rule Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingRule ? 'Edit Discount Rule' : 'Create New Discount Rule'}
              </h2>
            </div>
            <div className="p-6">
              <DiscountRuleForm
                onSave={handleSaveRule}
                onClose={() => {
                  setIsDialogOpen(false);
                  setEditingRule(null);
                }}
                editingRule={editingRule}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}