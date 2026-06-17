'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar, Save, X, FileText, Clock,
  User, Calculator, Upload, Loader2,
  CheckCircle, AlertTriangle, Info,
  Phone, MapPin, Building, Target
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function LeaveApplicationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [formData, setFormData] = useState({
    leaveType: 'Casual',
    startDate: '',
    endDate: '',
    reason: '',
    contactNumber: '',
    addressDuringLeave: '',
    isAdvanceLeave: false,
    attachments: []
  });

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  const fetchLeaveBalance = async () => {
    try {
      // Mock leave balance data
      setLeaveBalance({
        casual: 12,
        sick: 7,
        earned: 18,
        maternity: 180,
        paternity: 15
      });
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateTotalDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalDays = calculateTotalDays();
      const payload = {
        ...formData,
        totalDays,
        status: 'Pending'
      };

      const response = await fetch('/api/v1/admin/payroll/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Leave application submitted successfully!');
        router.push('/dashboard/payroll/leaves');
      } else {
        const data = await response.json();
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting leave application:', error);
      toast.error('An error occurred while submitting the leave application');
    } finally {
      setLoading(false);
    }
  };

  const totalDays = calculateTotalDays();
  const remainingBalance = leaveBalance[formData.leaveType.toLowerCase()] || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Apply for Leave</h1>
                <p className="text-slate-600">Submit a new leave application request</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leave Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <FileText className="w-4 h-4 text-yellow-600" />
                  </div>
                  Leave Application Form
                </h2>
                <p className="text-slate-600 text-sm mt-1">Fill in all required information for your leave request</p>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Leave Type and Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Leave Type *
                      </label>
                      <select
                        name="leaveType"
                        value={formData.leaveType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        required
                      >
                        <option value="Casual">Casual Leave</option>
                        <option value="Sick">Sick Leave</option>
                        <option value="Earned">Earned Leave</option>
                        <option value="Maternity">Maternity Leave</option>
                        <option value="Paternity">Paternity Leave</option>
                        <option value="Bereavement">Bereavement Leave</option>
                        <option value="Compensatory">Compensatory Leave</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Number *
                      </label>
                      <input
                        name="contactNumber"
                        type="tel"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="Your contact number"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Start Date *
                      </label>
                      <input
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        End Date *
                      </label>
                      <input
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Duration Display */}
                  {totalDays > 0 && (
                    <div className="bg-slate-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-700">
                        <Calculator className="w-4 h-4" />
                        <span className="font-medium">Leave Duration: {totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Reason for Leave *
                    </label>
                    <textarea
                      name="reason"
                      rows={4}
                      value={formData.reason}
                      onChange={handleChange}
                      placeholder="Please provide detailed reason for your leave request..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                      required
                    />
                  </div>

                  {/* Address During Leave */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address During Leave
                    </label>
                    <textarea
                      name="addressDuringLeave"
                      rows={3}
                      value={formData.addressDuringLeave}
                      onChange={handleChange}
                      placeholder="Your contact address during the leave period..."
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                    />
                  </div>

                  {/* Advance Leave Checkbox */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <input
                        name="isAdvanceLeave"
                        type="checkbox"
                        checked={formData.isAdvanceLeave}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-yellow-600 bg-white border-slate-300 rounded focus:ring-yellow-500 focus:ring-2"
                      />
                      <div>
                        <label className="text-sm font-medium text-slate-900 cursor-pointer">
                          This is an advance leave application
                        </label>
                        <p className="text-xs text-slate-600 mt-1">
                          Check this if you're applying for leave that exceeds your current balance
                        </p>
                      </div>
                    </div>

                    {formData.isAdvanceLeave && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Advance Leave Notice</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Advance leave applications require special approval and will be deducted from future leave balance.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Supporting Documents (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1">Upload supporting documents</p>
                      <p className="text-xs text-slate-600 mb-4">Drag and drop files here or click to browse</p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 px-4 py-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-sm font-medium border border-yellow-200 transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                          Choose Files
                        </button>
                      </label>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg font-medium border border-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Submit Application
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar - Leave Information */}
          <div className="space-y-6">
            {/* Leave Balance Card */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-3 h-3 text-blue-600" />
                  </div>
                  Leave Balance
                </h3>
                <p className="text-slate-600 text-sm mt-1">Your available leave days</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(leaveBalance).map(([type, balance]) => (
                    <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700 capitalize">{type} Leave</span>
                      <span className="text-sm font-bold text-slate-900 bg-white px-2 py-1 rounded border">
                        {balance} days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Application Summary */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-3 h-3 text-yellow-600" />
                  </div>
                  Application Summary
                </h3>
                <p className="text-slate-600 text-sm mt-1">Current application details</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Leave Type</span>
                    <span className="text-sm font-medium text-slate-900">{formData.leaveType || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Total Days</span>
                    <span className="text-sm font-medium text-slate-900">{totalDays || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Available Balance</span>
                    <span className="text-sm font-medium text-slate-900">{remainingBalance} days</span>
                  </div>
                  {totalDays > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600">After Leave</span>
                      <span className={`text-sm font-medium ${totalDays > remainingBalance ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {remainingBalance - totalDays} days
                      </span>
                    </div>
                  )}
                </div>

                {totalDays > remainingBalance && totalDays > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Insufficient Balance</span>
                    </div>
                    <p className="text-xs text-red-600">
                      You're applying for more days than available.
                      {formData.isAdvanceLeave
                        ? ' This will be processed as advance leave.'
                        : ' Consider enabling advance leave option.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Leave Policy */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <Info className="w-3 h-3 text-green-600" />
                  </div>
                  Leave Policy
                </h3>
                <p className="text-slate-600 text-sm mt-1">Important guidelines</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-700">Casual leave: Maximum 3 consecutive days</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-700">Sick leave: Medical certificate required for 3+ days</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-700">Advance leave: Maximum 5 days, requires approval</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-700">Apply at least 2 days in advance for planned leaves</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}