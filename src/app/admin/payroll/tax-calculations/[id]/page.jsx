'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Download, ArrowLeft, Printer, FileText, Calculator,
  User, Calendar, IndianRupee, CheckCircle, Percent,
  Receipt, Building, Mail, Phone, IdCard, Save, Trash2,
  Loader2, AlertCircle, Edit2
} from 'lucide-react';

export default function TaxCalculationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [taxCalculation, setTaxCalculation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch tax calculation
  useEffect(() => {
    async function fetchTaxCalculation() {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/admin/payroll/taxes/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tax calculation');
        }
        const data = await response.json();
        setTaxCalculation(data);
        setFormData({
          financialYear: data.financialYear,
          totalEarnings: data.totalEarnings,
          totalDeductions: data.totalDeductions,
          taxableIncome: data.taxableIncome,
          totalTax: data.totalTax,
          status: data.status,
          notes: data.notes,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTaxCalculation();
    }
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for updating tax calculation
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/payroll/taxes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tax calculation');
      }
      const updatedData = await response.json();
      setTaxCalculation(updatedData);
      setIsEditing(false);
      alert('Tax calculation updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion of tax calculation
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/v1/admin/payroll/taxes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete tax calculation');
      }
      alert('Tax calculation deleted successfully');
      router.push('/payroll/tax-calculations');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Calculated: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Calculator },
      Reviewed: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileText },
      Approved: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      Filed: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FileText },
    };

    const { color, icon: Icon } = statusConfig[status] || statusConfig.Calculated;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium border ${color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  const generatePDFContent = () => {
    if (!taxCalculation) return '';

    const totalTax = taxCalculation.totalTax || 0;
    const totalEarnings = taxCalculation.totalEarnings || 0;
    const totalDeductions = taxCalculation.totalDeductions || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Tax Calculation - ${taxCalculation._id}</title>
        <style>
          /* Same styles as provided in the original code */
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
          
          .tax-title {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #fbbf24;
            margin-top: 15px;
          }
          
          .tax-title h2 {
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
          
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 20px;
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
          
          .earnings-section {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
          }
          
          .deductions-section {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
          }
          
          .section-header {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #166534;
          }
          
          .deductions-section .section-header {
            color: #dc2626;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          
          .total-row {
            border-top: 2px solid #16a34a;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: 600;
            font-size: 15px;
            color: #166534;
          }
          
          .deductions-section .total-row {
            border-top-color: #dc2626;
            color: #dc2626;
          }
          
          .net-amount {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          
          .net-amount h3 {
            font-size: 20px;
            color: #92400e;
            margin-bottom: 10px;
          }
          
          .net-amount-value {
            font-size: 36px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          
          .amount-words {
            font-size: 12px;
            color: #a16207;
            font-style: italic;
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
                <div class="tax-title">
                  <h2>Tax Calculation for Financial Year ${taxCalculation.financialYear}</h2>
                </div>
              </div>
              <div class="document-info">
                <p><strong>Tax Calculation ID:</strong> ${taxCalculation._id}</p>
                <p><strong>Generated on:</strong> ${formatDate(taxCalculation.createdAt)}</p>
                <span class="status-badge">${taxCalculation.status}</span>
              </div>
            </div>
          </div>

          <!-- Employee Information -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">👤</span>
              Employee & Calculation Information
            </h3>
            <div class="two-column">
              <div class="info-group">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">Employee Details</h4>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${taxCalculation.employee?.personalDetails?.firstName} ${taxCalculation.employee?.personalDetails?.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Employee ID:</span>
                  <span class="info-value">${taxCalculation.employee?.employeeId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${taxCalculation.employee?.personalDetails?.email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${taxCalculation.employee?.personalDetails?.phone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Department:</span>
                  <span class="info-value">${taxCalculation.employee?.jobDetails?.department} - ${taxCalculation.employee?.jobDetails?.designation}</span>
                </div>
              </div>
              <div class="info-group">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">Calculation Details</h4>
                <div class="info-row">
                  <span class="info-label">Financial Year:</span>
                  <span class="info-value">FY ${taxCalculation.financialYear}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Calculated By:</span>
                  <span class="info-value">${taxCalculation.calculatedBy?.name}</span>
                </div>
                ${taxCalculation.reviewedBy ? `
                <div class="info-row">
                  <span class="info-label">Reviewed By:</span>
                  <span class="info-value">${taxCalculation.reviewedBy.name}</span>
                </div>
                ` : ''}
                ${taxCalculation.approvedBy ? `
                <div class="info-row">
                  <span class="info-label">Approved By:</span>
                  <span class="info-value">${taxCalculation.approvedBy.name}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Last Updated:</span>
                  <span class="info-value">${formatDate(taxCalculation.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tax Breakdown -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">💰</span>
              Tax Breakdown
            </h3>
            <div class="two-column">
              <div class="earnings-section">
                <div class="section-header">Earnings</div>
                <div class="amount-row">
                  <span>Total Earnings</span>
                  <span>${formatCurrency(totalEarnings)}</span>
                </div>
                <div class="amount-row total-row">
                  <span><strong>Total Earnings</strong></span>
                  <span><strong>${formatCurrency(totalEarnings)}</strong></span>
                </div>
              </div>
              
              <div class="deductions-section">
                <div class="section-header">Deductions</div>
                <div class="amount-row">
                  <span>Total Deductions</span>
                  <span>-${formatCurrency(totalDeductions)}</span>
                </div>
                <div class="amount-row total-row">
                  <span><strong>Total Deductions</strong></span>
                  <span><strong>-${formatCurrency(totalDeductions)}</strong></span>
                </div>
              </div>
            </div>
            <div class="earnings-section" style="margin-top: 20px;">
              <div class="section-header">Tax Details</div>
              ${taxCalculation.taxDetails?.map(detail => `
                <div class="amount-row">
                  <span>${detail.type}</span>
                  <span>${formatCurrency(detail.amount)}</span>
                </div>
                ${detail.calculationMethod ? `
                <div class="amount-row">
                  <span>Method: ${detail.calculationMethod}</span>
                  <span></span>
                </div>
                ` : ''}
                ${detail.applicableFrom ? `
                <div class="amount-row">
                  <span>From: ${formatDate(detail.applicableFrom)}</span>
                  <span></span>
                </div>
                ` : ''}
                ${detail.applicableTo ? `
                <div class="amount-row">
                  <span>To: ${formatDate(detail.applicableTo)}</span>
                  <span></span>
                </div>
                ` : ''}
              `).join('') || '<div class="amount-row"><span>No tax details</span><span>₹0</span></div>'}
            </div>
          </div>

          <!-- Net Taxable Income -->
          <div class="net-amount">
            <h3>Net Taxable Income</h3>
            <div class="net-amount-value">${formatCurrency(taxCalculation.taxableIncome)}</div>
            <div class="amount-words">${amountToWords(taxCalculation.taxableIncome)}</div>
          </div>

          <!-- Total Tax -->
          <div class="net-amount">
            <h3>Total Tax Payable</h3>
            <div class="net-amount-value">${formatCurrency(totalTax)}</div>
            <div class="amount-words">${amountToWords(totalTax)}</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="notes">
              <h4>Notes</h4>
              <div class="notes-content">
                ${taxCalculation.notes || 'This is a computer-generated tax calculation and does not require signature.'}
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
    if (!taxCalculation) return;

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

      const fileName = `tax-calculation-${taxCalculation._id}-FY${taxCalculation.financialYear}.pdf`;
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

  const amountToWords = (amount) => {
    if (amount === 0) return 'Zero Rupees';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertLessThanOneThousand(number) {
      let result = '';

      if (number >= 100) {
        result += units[Math.floor(number / 100)] + ' Hundred ';
        number %= 100;
      }

      if (number >= 20) {
        result += tens[Math.floor(number / 10)] + ' ';
        number %= 10;
      } else if (number >= 10) {
        result += teens[number - 10] + ' ';
        number = 0;
      }

      if (number > 0) {
        result += units[number] + ' ';
      }

      return result.trim();
    }

    let words = '';
    let num = Math.floor(amount);

    if (num >= 10000000) {
      words += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }

    if (num >= 100000) {
      words += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }

    if (num >= 1000) {
      words += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }

    if (num > 0) {
      words += convertLessThanOneThousand(num);
    }

    words = words.trim() + ' Rupees';

    const paise = Math.round((amount - Math.floor(amount)) * 100);
    if (paise > 0) {
      words += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
    }

    return words;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-slate-600 font-medium">Loading tax calculation...</span>
        </div>
      </div>
    );
  }

  if (error || !taxCalculation) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tax Calculation Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The requested tax calculation could not be found.'}</p>
          <Link
            href="/payroll/tax-calculations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tax Calculations
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
                href="/payroll/tax-calculations"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-amber-500 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Tax Calculation</h1>
                  <p className="text-slate-600">{taxCalculation._id}</p>
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
            <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Tax Calculation</h2>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Financial Year</label>
                <input
                  type="text"
                  name="financialYear"
                  value={formData.financialYear || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 2023-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Earnings</label>
                <input
                  type="number"
                  name="totalEarnings"
                  value={formData.totalEarnings || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Deductions</label>
                <input
                  type="number"
                  name="totalDeductions"
                  value={formData.totalDeductions || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Taxable Income</label>
                <input
                  type="number"
                  name="taxableIncome"
                  value={formData.taxableIncome || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Tax</label>
                <input
                  type="number"
                  name="totalTax"
                  value={formData.totalTax || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Calculated">Calculated</option>
                  <option value="Reviewed">Reviewed</option>
                  <option value="Approved">Approved</option>
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
                Are you sure you want to delete this tax calculation? This action cannot be undone.
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

        {/* Tax Calculation Document */}
        <div className="bg-white rounded-xl border border-slate-200 print:">
          {/* Document Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">SupplyChainPro</h2>
                <p className="text-slate-600">Business Management Suite</p>
                <p className="text-slate-600 font-medium mt-2">
                  Tax Calculation for Financial Year {taxCalculation.financialYear}
                </p>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Tax Calculation ID: <span className="font-medium">{taxCalculation._id}</span></p>
                  <p className="text-sm text-slate-600">Generated on: <span className="font-medium">{formatDate(taxCalculation.createdAt)}</span></p>
                  {getStatusBadge(taxCalculation.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  Employee Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-900 font-medium">
                      {taxCalculation.employee?.personalDetails?.firstName} {taxCalculation.employee?.personalDetails?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">ID: {taxCalculation.employee?.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{taxCalculation.employee?.personalDetails?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{taxCalculation.employee?.personalDetails?.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      {taxCalculation.employee?.jobDetails?.department} - {taxCalculation.employee?.jobDetails?.designation}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calculator className="w-3 h-3 text-green-600" />
                  </div>
                  Calculation Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Financial Year: FY {taxCalculation.financialYear}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Calculated By: {taxCalculation.calculatedBy?.name}</span>
                  </div>
                  {taxCalculation.reviewedBy && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Reviewed By: {taxCalculation.reviewedBy.name}</span>
                    </div>
                  )}
                  {taxCalculation.approvedBy && (
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Approved By: {taxCalculation.approvedBy.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Last Updated: {formatDate(taxCalculation.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Breakdown */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-3 h-3 text-indigo-600" />
              </div>
              Tax Breakdown
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-200 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3 h-3 text-green-700" />
                  </div>
                  Earnings
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Total Earnings</span>
                    <span className="font-medium text-slate-900">{formatCurrency(taxCalculation.totalEarnings)}</span>
                  </div>
                  <div className="border-t border-green-300 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">Total Earnings</span>
                      <span className="font-bold text-green-800 text-lg">{formatCurrency(taxCalculation.totalEarnings)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-200 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3 h-3 text-red-700" />
                  </div>
                  Deductions
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Total Deductions</span>
                    <span className="font-medium text-red-700">-{formatCurrency(taxCalculation.totalDeductions)}</span>
                  </div>
                  <div className="border-t border-red-300 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-red-800">Total Deductions</span>
                      <span className="font-bold text-red-800 text-lg">-{formatCurrency(taxCalculation.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200 lg:col-span-2">
                <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-200 rounded-lg flex items-center justify-center">
                    <Percent className="w-3 h-3 text-blue-700" />
                  </div>
                  Tax Details
                </h4>
                <div className="space-y-3">
                  {taxCalculation.taxDetails?.map((detail, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">{detail.type}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(detail.amount)}</span>
                      </div>
                      {detail.calculationMethod && (
                        <div className="flex justify-between items-center text-sm text-slate-600">
                          <span>Method: {detail.calculationMethod}</span>
                          <span></span>
                        </div>
                      )}
                      {detail.applicableFrom && (
                        <div className="flex justify-between items-center text-sm text-slate-600">
                          <span>From: {formatDate(detail.applicableFrom)}</span>
                          <span></span>
                        </div>
                      )}
                      {detail.applicableTo && (
                        <div className="flex justify-between items-center text-sm text-slate-600">
                          <span>To: {formatDate(detail.applicableTo)}</span>
                          <span></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Net Taxable Income */}
          <div className="p-6 border-b border-slate-200">
            <div className="bg-gradient-to-r from-indigo-50 to-amber-50 border-2 border-indigo-200 p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Net Taxable Income</h4>
                  <p className="text-slate-600">Total income after deductions</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-700">{formatCurrency(taxCalculation.taxableIncome)}</p>
                  <p className="text-sm text-slate-600 mt-1 max-w-xs">
                    <span className="font-medium">In words:</span> {amountToWords(taxCalculation.taxableIncome)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Total Tax */}
          <div className="p-6 border-b border-slate-200">
            <div className="bg-gradient-to-r from-indigo-50 to-amber-50 border-2 border-indigo-200 p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Total Tax Payable</h4>
                  <p className="text-slate-600">Total tax liability</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-700">{formatCurrency(taxCalculation.totalTax)}</p>
                  <p className="text-sm text-slate-600 mt-1 max-w-xs">
                    <span className="font-medium">In words:</span> {amountToWords(taxCalculation.totalTax)}
                  </p>
                </div>
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
                    {taxCalculation.notes || 'This is a computer-generated tax calculation and does not require signature.'}
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
            <p className="text-slate-600 text-sm mt-1">Common actions for this tax calculation</p>
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
                <span className="text-sm text-slate-600 mt-1">Save tax calculation as PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <Printer className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-slate-900">Print Tax Calculation</span>
                <span className="text-sm text-slate-600 mt-1">Print physical copy</span>
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <Edit2 className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="font-medium text-slate-900">{isEditing ? 'Cancel Edit' : 'Edit Tax Calculation'}</span>
                <span className="text-sm text-slate-600 mt-1">Modify tax calculation details</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <span className="font-medium text-red-900">Delete Tax Calculation</span>
                <span className="text-sm text-red-600 mt-1">Remove this record</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}