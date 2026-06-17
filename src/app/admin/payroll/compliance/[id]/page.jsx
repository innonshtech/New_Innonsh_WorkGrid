'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Download, ArrowLeft, Printer, FileText, Shield,
  Calendar, CheckCircle, AlertCircle, Loader2, Receipt,
  Edit2, Trash2, Save
} from 'lucide-react';

export default function ComplianceReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complianceReport, setComplianceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch compliance report
  useEffect(() => {
    async function fetchComplianceReport() {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/admin/payroll/compliance/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch compliance report');
        }
        const data = await response.json();
        console.log('Fetched compliance report:', data); // Debug log
        setComplianceReport(data);
        setFormData({
          reportType: data.reportType || '',
          period: {
            from: data.period?.from ? new Date(data.period.from).toISOString().split('T')[0] : '',
            to: data.period?.to ? new Date(data.period.to).toISOString().split('T')[0] : '',
          },
          complianceItems: data.complianceItems || [],
          overallStatus: data.overallStatus || '',
          notes: data.notes || '',
          attachments: data.attachments || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchComplianceReport();
    }
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle period date changes
  const handlePeriodChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      period: { ...prev.period, [name]: value },
    }));
  };

  // Handle compliance items change
  const handleComplianceItemChange = (index, field, value) => {
    setFormData((prev) => {
      const newItems = [...prev.complianceItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, complianceItems: newItems };
    });
  };

  // Add a new compliance item
  const addComplianceItem = () => {
    setFormData((prev) => ({
      ...prev,
      complianceItems: [...prev.complianceItems, { regulation: '', requirement: '', status: 'In Progress', dueDate: '', notes: '' }],
    }));
  };

  // Remove a compliance item
  const removeComplianceItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      complianceItems: prev.complianceItems.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission for updating compliance report
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/compliance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update compliance report');
      }
      const updatedData = await response.json();
      setComplianceReport(updatedData);
      setIsEditing(false);
      alert('Compliance report updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion of compliance report
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/v1/admin/payroll/compliance/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete compliance report');
      }
      alert('Compliance report deleted successfully');
      router.push('/payroll/compliance');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit',
      month: 'long',
      year: 'numeric',
    }) : 'N/A';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Compliant: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      'Non-Compliant': { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
      'In Progress': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileText },
      'Not Applicable': { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: FileText },
      Draft: { color: 'bg-blue-50 text-slate-700 border-slate-200', icon: FileText },
      Submitted: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
      Approved: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      Rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
      Filed: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FileText },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig['In Progress'];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium border ${color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const getProgressBar = (status) => {
    const progressConfig = {
      Compliant: { percentage: 100, color: 'bg-green-500' },
      'Non-Compliant': { percentage: 0, color: 'bg-red-500' },
      'In Progress': { percentage: 50, color: 'bg-indigo-500' },
      'Not Applicable': { percentage: 0, color: 'bg-gray-500' },
    };

    const { percentage, color } = progressConfig[status] || progressConfig['In Progress'];

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 rounded-full h-2.5">
          <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="text-sm font-medium text-slate-900">{status}</span>
      </div>
    );
  };

  const generatePDFContent = () => {
    if (!complianceReport) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Compliance Report - ${complianceReport.reportId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #ffffff;
          }
          
          .pdf-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          
          .header {
            border-bottom: 3px solid #eab308;
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          
          .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
          }
          
          .company-info p {
            color: #64748b;
            font-size: 14px;
          }
          
          .compliance-title {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #fbbf24;
            margin-top: 15px;
          }
          
          .compliance-title h2 {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
          }
          
          .document-info {
            text-align: right;
          }
          
          .document-info p {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #f1f5f9;
            display: flex;
            align-items: center;
          }
          
          .section-icon {
            width: 20px;
            height: 20px;
            background: #fef3c7;
            border-radius: 4px;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .info-group {
            margin-bottom: 20px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            color: #64748b;
            font-size: 14px;
            flex: 1;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
            text-align: right;
            flex: 1;
          }
          
          .details-section {
            background: #f0f7ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
          }
          
          .section-header {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1d4ed8;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .notes {
            flex: 1;
            margin-right: 40px;
          }
          
          .notes h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #1e293b;
          }
          
          .notes-content {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
          }
          
          .signature {
            text-align: center;
            min-width: 150px;
          }
          
          .signature-line {
            border-bottom: 2px solid #64748b;
            height: 60px;
            margin-bottom: 10px;
          }
          
          .signature-title {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 3px;
          }
          
          .signature-dept {
            font-size: 10px;
            color: #64748b;
          }
          
          @media print {
            .pdf-container {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <!-- Header -->
          <div class="header">
            <div class="company-header">
              <div class="company-info">
                <h1>SupplyChainPro</h1>
                <p>Business Management Suite</p>
                <div class="compliance-title">
                  <h2>Compliance Report - ${complianceReport.reportType} (${formatDate(complianceReport.period?.from)} to ${formatDate(complianceReport.period?.to)})</h2>
                </div>
              </div>
              <div class="document-info">
                <p><strong>Compliance Report ID:</strong> ${complianceReport.reportId}</p>
                <p><strong>Generated on:</strong> ${formatDate(complianceReport.createdAt)}</p>
                <span class="status-badge">${complianceReport.overallStatus}</span>
              </div>
            </div>
          </div>

          <!-- Compliance Information -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">🛡️</span>
              Compliance Information
            </h3>
            <div class="info-group">
              <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">Compliance Details</h4>
              <div class="info-row">
                <span class="info-label">Report ID:</span>
                <span class="info-value">${complianceReport.reportId || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Compliance Type:</span>
                <span class="info-value">${complianceReport.reportType || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Compliance Period:</span>
                <span class="info-value">${formatDate(complianceReport.period?.from)} to ${formatDate(complianceReport.period?.to)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="info-value">${complianceReport.overallStatus || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Generated By:</span>
                <span class="info-value">${complianceReport.generatedBy?.name || 'N/A'}</span>
              </div>
              ${complianceReport.reviewedBy ? `
              <div class="info-row">
                <span class="info-label">Reviewed By:</span>
                <span class="info-value">${complianceReport.reviewedBy.name || 'N/A'}</span>
              </div>
              ` : ''}
              ${complianceReport.approvedBy ? `
              <div class="info-row">
                <span class="info-label">Approved By:</span>
                <span class="info-value">${complianceReport.approvedBy.name || 'N/A'}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Last Updated:</span>
                <span class="info-value">${formatDate(complianceReport.updatedAt)}</span>
              </div>
            </div>
          </div>

          <!-- Compliance Breakdown -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">🛡️</span>
              Compliance Breakdown
            </h3>
            <div class="details-section">
              <div class="section-header">Compliance Details</div>
              ${complianceReport.complianceItems?.map(detail => `
                <div class="amount-row">
                  <span>${detail.regulation || 'N/A'}</span>
                  <span>${detail.status || 'N/A'}</span>
                </div>
                ${detail.requirement ? `
                <div class="amount-row">
                  <span>Requirement: ${detail.requirement}</span>
                  <span></span>
                </div>
                ` : ''}
                ${detail.dueDate ? `
                <div class="amount-row">
                  <span>Due Date: ${formatDate(detail.dueDate)}</span>
                  <span></span>
                </div>
                ` : ''}
                ${detail.notes ? `
                <div class="amount-row">
                  <span>Notes: ${detail.notes}</span>
                  <span></span>
                </div>
                ` : ''}
              `).join('') || '<div class="amount-row"><span>No compliance details</span><span>N/A</span></div>'}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="notes">
              <h4>Notes</h4>
              <div class="notes-content">
                ${complianceReport.notes || 'This is a computer-generated compliance report and does not require signature.'}
              </div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-title">Authorized Signatory</div>
              <div class="signature-dept">SupplyChainPro HR Department</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    if (!complianceReport) return;

    setGeneratingPdf(true);
    try {
      const jsPDF = (await import('jspdf/dist/jspdf.es.min.js')).default;
      const html2canvas = (await import('html2canvas')).default;
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(generatePDFContent());
      iframeDoc.close();

      await new Promise(resolve => {
        iframe.onload = resolve;
        setTimeout(resolve, 1000);
      });

      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: iframeDoc.body.scrollHeight,
      });

      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      const fileName = `compliance-report-${complianceReport.reportId}-${complianceReport.reportType}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePDFContent());
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">Loading compliance report...</span>
        </div>
      </div>
    );
  }

  if (error || !complianceReport) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Compliance Report Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The requested compliance report could not be found.'}</p>
          <Link
            href="/payroll/compliance"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Compliance Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link
                href="/payroll/compliance"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Compliance Report</h1>
                  <p className="text-slate-600">{complianceReport.reportId}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-blue-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-blue-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-blue-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Compliance Report</h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Compliance Type</label>
                <input
                  type="text"
                  name="reportType"
                  value={formData.reportType || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Monthly"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period From</label>
                <input
                  type="date"
                  name="from"
                  value={formData.period?.from || ''}
                  onChange={handlePeriodChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period To</label>
                <input
                  type="date"
                  name="to"
                  value={formData.period?.to || ''}
                  onChange={handlePeriodChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  name="overallStatus"
                  value={formData.overallStatus || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Compliant">Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Applicable">Not Applicable</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Filed">Filed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  rows="4"
                />
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Compliance Items</h3>
                {formData.complianceItems?.map((item, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Regulation</label>
                        <input
                          type="text"
                          value={item.regulation || ''}
                          onChange={(e) => handleComplianceItemChange(index, 'regulation', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., PF Compliance"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Requirement</label>
                        <input
                          type="text"
                          value={item.requirement || ''}
                          onChange={(e) => handleComplianceItemChange(index, 'requirement', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., Monthly PF filing"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select
                          value={item.status || ''}
                          onChange={(e) => handleComplianceItemChange(index, 'status', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="Compliant">Compliant</option>
                          <option value="Non-Compliant">Non-Compliant</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                        <input
                          type="date"
                          value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleComplianceItemChange(index, 'dueDate', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleComplianceItemChange(index, 'notes', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComplianceItem(index)}
                      className="mt-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove Item
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addComplianceItem}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  Add Compliance Item
                </button>
              </div>
              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-blue-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Deletion</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this compliance report? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-blue-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Report Document */}
        <div className="bg-white rounded-xl border border-slate-200 print:">
          {/* Document Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">SupplyChainPro</h2>
                <p className="text-slate-600">Business Management Suite</p>
                <p className="text-slate-600 font-medium mt-2">
                  Compliance Report - {complianceReport.reportType} ({formatDate(complianceReport.period?.from)} to {formatDate(complianceReport.period?.to)})
                </p>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Compliance Report ID: <span className="font-medium">{complianceReport.reportId}</span></p>
                  <p className="text-sm text-slate-600">Generated on: <span className="font-medium">{formatDate(complianceReport.createdAt)}</span></p>
                  {getStatusBadge(complianceReport.overallStatus)}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Information */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-3 h-3 text-green-600" />
              </div>
              Compliance Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Report ID: {complianceReport.reportId || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Compliance Type: {complianceReport.reportType || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Compliance Period: {formatDate(complianceReport.period?.from)} to {formatDate(complianceReport.period?.to)}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Status: {complianceReport.overallStatus || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Generated By: {complianceReport.generatedBy?.name || 'N/A'}</span>
              </div>
              {complianceReport.reviewedBy && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Reviewed By: {complianceReport.reviewedBy?.name || 'N/A'}</span>
                </div>
              )}
              {complianceReport.approvedBy && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Approved By: {complianceReport.approvedBy?.name || 'N/A'}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Last Updated: {formatDate(complianceReport.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* Compliance Breakdown */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Shield className="w-3 h-3 text-indigo-600" />
              </div>
              Compliance Breakdown
            </h3>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-200 rounded-lg flex items-center justify-center">
                  <FileText className="w-3 h-3 text-blue-700" />
                </div>
                Compliance Details
              </h4>
              <div className="space-y-3">
                {complianceReport.complianceItems?.map((detail, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">{detail.regulation || 'N/A'}</span>
                      {getProgressBar(detail.status || 'In Progress')}
                    </div>
                    {detail.requirement && (
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Requirement: {detail.requirement}</span>
                        <span></span>
                      </div>
                    )}
                    {detail.dueDate && (
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Due Date: {formatDate(detail.dueDate)}</span>
                        <span></span>
                      </div>
                    )}
                    {detail.notes && (
                      <div className="flex justify-between items-center text-sm text-slate-600">
                        <span>Notes: {detail.notes}</span>
                        <span></span>
                      </div>
                    )}
                  </div>
                )) || (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">No compliance details</span>
                      {getProgressBar('In Progress')}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Notes</h4>
                <div className="p-4 bg-blue-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    {complianceReport.notes || 'This is a computer-generated compliance report and does not require signature.'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="text-center">
                  <div className="w-32 h-16 border-b-2 border-slate-300 mb-3"></div>
                  <p className="text-sm font-semibold text-slate-900">Authorized Signatory</p>
                  <p className="text-xs text-slate-500">SupplyChainPro HR Department</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white rounded-xl border border-slate-200 mt-8">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <p className="text-slate-600 text-sm mt-1">Common actions for this compliance report</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  {generatingPdf ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Download className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <span className="font-medium text-slate-900">
                  {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
                </span>
                <span className="text-sm text-slate-600 mt-1">Save compliance report as PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <Printer className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-slate-900">Print Compliance Report</span>
                <span className="text-sm text-slate-600 mt-1">Print physical copy</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <Edit2 className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="font-medium text-slate-900">{isEditing ? 'Cancel Edit' : 'Edit Compliance Report'}</span>
                <span className="text-sm text-slate-600 mt-1">Modify compliance report details</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <span className="font-medium text-red-900">Delete Compliance Report</span>
                <span className="text-sm text-red-600 mt-1">Remove this record</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}