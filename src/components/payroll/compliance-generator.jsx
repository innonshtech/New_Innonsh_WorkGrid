'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import {
  Save, X, FileText, Calendar, CheckCircle, AlertCircle, Plus, Minus,
  Upload, ArrowLeft, TrendingUp, Shield, Settings, Clock, User
} from 'lucide-react';

export default function ComplianceGenerator() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    reportType: 'Monthly',
    period: {
      from: new Date().toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    },
    complianceItems: [
      {
        regulation: 'PF Compliance',
        requirement: 'Monthly PF filing',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      },
      {
        regulation: 'ESI Compliance',
        requirement: 'Monthly ESI filing',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      }
    ],
    notes: '',
    attachments: []
  });

  const [overallStatus, setOverallStatus] = useState('Partially Compliant');

  useEffect(() => {
    calculateOverallStatus();
  }, [formData.complianceItems]);

  const calculateOverallStatus = () => {
    const items = formData.complianceItems;
    if (items.every(item => item.status === 'Compliant')) {
      setOverallStatus('Compliant');
    } else if (items.every(item => item.status === 'Non-Compliant')) {
      setOverallStatus('Non-Compliant');
    } else {
      setOverallStatus('Partially Compliant');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    if (name.startsWith('period.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        period: {
          ...prev.period,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleComplianceItemChange = (index, field, value) => {
    const newItems = [...formData.complianceItems];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, complianceItems: newItems }));
  };

  const addComplianceItem = () => {
    setFormData(prev => ({
      ...prev,
      complianceItems: [
        ...prev.complianceItems,
        {
          regulation: '',
          requirement: '',
          status: 'In Progress',
          dueDate: new Date().toISOString().split('T')[0],
          notes: ''
        }
      ]
    }));
  };

  const removeComplianceItem = (index) => {
    setFormData(prev => ({
      ...prev,
      complianceItems: prev.complianceItems.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      filename: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date()
    }));

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reportType) newErrors.reportType = 'Report type is required';
    if (!formData.period.from) newErrors['period.from'] = 'Start date is required';
    if (!formData.period.to) newErrors['period.to'] = 'End date is required';
    if (new Date(formData.period.from) > new Date(formData.period.to)) {
      newErrors['period.to'] = 'End date must be after start date';
    }
    if (formData.complianceItems.length === 0) {
      newErrors.complianceItems = 'At least one compliance item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        overallStatus
      };

      const response = await fetch('/api/v1/admin/payroll/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log('Compliance report generated successfully');
        alert('Compliance report generated successfully!');
        handleBack();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      alert('An error occurred while generating the compliance report');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const statusOptions = ['Compliant', 'Non-Compliant', 'In Progress', 'Not Applicable'];
  const reportTypes = ['Monthly', 'Quarterly', 'Annual', 'Ad-hoc'];

  const getFormProgress = () => {
    const requiredFields = [
      formData.reportType,
      formData.period.from,
      formData.period.to,
      formData.complianceItems.length > 0
    ];

    const completedFields = requiredFields.filter(field => field).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const progress = getFormProgress();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Compliant': return 'text-green-700 bg-green-50 border-green-200';
      case 'Non-Compliant': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-amber-700 bg-amber-50 border-amber-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Compliant': return CheckCircle;
      case 'Non-Compliant': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-yellow-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Compliance Report Generator</h1>
                <p className="text-slate-600 text-sm mt-0.5">Create comprehensive regulatory compliance reports</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">

              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Report Generation Progress</h3>
            <span className="text-sm font-medium text-slate-600">{progress}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div className={`flex items-center space-x-2 ${formData.reportType ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.reportType ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Report Type Set</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.period.from && formData.period.to ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.period.from && formData.period.to ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Period Defined</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.complianceItems.length > 0 ? 'text-green-700' : 'text-slate-500'}`}>
              {formData.complianceItems.length > 0 ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Items Added</span>
            </div>
            <div className={`flex items-center space-x-2 ${overallStatus ? 'text-green-700' : 'text-slate-500'}`}>
              {overallStatus ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>}
              <span>Ready to Generate</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Report Configuration Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center border border-yellow-100">
                    <FileText className="w-4 h-4 text-yellow-600" />
                  </div>
                  Report Configuration
                </h2>
                <p className="text-slate-600 text-sm mt-1">Set report type and period</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleChange}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors bg-white ${errors.reportType ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                      }`}
                  >
                    {reportTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.reportType && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.reportType}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      From Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="period.from"
                        type="date"
                        value={formData.period.from}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors['period.from'] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                          }`}
                      />
                    </div>
                    {errors['period.from'] && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors['period.from']}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">
                      To Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="period.to"
                        type="date"
                        value={formData.period.to}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${errors['period.to'] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'
                          }`}
                      />
                    </div>
                    {errors['period.to'] && (
                      <div className="flex items-center space-x-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors['period.to']}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Status Card */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Compliance Status
                </h3>
              </div>

              <div className="p-6">
                <div className={`p-4 rounded-lg border-2 ${getStatusColor(overallStatus)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {React.createElement(getStatusIcon(overallStatus), { className: "w-5 h-5" })}
                    <span className="font-semibold">{overallStatus}</span>
                  </div>
                  <p className="text-sm">
                    {overallStatus === 'Compliant'
                      ? 'All compliance items are completed successfully'
                      : overallStatus === 'Non-Compliant'
                        ? 'Critical compliance items are pending or failed'
                        : 'Some compliance items require attention'
                    }
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-medium">{formData.complianceItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Compliant:</span>
                    <span className="font-medium text-green-600">
                      {formData.complianceItems.filter(item => item.status === 'Compliant').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">In Progress:</span>
                    <span className="font-medium text-amber-600">
                      {formData.complianceItems.filter(item => item.status === 'In Progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Non-Compliant:</span>
                    <span className="font-medium text-red-600">
                      {formData.complianceItems.filter(item => item.status === 'Non-Compliant').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Compliance Items */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      Compliance Requirements
                    </h2>
                    <p className="text-slate-600 text-sm mt-1">Define regulatory compliance items and their status</p>
                  </div>
                  <button
                    type="button"
                    onClick={addComplianceItem}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 border border-yellow-200 text-sm font-medium transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {formData.complianceItems.map((item, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-900">Compliance Item {index + 1}</h4>
                      {index >= 2 && (
                        <button
                          type="button"
                          onClick={() => removeComplianceItem(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-600">Regulation</label>
                        <input
                          type="text"
                          placeholder="e.g., PF Compliance"
                          value={item.regulation}
                          onChange={(e) => handleComplianceItemChange(index, 'regulation', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-600">Requirement</label>
                        <input
                          type="text"
                          placeholder="e.g., Monthly filing"
                          value={item.requirement}
                          onChange={(e) => handleComplianceItemChange(index, 'requirement', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-600">Status</label>
                        <select
                          value={item.status}
                          onChange={(e) => handleComplianceItemChange(index, 'status', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                        >
                          {statusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-600">Due Date</label>
                        <input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => handleComplianceItemChange(index, 'dueDate', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-600">Notes (Optional)</label>
                      <input
                        type="text"
                        placeholder="Additional notes or comments"
                        value={item.notes}
                        onChange={(e) => handleComplianceItemChange(index, 'notes', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                  </div>
                ))}

                {errors.complianceItems && (
                  <div className="flex items-center space-x-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{errors.complianceItems}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments & Notes */}
            <div className="bg-white rounded-xl border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center border border-green-100">
                    <Upload className="w-4 h-4 text-green-600" />
                  </div>
                  Attachments & Notes
                </h2>
                <p className="text-slate-600 text-sm mt-1">Add supporting documents and additional notes</p>
              </div>

              <div className="p-6 space-y-6">
                {/* File Upload */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-700">Supporting Documents</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-yellow-400 transition-colors">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">Drag & drop files here or click to browse</p>
                    <p className="text-xs text-slate-500 mb-4">Supports PDF, DOC, XLS, and image files</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="file-upload">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        Choose Files
                      </div>
                    </label>
                  </div>

                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">Uploaded Files ({formData.attachments.length})</p>
                      <div className="space-y-2">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-900 truncate">{file.filename}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Report Notes */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Report Notes</label>
                  <textarea
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
                    placeholder="Add any additional notes, observations, or recommendations for this compliance report..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    const draft = {
                      ...formData,
                      overallStatus,
                      savedAt: new Date().toISOString()
                    };
                    localStorage.setItem('compliance_draft', JSON.stringify(draft));
                    alert('Draft saved successfully!');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Draft
                </button>

                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}