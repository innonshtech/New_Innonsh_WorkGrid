'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  CreditCard,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  FileText,
  Package,
  Calendar,
  Search,
  ChevronDown,
  Filter,
  Download,
  Upload,
  Shield,
  AlertTriangle,
  TrendingUp,
  Receipt,
  FileCheck,
  BarChart3,
  RefreshCw,
  Settings,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  AlertCircle,
  ArrowUp,  // Add this
  ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// New Customer Form
function NewCustomerForm({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'New',
    creditLimit: 0,
    creditPeriod: 30,
    contact: '',
    phone: '',
    classification: 'Standard',
    documents: [],
    bankReferences: []
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would call an API
    console.log('New customer data:', formData);
    onClose();
  };
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({
      ...formData,
      documents: [...formData.documents, ...files.map(file => file.name)]
    });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer Type *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="New">New</option>
              <option value="Existing">Existing</option>
              <option value="Advance">Advance</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Credit Limit (₹) *</label>
          <input
            type="number"
            placeholder="Enter credit limit"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.creditLimit}
            onChange={(e) => setFormData({ ...formData, creditLimit: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Credit Period (Days) *</label>
          <input
            type="number"
            placeholder="Enter credit period"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.creditPeriod}
            onChange={(e) => setFormData({ ...formData, creditPeriod: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Email *</label>
          <input
            type="email"
            placeholder="Enter email address"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Phone *</label>
          <input
            type="tel"
            placeholder="Enter phone number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Classification</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.classification}
              onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
              <option value="Restricted">Restricted</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Upload Documents</label>
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
          <input
            type="file"
            multiple
            onChange={handleDocumentUpload}
            className="hidden"
            id="document-upload"
          />
          <label htmlFor="document-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Click to upload documents</p>
            <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
          </label>
        </div>
        {formData.documents.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-slate-700">Uploaded Documents:</p>
            <ul className="text-sm text-slate-600">
              {formData.documents.map((doc, index) => (
                <li key={index}>• {doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
         className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
        >
          Create Customer
        </button>
      </div>
    </form>
  );
}
// Return Goods Form
function ReturnGoodsForm({ customers, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    customerId: '',
    product: '',
    quantity: 1,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reason: 'Defective',
    status: 'Pending'
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Product *</label>
          <input
            type="text"
            placeholder="Enter product name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.product}
            onChange={(e) => setFormData({ ...formData, product: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Quantity *</label>
          <input
            type="number"
            placeholder="Enter quantity"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Amount (₹) *</label>
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Return Reason *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            >
              <option value="Defective">Defective Product</option>
              <option value="Wrong Item">Wrong Item Shipped</option>
              <option value="Damaged">Damaged in Transit</option>
              <option value="Customer Change">Customer Changed Mind</option>
              <option value="Overstocked">Overstocked</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Return Date *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
         className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
         > Process Return
        </button>
      </div>
    </form>
  );
}
// PDC Entry Form
function PDCEntryForm({ customers, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    customerId: '',
    chequeNo: '',
    amount: 0,
    dueDate: '',
    bank: '',
    againstInvoice: ''
  });
  const [creditCheck, setCreditCheck] = useState(null);
  const handleCustomerChange = (customerId) => {
    setFormData({ ...formData, customerId });
    if (customerId && formData.amount > 0) {
      const check = onSubmit(parseInt(customerId), formData.amount);
      setCreditCheck(check);
    }
  };
  const handleAmountChange = (amount) => {
    setFormData({ ...formData, amount });
    if (formData.customerId && amount > 0) {
      const check = onSubmit(parseInt(formData.customerId), amount);
      setCreditCheck(check);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would call an API to add the PDC
    console.log('PDC data:', formData);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (Limit: ₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cheque Number *</label>
          <input
            type="text"
            placeholder="Enter cheque number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.chequeNo}
            onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Amount (₹) *</label>
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => handleAmountChange(parseInt(e.target.value) || 0)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Due Date *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Bank *</label>
          <input
            type="text"
            placeholder="Enter bank name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.bank}
            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Against Invoice</label>
          <input
            type="text"
            placeholder="Enter invoice number"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.againstInvoice}
            onChange={(e) => setFormData({ ...formData, againstInvoice: e.target.value })}
          />
        </div>
      </div>
      {creditCheck && (
        <div className={`p-4 rounded-lg border ${
          creditCheck.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {creditCheck.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${
              creditCheck.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {creditCheck.isValid ? 'Within Credit Limit' : 'Exceeds Credit Limit'}
            </span>
          </div>
          <div className="mt-2 text-sm space-y-1">
            <p className={creditCheck.isValid ? 'text-green-700' : 'text-red-700'}>
              Total PDC Amount: ₹{creditCheck.totalPDC?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p className={creditCheck.isValid ? 'text-green-700' : 'text-red-700'}>
              Available Credit: ₹{creditCheck.availableCredit?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </p>
            {creditCheck.wouldExceed && (
              <p className="text-red-700 font-medium">
                This PDC would exceed the available credit limit
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={creditCheck && !creditCheck.isValid}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${
            creditCheck && !creditCheck.isValid
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-[#FB9D00]  hover:bg-[#e68d00] '
          }`}
        >
               


          Add PDC
        </button>
      </div>
    </form>
  );
}
// Receipt Entry Form
function ReceiptEntryForm({ customers, onSubmit, onClose, validateReceipt }) {
  const [formData, setFormData] = useState({
    customerId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'Cash',
    ledger: 'Cash Ledger',
    tdsAmount: 0
  });
  const [errors, setErrors] = useState([]);
  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateReceipt(formData);
   
    if (validation.isValid) {
      onSubmit(formData);
    } else {
      setErrors(validation.errors);
    }
  };
  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    setFormData({ ...formData, customerId });
   
    if (customer) {
      setErrors([]);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">• {error}</p>
          ))}
        </div>
      )}
     
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (Outstanding: ₹{customer.outstandingAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Amount (₹) *</label>
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Payment Type *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Date *</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Ledger *</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.ledger}
              onChange={(e) => setFormData({ ...formData, ledger: e.target.value })}
              required
            >
              <option value="Cash Ledger">Cash Ledger</option>
              <option value="Bank Ledger">Bank Ledger</option>
              <option value="General Ledger">General Ledger</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">TDS Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter TDS amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.tdsAmount}
            onChange={(e) => setFormData({ ...formData, tdsAmount: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
         className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
        >
          Add Receipt
        </button>
      </div>
    </form>
  );
}
// TDS Receipt Form
function TDSReceiptForm({ customers, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    customerId: '',
    amount: 0,
    tdsAmount: 0,
    date: new Date().toISOString().split('T')[0],
    financialYear: '2023-24',
    section: '194'
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    const netAmount = formData.amount - formData.tdsAmount;
    onSubmit({ ...formData, netAmount, type: 'TDS' });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Gross Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter gross amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">TDS Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter TDS amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.tdsAmount}
            onChange={(e) => setFormData({ ...formData, tdsAmount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">TDS Section</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            >
              <option value="194">194 - Dividend</option>
              <option value="194A">194A - Interest</option>
              <option value="194C">194C - Contractors</option>
              <option value="194J">194J - Professional Fees</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Financial Year</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.financialYear}
              onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
            >
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
      </div>
      {formData.amount > 0 && formData.tdsAmount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-700">
            Net Amount after TDS: <strong>₹{(formData.amount - formData.tdsAmount).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</strong>
          </p>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
         className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
        >
          Add TDS Receipt
        </button>
      </div>
    </form>
  );
}
// Collection Entry Form
function CollectionEntryForm({ customers, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    customerId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    collector: '',
    nextFollowUp: ''
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Customer</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (Outstanding: ₹{customer.outstandingAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
          <input
            type="number"
            placeholder="Enter amount"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Collection Method</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              required
            >
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Collector</label>
          <input
            type="text"
            placeholder="Enter collector name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.collector}
            onChange={(e) => setFormData({ ...formData, collector: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Collection Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Next Follow-up Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={formData.nextFollowUp}
            onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
         className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
        >
          Add Collection
        </button>
      </div>
    </form>
  );
}
// Enhanced Customer Detail View
function CustomerDetailView({ customer, onClose, creditCheck, periodEvaluation, oldOutstanding }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Credit Limit</label>
            <p className="text-2xl font-bold text-slate-900">₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Outstanding</label>
            <p className="text-2xl font-bold text-slate-900">₹{customer.outstandingAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Credit Period</label>
            <p className="text-2xl font-bold text-slate-900">{customer.creditPeriod} days</p>
            <p className={`text-sm ${periodEvaluation.performance === 'Good' ? 'text-green-600' : 'text-red-600'}`}>
              Performance: {periodEvaluation.performance}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Available Credit</label>
            <p className="text-2xl font-bold text-green-600">
              ₹{creditCheck.availableCredit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      </div>
     
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-medium text-slate-900 mb-3">Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-slate-600">Email</label>
            <p className="text-slate-900">{customer.contact}</p>
          </div>
          <div>
            <label className="text-slate-600">Phone</label>
            <p className="text-slate-900">{customer.phone}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-medium text-slate-900 mb-3">Credit Utilization</h4>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              creditCheck.utilization < 60 ? 'bg-green-600' :
              creditCheck.utilization < 80 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${Math.min(creditCheck.utilization, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {creditCheck.utilization.toFixed(1)}% utilized
        </p>
      </div>
      {oldOutstanding.requiresFollowUp && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="font-medium text-red-700 mb-3">⚠️ Old Outstanding Alert</h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              {oldOutstanding.billCount} bills older than 60 days totaling ₹{oldOutstanding.totalOldOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p className="text-xs text-red-600 mt-1">Requires immediate follow-up</p>
          </div>
        </div>
      )}
    </div>
  );
}
// Helper function for customer type badges
function getTypeBadge(type) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
 
  switch (type) {
    case 'New':
      return `${baseClasses} bg-indigo-100 text-indigo-800`;
    case 'Existing':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'Advance':
      return `${baseClasses} bg-purple-100 text-purple-800`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-800`;
  }
}
// Helper function for risk level badges
function getRiskBadge(riskLevel) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
 
  switch (riskLevel) {
    case 'Low':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'Medium':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'High':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-800`;
  }
}
// Helper function for status badges
function getStatusBadge(status) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
 
  switch (status) {
    case 'Active':
    case 'Cleared':
    case 'Processed':
    case 'Current':
    case 'Collected':
    case 'Invoiced':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'Pending Approval':
    case 'Pending':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'Rejected':
    case 'Dishonored':
    case 'Overdue':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-800`;
  }
}
// Enhanced customer classification function
const classifyCustomer = (customer) => {
  if (!customer) return { classification: 'Standard', riskLevel: 'Medium' };
 
  const utilization = customer.creditLimit > 0 ? (customer.outstandingAmount / customer.creditLimit) * 100 : 0;
  const paymentPerformance = customer.avgPaymentDays <= customer.creditPeriod;
  const orderVolume = customer.totalOrders || 0;
 
  let classification = 'Standard';
  let riskLevel = 'Medium';
  if (utilization < 50 && paymentPerformance && orderVolume > 50) {
    classification = 'Premium';
    riskLevel = 'Low';
  } else if (utilization > 80 || !paymentPerformance) {
    classification = 'Restricted';
    riskLevel = 'High';
  } else if (orderVolume > 25) {
    classification = 'Preferred';
    riskLevel = 'Low';
  } else if (utilization < 30 && paymentPerformance) {
    classification = 'Standard';
    riskLevel = 'Low';
  }
  return { classification, riskLevel };
};
// Main Component
export default function CreditManagementPage() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [outstandingBills, setOutstandingBills] = useState([]);
  const [pdcEntries, setPdcEntries] = useState([]);
  const [returnGoods, setReturnGoods] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [collections, setCollections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    classification: '',
    creditPeriod: ''
  });
  // Enhanced credit limit verification
  const verifyCreditLimit = (customerId, amount) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        isValid: false,
        availableCredit: 0,
        utilization: 0,
        error: 'Customer not found'
      };
    }
   
    const availableCredit = Math.max(0, customer.creditLimit - customer.outstandingAmount);
    const utilization = customer.creditLimit > 0 ? (customer.outstandingAmount / customer.creditLimit) * 100 : 0;
   
    return {
      isValid: amount <= availableCredit,
      availableCredit,
      utilization,
      currentOutstanding: customer.outstandingAmount,
      creditLimit: customer.creditLimit
    };
  };
  // Enhanced PDC limit check
  const checkPDCLimit = (customerId, pdcAmount) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      return {
        isValid: false,
        totalPDC: 0,
        availableCredit: 0,
        wouldExceed: true,
        error: 'Customer not found'
      };
    }
   
    const totalPDC = pdcEntries
      .filter(pdc => pdc.customerId === customerId && pdc.status === 'Pending')
      .reduce((sum, pdc) => sum + pdc.amount, 0);
   
    const availableCredit = Math.max(0, customer.creditLimit - customer.outstandingAmount);
    const wouldExceed = (totalPDC + pdcAmount) > availableCredit;
   
    return {
      isValid: !wouldExceed,
      totalPDC,
      availableCredit,
      wouldExceed,
      currentUtilization: customer.outstandingAmount,
      creditLimit: customer.creditLimit
    };
  };
  // Feature 2: Evaluate credit periods
  const evaluateCreditPeriod = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const overdueBills = outstandingBills.filter(bill =>
      bill.customerId === customerId && bill.status === 'Overdue'
    );
   
    return {
      creditPeriod: customer.creditPeriod,
      avgPaymentDays: customer.avgPaymentDays,
      overdueCount: overdueBills.length,
      performance: customer.avgPaymentDays <= customer.creditPeriod ? 'Good' : 'Needs Attention'
    };
  };
  // Feature 4: Track ledger-wise outstanding payments
  const getLedgerWiseOutstanding = () => {
    const ledgerMap = {};
    outstandingBills.forEach(bill => {
      if (!ledgerMap[bill.ledger]) {
        ledgerMap[bill.ledger] = 0;
      }
      ledgerMap[bill.ledger] += bill.amount;
    });
    return ledgerMap;
  };
  // Feature 6: Track/reconcile old outstanding bills
  const reconcileOldOutstanding = (customerId) => {
    const oldBills = outstandingBills.filter(bill =>
      bill.customerId === customerId && bill.age > 60
    );
   
    const reconciliation = {
      totalOldOutstanding: oldBills.reduce((sum, bill) => sum + bill.amount, 0),
      billCount: oldBills.length,
      bills: oldBills,
      requiresFollowUp: oldBills.length > 0
    };
    return reconciliation;
  };
  // Feature 7: Approve credit eligibility
  const approveCreditEligibility = (customerId) => {
    setCustomers(customers.map(c =>
      c.id === customerId ? {
        ...c,
        status: 'Active',
        classification: classifyCustomer(c).classification,
        riskLevel: classifyCustomer(c).riskLevel
      } : c
    ));
  };
  const rejectCreditEligibility = (customerId) => {
    setCustomers(customers.map(c =>
      c.id === customerId ? { ...c, status: 'Rejected' } : c
    ));
  };
  // Feature 8: Manage receipt entries
  const handleReceiptEntry = (receiptData) => {
    const newReceipt = {
      ...receiptData,
      id: Date.now(),
      reference: `RC-${Date.now()}`,
      status: 'Cleared'
    };
   
    // Update customer outstanding amount
    setCustomers(customers.map(c =>
      c.id === parseInt(receiptData.customerId)
        ? { ...c, outstandingAmount: Math.max(0, c.outstandingAmount - receiptData.amount) }
        : c
    ));
   
    setReceipts([...receipts, newReceipt]);
    setIsDialogOpen(false);
  };
  // Feature 9: Handle dishonored cheques
  const handleDishonoredCheque = (chequeId) => {
    const cheque = pdcEntries.find(pdc => pdc.id === chequeId);
   
    setPdcEntries(pdcEntries.map(pdc =>
      pdc.id === chequeId ? { ...pdc, status: 'Dishonored' } : pdc
    ));
    // Add back to outstanding amount
    setCustomers(customers.map(c =>
      c.id === cheque.customerId
        ? { ...c, outstandingAmount: c.outstandingAmount + cheque.amount }
        : c
    ));
  };
  // Feature 10: Manage TDS receipt entries
  const handleTDSReceipt = (receiptData) => {
    const tdsReceipt = {
      ...receiptData,
      id: Date.now(),
      type: 'TDS',
      reference: `TDS-${Date.now()}`,
      status: 'Processed'
    };
   
    setReceipts([...receipts, tdsReceipt]);
    setIsDialogOpen(false);
  };
  // Feature 11: Process return goods
  const processReturnGoods = (returnData) => {
    const newReturn = {
      ...returnData,
      id: Date.now(),
      status: 'Processed',
      creditNote: `CN-${Date.now()}`
    };
    // Adjust customer outstanding
    setCustomers(customers.map(c =>
      c.id === parseInt(returnData.customerId)
        ? { ...c, outstandingAmount: Math.max(0, c.outstandingAmount - returnData.amount) }
        : c
    ));
    setReturnGoods([...returnGoods, newReturn]);
    setIsDialogOpen(false);
  };
  // Feature 13: Manage collection process
  const manageCollection = (collectionData) => {
    const newCollection = {
      ...collectionData,
      id: Date.now(),
      status: 'Pending'
    };
   
    setCollections([...collections, newCollection]);
    setIsDialogOpen(false);
  };
  // Feature 14: Track POs on invoices
  const getPOInvoiceMapping = () => {
    return purchaseOrders.map(po => ({
      ...po,
      customerName: customers.find(c => c.id === po.customerId)?.name,
      outstanding: outstandingBills.find(bill => bill.invoiceNo === po.invoiceNo)?.amount || 0
    }));
  };
  // Feature 15: Ensure correct receipt entry recording
  const validateReceiptEntry = (receiptData) => {
    const errors = [];
   
    if (!receiptData.customerId) errors.push('Customer is required');
    if (!receiptData.amount || receiptData.amount <= 0) errors.push('Valid amount is required');
    if (!receiptData.date) errors.push('Date is required');
   
    // Check if receipt exceeds outstanding
    const customer = customers.find(c => c.id === parseInt(receiptData.customerId));
    if (customer && receiptData.amount > customer.outstandingAmount) {
      errors.push('Receipt amount cannot exceed outstanding amount');
    }
   
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  // Sample data - replace with actual API calls
  useEffect(() => {
    // Mock data initialization
    setCustomers([
      {
        id: 1,
        name: 'Customer A',
        type: 'Existing',
        creditLimit: 50000,
        creditPeriod: 30,
        outstandingAmount: 25000,
        status: 'Active',
        classification: 'Premium',
        contact: 'customerA@email.com',
        phone: '+1234567890',
        totalOrders: 45,
        avgPaymentDays: 28,
        riskLevel: 'Low'
      },
      {
        id: 2,
        name: 'Customer B',
        type: 'New',
        creditLimit: 20000,
        creditPeriod: 15,
        outstandingAmount: 5000,
        status: 'Pending Approval',
        classification: 'Standard',
        contact: 'customerB@email.com',
        phone: '+1234567891',
        totalOrders: 12,
        avgPaymentDays: 12,
        riskLevel: 'Medium'
      },
      {
        id: 3,
        name: 'Customer C',
        type: 'Existing',
        creditLimit: 100000,
        creditPeriod: 45,
        outstandingAmount: 75000,
        status: 'Active',
        classification: 'VIP',
        contact: 'customerC@email.com',
        phone: '+1234567892',
        totalOrders: 89,
        avgPaymentDays: 42,
        riskLevel: 'High'
      },
      {
        id: 4,
        name: 'Customer D',
        type: 'Advance',
        creditLimit: 30000,
        creditPeriod: 0,
        outstandingAmount: 0,
        status: 'Active',
        classification: 'Standard',
        contact: 'customerD@email.com',
        phone: '+1234567893',
        totalOrders: 23,
        avgPaymentDays: 0,
        riskLevel: 'Low'
      }
    ]);
    setReceipts([
      {
        id: 1,
        customerId: 1,
        amount: 10000,
        date: '2024-01-15',
        type: 'Cash',
        status: 'Cleared',
        reference: 'RC-001',
        tdsAmount: 1000,
        netAmount: 9000,
        ledger: 'Cash Ledger'
      },
      {
        id: 2,
        customerId: 1,
        amount: 5000,
        date: '2024-01-20',
        type: 'Cheque',
        status: 'Pending',
        reference: 'RC-002',
        tdsAmount: 500,
        netAmount: 4500,
        ledger: 'Bank Ledger'
      },
      {
        id: 3,
        customerId: 3,
        amount: 25000,
        date: '2024-01-25',
        type: 'Bank Transfer',
        status: 'Cleared',
        reference: 'RC-003',
        tdsAmount: 2500,
        netAmount: 22500,
        ledger: 'Bank Ledger'
      }
    ]);
    setOutstandingBills([
      {
        id: 1,
        customerId: 1,
        invoiceNo: 'INV-001',
        amount: 15000,
        dueDate: '2024-02-15',
        age: 30,
        status: 'Overdue',
        ledger: 'Sales Ledger',
        poNumber: 'PO-001'
      },
      {
        id: 2,
        customerId: 1,
        invoiceNo: 'INV-002',
        amount: 10000,
        dueDate: '2024-02-28',
        age: 15,
        status: 'Current',
        ledger: 'Sales Ledger',
        poNumber: 'PO-002'
      },
      {
        id: 3,
        customerId: 3,
        invoiceNo: 'INV-003',
        amount: 50000,
        dueDate: '2024-03-15',
        age: 5,
        status: 'Current',
        ledger: 'Sales Ledger',
        poNumber: 'PO-005'
      },
      {
        id: 4,
        customerId: 2,
        invoiceNo: 'INV-004',
        amount: 8000,
        dueDate: '2024-01-30',
        age: 45,
        status: 'Overdue',
        ledger: 'Sales Ledger',
        poNumber: 'PO-003'
      }
    ]);
    setPdcEntries([
      {
        id: 1,
        customerId: 1,
        chequeNo: 'CHQ123',
        amount: 5000,
        dueDate: '2024-02-10',
        status: 'Pending',
        bank: 'HDFC Bank',
        againstInvoice: 'INV-001'
      },
      {
        id: 2,
        customerId: 3,
        chequeNo: 'CHQ456',
        amount: 20000,
        dueDate: '2024-03-01',
        status: 'Pending',
        bank: 'ICICI Bank',
        againstInvoice: 'INV-003'
      },
      {
        id: 3,
        customerId: 1,
        chequeNo: 'CHQ789',
        amount: 8000,
        dueDate: '2024-02-20',
        status: 'Dishonored',
        bank: 'SBI',
        againstInvoice: 'INV-002'
      }
    ]);
    setReturnGoods([
      {
        id: 1,
        customerId: 1,
        product: 'Product A',
        quantity: 2,
        amount: 2000,
        date: '2024-01-18',
        status: 'Processed',
        reason: 'Defective',
        creditNote: 'CN-001'
      },
      {
        id: 2,
        customerId: 3,
        product: 'Product B',
        quantity: 1,
        amount: 1500,
        date: '2024-01-22',
        status: 'Pending',
        reason: 'Wrong Item',
        creditNote: 'CN-002'
      }
    ]);
    setPurchaseOrders([
      {
        id: 1,
        customerId: 1,
        poNumber: 'PO-001',
        amount: 15000,
        date: '2024-01-10',
        status: 'Invoiced',
        invoiceNo: 'INV-001'
      },
      {
        id: 2,
        customerId: 1,
        poNumber: 'PO-002',
        amount: 10000,
        date: '2024-01-15',
        status: 'Invoiced',
        invoiceNo: 'INV-002'
      },
      {
        id: 3,
        customerId: 2,
        poNumber: 'PO-003',
        amount: 8000,
        date: '2024-01-05',
        status: 'Invoiced',
        invoiceNo: 'INV-004'
      },
      {
        id: 4,
        customerId: 3,
        poNumber: 'PO-005',
        amount: 50000,
        date: '2024-01-20',
        status: 'Invoiced',
        invoiceNo: 'INV-003'
      }
    ]);
    setCollections([
      {
        id: 1,
        customerId: 1,
        amount: 10000,
        date: '2024-01-15',
        method: 'Cash',
        status: 'Collected',
        collector: 'John Doe',
        nextFollowUp: '2024-02-01'
      },
      {
        id: 2,
        customerId: 3,
        amount: 25000,
        date: '2024-01-25',
        method: 'Bank Transfer',
        status: 'Collected',
        collector: 'Jane Smith',
        nextFollowUp: '2024-02-10'
      },
      {
        id: 3,
        customerId: 2,
        amount: 5000,
        date: '2024-01-30',
        method: 'Pending',
        status: 'Pending',
        collector: 'Mike Johnson',
        nextFollowUp: '2024-02-05'
      }
    ]);
  }, []);
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.classification.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const openDialog = (type) => {
    setDialogType(type);
    setIsDialogOpen(true);
  };
  const ledgerWiseOutstanding = getLedgerWiseOutstanding();
  const poInvoiceMappings = getPOInvoiceMapping();
  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);
  const totalCreditLimit = customers.reduce((sum, c) => sum + c.creditLimit, 0);
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
             <div className="w-11 h-11 bg-[#FB9D00] rounded-xl flex items-center justify-center">
  <CreditCard className="w-6 h-6 text-white" />
</div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">Credit Management System</h1>
                <p className="text-slate-600 text-sm mt-0.5">Comprehensive credit, payments, and collections management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <RefreshCw className="h-5 w-5" />
              </button>
              {/* <button className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
              </button> */}
              <Link href="/export/credit-report">
                <button className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors">
  <Download className="h-4 w-4" />
  Export
</button>

              </Link>
              <button
                onClick={() => openDialog('newCustomer')}
               className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add New Customer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'receipts', label: 'Receipts', icon: Receipt },
                { id: 'outstanding', label: 'Outstanding', icon: FileCheck },
                { id: 'returns', label: 'Returns', icon: Package },
                { id: 'pdc', label: 'PDC', icon: CreditCard },
                { id: 'collections', label: 'Collections', icon: TrendingUp },
                { id: 'pos', label: 'Purchase Orders', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
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
            {/* Enhanced Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <TrendingUpIcon className="w-4 h-4 text-indigo-600" />
                      </div>
                      Key Performance Indicators
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Real-time credit management metrics</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                            <Users className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+2</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Customers</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {customers.length}
                          </p>
                        </div>
                      </div>
                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-600">+15%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Total Outstanding</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            ₹{totalOutstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </p>
                        </div>
                      </div>
                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                            <Clock className="h-6 w-6 text-yellow-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <ArrowUp className="h-3 w-3 text-red-600" />
                            <span className="font-medium text-red-600">+1</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Pending Approvals</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {customers.filter(c => c.status === 'Pending Approval').length}
                          </p>
                        </div>
                      </div>
                      <div className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <ArrowUp className="h-3 w-3 text-red-600" />
                            <span className="font-medium text-red-600">+3</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-600 mb-1">Overdue Invoices</p>
                          <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {outstandingBills.filter(bill => bill.status === 'Overdue').length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ledger-wise Outstanding */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      Ledger-wise Outstanding
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Track outstanding amounts across different ledgers</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(ledgerWiseOutstanding).map(([ledger, amount]) => (
                        <div key={ledger} className="group bg-white rounded-xl border border-slate-200 p-6 hover: transition-all duration-200 bg-slate-50 hover:scale-105">
                          <div className="flex items-center justify-between mb-3">
                            <div className="p-3 rounded-xl bg-slate-50 border border-blue-200">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="font-medium text-green-600">+5%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-600 mb-1">{ledger}</p>
                            <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              ₹{amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Risk Assessment */}
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100">
                        <ShieldIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      Customer Risk Assessment
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Monitor customer risk levels and credit utilization</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 border border-red-200 rounded-xl bg-red-50">
                        <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-red-700">High Risk</h4>
                        <p className="text-2xl font-bold text-red-600">
                          {customers.filter(c => c.riskLevel === 'High').length}
                        </p>
                        <p className="text-sm text-red-600">Customers</p>
                      </div>
                      <div className="text-center p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                        <Shield className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-yellow-700">Medium Risk</h4>
                        <p className="text-2xl font-bold text-yellow-600">
                          {customers.filter(c => c.riskLevel === 'Medium').length}
                        </p>
                        <p className="text-sm text-yellow-600">Customers</p>
                      </div>
                      <div className="text-center p-4 border border-green-200 rounded-xl bg-green-50">
                        <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-semibold text-green-700">Low Risk</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {customers.filter(c => c.riskLevel === 'Low').length}
                        </p>
                        <p className="text-sm text-green-600">Customers</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Enhanced Customers Tab */}
            {activeTab === 'customers' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      Customer Management
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Manage customer credit limits, periods, and classifications</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search customers..."
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                          <Filter className="h-4 w-4" />
                          Filter
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credit Limit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credit Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Utilization</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {filteredCustomers.map((customer) => {
                            const utilization = (customer.outstandingAmount / customer.creditLimit) * 100;
                            const creditCheck = verifyCreditLimit(customer.id, 0);
                            const periodEvaluation = evaluateCreditPeriod(customer.id);
                            const oldOutstanding = reconcileOldOutstanding(customer.id);
                           
                            return (
                              <tr key={customer.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                                    <p className="text-sm text-slate-500">{customer.contact}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getTypeBadge(customer.type)}>
                                    {customer.type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  ₹{customer.creditLimit.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  <div>
                                    <p>{customer.creditPeriod} days</p>
                                    <p className={`text-xs ${periodEvaluation.performance === 'Good' ? 'text-green-600' : 'text-red-600'}`}>
                                      {periodEvaluation.performance}
                                    </p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">₹{customer.outstandingAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
                                    {oldOutstanding.requiresFollowUp && (
                                      <p className="text-xs text-red-600">⚠️ {oldOutstanding.billCount} old bills</p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        utilization < 60 ? 'bg-green-600' :
                                        utilization < 80 ? 'bg-yellow-600' : 'bg-red-600'
                                      }`}
                                      style={{ width: `${Math.min(utilization, 100)}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">{utilization.toFixed(1)}%</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getRiskBadge(customer.riskLevel)}>
                                    {customer.riskLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getStatusBadge(customer.status)}>
                                    {customer.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setSelectedCustomer(customer)}
                                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View
                                    </button>
                                    {customer.status === 'Pending Approval' && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => approveCreditEligibility(customer.id)}
                                          className="flex items-center gap-1 text-green-600 hover:text-green-900"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => rejectCreditEligibility(customer.id)}
                                          className="flex items-center gap-1 text-red-600 hover:text-red-900"
                                        >
                                          <XCircle className="h-4 w-4" />
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Enhanced Receipts Tab with TDS */}
            {activeTab === 'receipts' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                        <Receipt className="w-4 h-4 text-green-600" />
                      </div>
                      Receipt Management
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Manage receipt entries, TDS receipts, and dishonored cheques</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-end gap-2 mb-6">
                      <button
                        onClick={() => openDialog('tdsReceipt')}
                        className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add TDS Receipt
                      </button>
                      <button
                        onClick={() => openDialog('receipt')}
                       className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Receipt
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Receipt ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">TDS Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Net Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ledger</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {receipts.map((receipt) => (
                            <tr key={receipt.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {receipt.reference}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {customers.find(c => c.id === receipt.customerId)?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{receipt.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {receipt.tdsAmount ? `₹${receipt.tdsAmount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{receipt.netAmount?.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) || receipt.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {receipt.ledger}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {receipt.date}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {receipt.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(receipt.status)}>
                                  {receipt.status === 'Cleared' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {receipt.status}
                                </span>
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
            {/* Enhanced Outstanding Tab with PO Tracking */}
            {activeTab === 'outstanding' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                        <FileCheck className="w-4 h-4 text-yellow-600" />
                      </div>
                      Outstanding Payments Tracking
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Track and reconcile outstanding bills ledger-wise with PO mapping</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Age (Days)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ledger</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {outstandingBills.map((bill) => (
                            <tr key={bill.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {bill.invoiceNo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {bill.poNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {customers.find(c => c.id === bill.customerId)?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{bill.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {bill.dueDate}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(bill.age > 30 ? 'Overdue' : 'Current')}>
                                  {bill.age}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {bill.ledger}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(bill.status)}>
                                  {bill.status === 'Current' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {bill.status}
                                </span>
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
            {/* Enhanced PDC Tab with Credit Limit Validation */}
            {activeTab === 'pdc' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                      </div>
                      PDC Management
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Manage Post Dated Cheques and ensure they don't exceed credit limits</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-end mb-6">
                      <button
                        onClick={() => openDialog('pdc')}
                       className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add PDC
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cheque No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bank</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Against Invoice</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credit Check</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {pdcEntries.map((pdc) => {
                            const creditCheck = checkPDCLimit(pdc.customerId, pdc.amount);
                            const customer = customers.find(c => c.id === pdc.customerId);
                           
                            return (
                              <tr key={pdc.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                  {pdc.chequeNo}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {customer?.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  ₹{pdc.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3 text-slate-400" />
                                    {pdc.dueDate}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {pdc.bank}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                  {pdc.againstInvoice}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {creditCheck.isValid ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Within Limit
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Exceeds Limit
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={getStatusBadge(pdc.status)}>
                                    {pdc.status === 'Pending' && <Clock className="h-3 w-3 mr-1" />}
                                    {pdc.status === 'Dishonored' && <XCircle className="h-3 w-3 mr-1" />}
                                    {pdc.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  {pdc.status === 'Pending' && (
                                    <button
                                      onClick={() => handleDishonoredCheque(pdc.id)}
                                      className="flex items-center gap-1 text-red-600 hover:text-red-900"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Mark Dishonored
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      </div>
                      Collection Management
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Track and manage collection activities</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-end mb-6">
                      <button
                        onClick={() => openDialog('collection')}
                      className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Collection
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Collector</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Next Follow-up</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {collections.map((collection) => (
                            <tr key={collection.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {customers.find(c => c.id === collection.customerId)?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{collection.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {collection.date}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {collection.method}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {collection.collector}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {collection.nextFollowUp}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(collection.status)}>
                                  {collection.status}
                                </span>
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
            {/* Purchase Orders Tab */}
            {activeTab === 'pos' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      Purchase Order Tracking
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Track POs against invoices and outstanding amounts</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outstanding</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {poInvoiceMappings.map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                {po.poNumber}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {po.customerName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{po.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {po.invoiceNo}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{po.outstanding.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {po.date}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(po.status)}>
                                  {po.status}
                                </span>
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
            {/* Returns Tab - Similar structure as other tabs */}
            {activeTab === 'returns' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                        <Package className="w-4 h-4 text-red-600" />
                      </div>
                      Return Goods Management
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Process and track return goods</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-end mb-6">
                      <button
                        onClick={() => openDialog('return')}
                       className="flex items-center gap-2 bg-[#FB9D00] text-white px-4 py-2 rounded-lg hover:bg-[#e68d00] transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Process Return
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Return ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credit Note</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {returnGoods.map((returnItem) => (
                            <tr key={returnItem.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                RT-{returnItem.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {customers.find(c => c.id === returnItem.customerId)?.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {returnItem.product}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {returnItem.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                ₹{returnItem.amount.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {returnItem.creditNote}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-slate-400" />
                                  {returnItem.date}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(returnItem.status)}>
                                  {returnItem.status === 'Processed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                  {returnItem.status}
                                </span>
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
          </div>
        </div>
      </div>
      {/* Dialogs */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {dialogType === 'newCustomer' && 'Add New Customer'}
                {dialogType === 'receipt' && 'Add New Receipt'}
                {dialogType === 'tdsReceipt' && 'Add TDS Receipt'}
                {dialogType === 'return' && 'Process Return Goods'}
                {dialogType === 'pdc' && 'Add Post Dated Cheque'}
                {dialogType === 'collection' && 'Add Collection Entry'}
              </h2>
            </div>
            <div className="p-6">
              {dialogType === 'newCustomer' && (
                <NewCustomerForm onClose={() => setIsDialogOpen(false)} />
              )}
              {dialogType === 'receipt' && (
                <ReceiptEntryForm
                  customers={customers}
                  onSubmit={handleReceiptEntry}
                  onClose={() => setIsDialogOpen(false)}
                  validateReceipt={validateReceiptEntry}
                />
              )}
              {dialogType === 'tdsReceipt' && (
                <TDSReceiptForm
                  customers={customers}
                  onSubmit={handleTDSReceipt}
                  onClose={() => setIsDialogOpen(false)}
                />
              )}
              {dialogType === 'return' && (
                <ReturnGoodsForm
                  customers={customers}
                  onSubmit={processReturnGoods}
                  onClose={() => setIsDialogOpen(false)}
                />
              )}
              {dialogType === 'pdc' && (
                <PDCEntryForm
                  customers={customers}
                  onSubmit={checkPDCLimit}
                  onClose={() => setIsDialogOpen(false)}
                />
              )}
              {dialogType === 'collection' && (
                <CollectionEntryForm
                  customers={customers}
                  onSubmit={manageCollection}
                  onClose={() => setIsDialogOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Customer Detail View */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h2 className="text-xl font-semibold text-slate-900">Customer Details - {selectedCustomer.name}</h2>
              </div>
            </div>
            <div className="p-6">
              <CustomerDetailView
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                creditCheck={verifyCreditLimit(selectedCustomer.id, 0)}
                periodEvaluation={evaluateCreditPeriod(selectedCustomer.id)}
                oldOutstanding={reconcileOldOutstanding(selectedCustomer.id)}
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