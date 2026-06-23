"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle2, 
  Send, 
  Download,
  AlertTriangle,
  RotateCw,
  Plus,
  HelpCircle,
  Layers,
  FileMinus,
  Sparkles
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { toast } from 'sonner';

// A robust helper for fetching JSON api routes that catches non-JSON answers (like 404 HTML templates)
const safeFetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`The endpoint ${url} was not found (404). This usually happens because Next.js dev server has cached the routes. Please restart your development server (npm run dev) to load the new V2 endpoints.`);
      }
      const text = await res.text();
      let errMessage = `HTTP Error ${res.status}`;
      try {
        const errJson = JSON.parse(text);
        errMessage = errJson.error || errJson.message || errMessage;
      } catch (_) {
        if (text && text.includes('<!DOCTYPE html>')) {
          errMessage = `Server returned HTML page instead of JSON. The route might be unauthorized or not registered. Try restarting your dev server.`;
        } else if (text) {
          errMessage = text.slice(0, 150);
        }
      }
      throw new Error(errMessage);
    }
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE html>')) {
        throw new Error("Server returned HTML page (possibly 404 or auth redirect) instead of JSON. Try restarting your dev server to refresh Next.js routes.");
      }
      throw new Error("Server returned non-JSON response");
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
};

export default function EmployeePayrollDashboard() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState('structure');
  
  // Data State
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Forms State
  const [declarationRegime, setDeclarationRegime] = useState('NEW');
  const [declarationAmounts, setDeclarationAmounts] = useState({
    '80C': '',
    '80D': '',
    '80CCD_1B': '',
    'HRA': '',
  });

  const [previewResult, setPreviewResult] = useState(null);
  const [expandedTaxInspector, setExpandedTaxInspector] = useState(false);

  useEffect(() => {
    fetchMySalary();
    fetchMyPayslips();
    fetchMyQueries();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchMyDeclarations(user.id);
      fetchMyTaxPreview(user.id);
    }
  }, [user]);

  // ────────────────────────────────────────────────────────
  // API CALLS
  // ────────────────────────────────────────────────────────

  const fetchMySalary = async () => {
    try {
      const data = await safeFetchJson('/api/v1/employee/payroll/salary-structure');
      if (data && data.success) {
        // API returns { success, ctc, gross, basic, components }
        setSalaryStructure({
          ctc: data.ctc || 0,
          gross: data.gross || 0,
          basic: data.basic || 0,
          components: data.components || {}
        });
      } else {
        console.warn('Salary structure API returned no success, using fallback');
        setSalaryStructure(null);
      }
    } catch (err) {
      console.error('Failed to load salary structure:', err);
      setSalaryStructure(null);
    }
  };

  const fetchMyPayslips = async () => {
    setLoading(true);
    try {
      // Correct endpoint: /api/v1/employee/payroll/payslip (returns {payslips} without success field)
      const data = await safeFetchJson('/api/v1/employee/payroll/payslip');
      if (data && data.payslips) {
        setPayslips(data.payslips);
      } else {
        setPayslips([]);
      }
    } catch (err) {
      console.error('Failed to load payslips:', err);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyQueries = async () => {
    setQueryLoading(true);
    try {
      const data = await safeFetchJson('/api/v1/employee/payroll/queries');
      if (data.success) {
        setQueries(data.queries);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch queries');
    } finally {
      setQueryLoading(false);
    }
  };

  const downloadPDF = async (payslip) => {
    toast.loading('Generating secure PDF payslip...');
    try {
      // Lazy load jsPDF on client side for performance
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      
      // Outer border
      doc.setDrawColor(220, 220, 220);
      doc.rect(5, 5, 200, 287);

      // Header
      doc.setTextColor(30, 41, 59);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('WORKGRID ERP SOLUTION', 14, 20);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Digital Employee Portal Verified Payslip', 14, 25);

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      doc.text(`PAYSLIP FOR THE MONTH OF ${monthNames[payslip.month - 1].toUpperCase()} ${payslip.year}`, 14, 35);

      doc.line(14, 38, 196, 38);

      // Employee metadata (using dummy data for display)
      const details = [
        ['Payable Days', payslip.workingDays || '30', 'Payment Mode', payslip.paymentMethod || 'Bank Transfer'],
        ['Gross Salary', `INR ${payslip.grossSalary.toFixed(2)}`, 'Net Salary', `INR ${payslip.netSalary.toFixed(2)}`]
      ];

      autoTable(doc, {
        startY: 42,
        margin: { left: 14, right: 14 },
        theme: 'plain',
        body: details,
        styles: { fontSize: 9, cellPadding: 2 }
      });

      // Earnings & Deductions Tables
      const earnings = Object.entries(payslip.earnings || {}).map(([c, v]) => [c, Number(v).toFixed(2)]);
      const deductions = Object.entries(payslip.deductions || {}).map(([c, v]) => [c, Number(v).toFixed(2)]);

      const maxRows = Math.max(earnings.length, deductions.length);
      while (earnings.length < maxRows) earnings.push(['', '']);
      while (deductions.length < maxRows) deductions.push(['', '']);

      const tableData = [];
      for (let i = 0; i < maxRows; i++) {
        tableData.push([earnings[i][0], earnings[i][1], deductions[i][0], deductions[i][1]]);
      }

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 5,
        margin: { left: 14, right: 14 },
        head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8.5 }
      });

      // Total Banner
      doc.setFillColor(243, 244, 246);
      doc.rect(14, doc.lastAutoTable.finalY + 5, 182, 10, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`NET PAYABLE SALARY: INR ${payslip.netSalary.toLocaleString('en-IN')}`, 20, doc.lastAutoTable.finalY + 11);

      doc.save(`Payslip_${payslip.month}_${payslip.year}.pdf`);
      toast.dismiss();
      toast.success('Payslip downloaded successfully');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.dismiss();
      toast.error('Failed to compile PDF');
    }
  };

  const handleCreateQuery = async (e) => {
    e.preventDefault();
    const category = e.target.category.value;
    const subject = e.target.subject.value;
    const description = e.target.description.value;

    if (!subject.trim() || !description.trim()) {
      toast.error('Subject and description are required');
      return;
    }

    setSubmitLoading(true);
    try {
      const data = await safeFetchJson('/api/v1/employee/payroll/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, description })
      });
      if (data.success) {
        toast.success('Query ticket raised successfully');
        e.target.reset();
        fetchMyQueries();
      } else {
        toast.error(data.error || 'Failed to submit query');
      }
    } catch (err) {
      toast.error(err.message || 'Network error creating query');
    } finally {
      setSubmitLoading(false);
    }
  };

  const submitQueryComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedQuery) return;
    setSubmitLoading(true);

    try {
      const data = await safeFetchJson(`/api/v1/employee/payroll/queries/${selectedQuery.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newComment })
      });
      if (data.success) {
        toast.success('Message sent');
        setNewComment('');
        
        // Reload comments
        const detailData = await safeFetchJson(`/api/v1/employee/payroll/queries/${selectedQuery.id}/comments`);
        if (detailData.success) {
          setSelectedQuery(detailData.query);
          fetchMyQueries();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send comment');
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchMyDeclarations = async (empId) => {
    if (!empId) return;
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/investments?employeeId=${empId}&financialYear=2025-26`);
      if (data) {
        if (data.taxRegime) {
          setDeclarationRegime(data.taxRegime.toUpperCase());
        }
        if (data.sections) {
          const sec = data.sections;
          setDeclarationAmounts({
            '80C': sec.section80C?.total !== undefined ? sec.section80C.total : '',
            '80D': sec.section80D?.total !== undefined ? sec.section80D.total : '',
            '80CCD_1B': sec.section80CCD_1B !== undefined ? sec.section80CCD_1B : (sec.nps !== undefined ? sec.nps : ''),
            'HRA': sec.hra?.annualRent !== undefined ? sec.hra.annualRent : '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to load employee declarations:', err);
    }
  };

  const fetchMyTaxPreview = async (empId) => {
    if (!empId) return;
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const data = await safeFetchJson('/api/v1/admin/payroll/v2/calculate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: empId,
          month,
          year
        })
      });
      if (data && data.success) {
        setPreviewResult(data.result);
      }
    } catch (err) {
      console.error('Failed to load tax calculation preview:', err);
    }
  };

  const submitTaxDeclaration = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Session user not found. Please log in.');
      return;
    }
    setSubmitLoading(true);
    try {
      const data = await safeFetchJson('/api/v1/admin/payroll/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: user.id,
          financialYear: '2025-26',
          regime: declarationRegime.toLowerCase(),
          sections: {
            section80C: { total: parseFloat(declarationAmounts['80C']) || 0 },
            section80D: { total: parseFloat(declarationAmounts['80D']) || 0 },
            hra: { annualRent: parseFloat(declarationAmounts['HRA']) || 0 },
            section80CCD_1B: parseFloat(declarationAmounts['80CCD_1B']) || 0,
            nps: parseFloat(declarationAmounts['80CCD_1B']) || 0,
            section80G: { total: parseFloat(declarationAmounts['80G']) || 0 },
            section80E: { total: parseFloat(declarationAmounts['80E']) || 0 },
            section24b: { total: parseFloat(declarationAmounts['24B']) || 0 }
          },
          submit: true
        })
      });
      if (data && data.id) {
        toast.success('Tax declaration submitted successfully for HR review!');
        setExpandedTaxInspector(false);
        fetchMyTaxPreview(user.id);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error('Failed to submit declaration.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const downloadForm16 = async () => {
    if (!user?.id) return;
    const toastId = toast.loading('Generating Form 16 PDF...');
    try {
      const data = await safeFetchJson(`/api/v1/admin/payroll/form16?employeeId=${user.id}`);
      if (data && data.success) {
        const form16 = data.data;

        // Lazy load jsPDF on client side for performance
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;
        
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const W = doc.internal.pageSize.getWidth();
        const H = doc.internal.pageSize.getHeight();

        const PRIMARY = [30, 64, 175];
        const TEXT = [30, 30, 30];
        const BORDER = [220, 220, 220];

        // --- PAGE 1: PART A ---
        // Outer border
        doc.setDrawColor(...BORDER);
        doc.rect(10, 10, W - 20, H - 20);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...PRIMARY);
        doc.text('FORM NO. 16', W / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('[See rule 31(1)(a)]', W / 2, 25, { align: 'center' });

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...TEXT);
        doc.text('Certificate of Tax Deducted at Source on Salary (Part A)', W / 2, 32, { align: 'center' });
        doc.line(15, 36, W - 15, 36);

        // Grid details
        const infoRows = [
          ['Employer Name', form16.employer?.name || '', 'Employee Name', form16.employee?.name || ''],
          ['Employer TAN', form16.employer?.tan || '', 'Employee PAN', form16.employee?.pan || ''],
          ['Employer PAN', form16.employer?.pan || '', 'Employee ID', form16.employee?.employeeId || ''],
          ['Employer Address', form16.employer?.address || '', 'Designation', form16.employee?.designation || '']
        ];

        autoTable(doc, {
          startY: 42,
          margin: { left: 15, right: 15 },
          head: [['Employer Details', '', 'Employee Details', '']],
          body: infoRows,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 }
        });

        // Financial & Assessment Year Table
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 8,
          margin: { left: 15, right: 15 },
          head: [['Financial Year', 'Assessment Year', 'Tax Regime']],
          body: [
            [form16.financialYear, form16.assessmentYear, form16.partB?.regime?.toUpperCase() || 'NEW']
          ],
          theme: 'grid',
          headStyles: { fillColor: [100, 116, 139] },
          styles: { fontSize: 10, halign: 'center' }
        });

        // Part A Quarterly summary
        const qSummary = form16.partA?.quarterlySummary || {};
        const qRows = [
          ['Quarter 1 (Apr - Jun)', `Rs. ${(qSummary.Q1?.gross || 0).toLocaleString('en-IN')}`, `Rs. ${(qSummary.Q1?.tds || 0).toLocaleString('en-IN')}`],
          ['Quarter 2 (Jul - Sep)', `Rs. ${(qSummary.Q2?.gross || 0).toLocaleString('en-IN')}`, `Rs. ${(qSummary.Q2?.tds || 0).toLocaleString('en-IN')}`],
          ['Quarter 3 (Oct - Dec)', `Rs. ${(qSummary.Q3?.gross || 0).toLocaleString('en-IN')}`, `Rs. ${(qSummary.Q3?.tds || 0).toLocaleString('en-IN')}`],
          ['Quarter 4 (Jan - Mar)', `Rs. ${(qSummary.Q4?.gross || 0).toLocaleString('en-IN')}`, `Rs. ${(qSummary.Q4?.tds || 0).toLocaleString('en-IN')}`],
          ['Total YTD', `Rs. ${(form16.partB?.grossSalary || 0).toLocaleString('en-IN')}`, `Rs. ${(form16.partA?.totalTDS || 0).toLocaleString('en-IN')}`]
        ];

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Quarterly Summary of TDS Deposited with Central Government', 15, doc.lastAutoTable.finalY + 12);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 16,
          margin: { left: 15, right: 15 },
          head: [['Quarter Period', 'Gross Salary Paid', 'Amount of TDS Deducted & Deposited']],
          body: qRows,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 },
          columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } }
        });

        // Verification note
        const noteY = doc.lastAutoTable.finalY + 15;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Certified that a sum of Rs. ${(form16.partA?.totalTDS || 0).toLocaleString('en-IN')} has been deducted and deposited to the credit of Central Government.`, 15, noteY);
        doc.text('This is a digitally generated Form 16 certificate and does not require a physical signature.', 15, noteY + 5);

        // --- PAGE 2: PART B ---
        doc.addPage();
        doc.setDrawColor(...BORDER);
        doc.rect(10, 10, W - 20, H - 20);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...PRIMARY);
        doc.text('FORM NO. 16', W / 2, 20, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(...TEXT);
        doc.text('PART B: Annexure - Details of Salary Paid and Deductions', W / 2, 28, { align: 'center' });
        doc.line(15, 32, W - 15, 32);

        // Part B Breakdown Rows
        const partB = form16.partB || {};
        const chVia = partB.chapterVIA || {};

        const bRows = [];
        bRows.push(['1. Gross Salary', `Rs. ${(partB.grossSalary || 0).toLocaleString('en-IN')}`, '']);
        bRows.push(['2. Deductions under Section 16', '', '']);
        bRows.push(['   a. Standard Deduction', '', `Rs. ${(partB.lessSection16?.standardDeduction || 0).toLocaleString('en-IN')}`]);
        bRows.push(['   b. Professional Tax (PT)', '', `Rs. ${(partB.lessSection16?.professionalTax || 0).toLocaleString('en-IN')}`]);
        bRows.push(['   Total Section 16 Deductions', '', `Rs. ${(partB.lessSection16?.total || 0).toLocaleString('en-IN')}`]);
        bRows.push(['3. Balance Income (Gross less Sec 16)', `Rs. ${(partB.balanceIncome || 0).toLocaleString('en-IN')}`, '']);

        // Chapter VI-A Deductions
        bRows.push(['4. Deductions under Chapter VI-A', '', '']);
        Object.entries(chVia).forEach(([sectionCode, item]) => {
          bRows.push([`   - Section ${sectionCode}`, `Declared: Rs. ${(item.declared || 0).toLocaleString('en-IN')}`, `Allowed: Rs. ${(item.allowed || 0).toLocaleString('en-IN')}`]);
        });

        // Totals & Liabilities
        bRows.push(['5. Total Taxable Income', '', `Rs. ${(partB.totalTaxableIncome || 0).toLocaleString('en-IN')}`]);
        bRows.push(['6. Tax Computed on Total Income', '', `Rs. ${(partB.taxOnIncome || 0).toLocaleString('en-IN')}`]);
        if (partB.surcharge > 0) {
          bRows.push(['7. Surcharge', '', `Rs. ${(partB.surcharge || 0).toLocaleString('en-IN')}`]);
        }
        bRows.push(['8. Health and Education Cess (4%)', '', `Rs. ${(partB.cess || 0).toLocaleString('en-IN')}`]);
        bRows.push(['9. Total Tax Liability', '', `Rs. ${(partB.totalTaxLiability || 0).toLocaleString('en-IN')}`]);
        bRows.push(['10. Year-to-Date TDS Deducted', '', `Rs. ${(partB.taxDeductedYTD || 0).toLocaleString('en-IN')}`]);

        if (partB.taxRefundDue > 0) {
          bRows.push(['11. Tax Refund Due', '', `Rs. ${(partB.taxRefundDue || 0).toLocaleString('en-IN')}`]);
        } else if (partB.taxShortfall > 0) {
          bRows.push(['11. Tax Shortfall / Balance Due', '', `Rs. ${(partB.taxShortfall || 0).toLocaleString('en-IN')}`]);
        } else {
          bRows.push(['11. Balance Due / Refund', '', 'Rs. 0']);
        }

        autoTable(doc, {
          startY: 38,
          margin: { left: 15, right: 15 },
          head: [['Particulars', 'Detail / Computation', 'Amount']],
          body: bRows,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8.5 },
          columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } }
        });

        doc.save(`Form16_${user.id}_2026-27.pdf`);
        toast.dismiss(toastId);
        toast.success('Form 16 PDF downloaded successfully!');
      } else {
        toast.dismiss(toastId);
        toast.error('Failed to generate Form 16.');
      }
    } catch (err) {
      console.error('Form 16 PDF Generation Error:', err);
      toast.dismiss(toastId);
      toast.error('Error generating Form 16 PDF.');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Side menu */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-indigo-500/25">
              ESS
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-wide uppercase text-slate-800">My Payroll Portal</h2>
              <span className="text-xs text-indigo-600 font-semibold">Self Service Portal</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {[
              { id: 'structure', name: 'My Salary Structure', icon: Layers },
              { id: 'payslips', name: 'My Payslips', icon: FileText },
              { id: 'tax', name: 'Tax Declarations', icon: Sparkles },
              { id: 'queries', name: 'Queries Resolution', icon: MessageSquare, badge: queries.filter(q => q.status === 'OPEN').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedQuery(null);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-150 shadow-sm font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <tab.icon className="h-4.5 w-4.5" />
                  <span>{tab.name}</span>
                </div>
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-rose-100 text-rose-700 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-150 text-center text-[10px] text-slate-400">
          WorkGrid Employee Secure Zone
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
        
        <header className="h-16 border-b border-slate-200 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <h1 className="font-bold text-sm text-slate-600 capitalize">
            Payroll Self-Service &gt; <span className="text-indigo-600">{activeTab}</span>
          </h1>
        </header>

        <main className="p-8 flex-1 max-w-6xl w-full mx-auto">
          
          {/* TAB 1: SALARY STRUCTURE */}
          {activeTab === 'structure' && salaryStructure && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Annual Compensation Summary</h2>
                <p className="text-xs text-slate-500 mt-1">Detailed view of your current Cost to Company (CTC) components.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Annual CTC</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">₹{salaryStructure.ctc.toLocaleString('en-IN')}</h3>
                  <span className="text-[10px] text-emerald-600 font-bold">Current active revision</span>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Monthly Gross</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">₹{salaryStructure.gross.toLocaleString('en-IN')}</h3>
                  <span className="text-[10px] text-slate-500">Subject to statutory deductions</span>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase">Monthly Basic</p>
                  <h3 className="text-3xl font-black text-slate-900 mt-2">₹{salaryStructure.basic.toLocaleString('en-IN')}</h3>
                  <span className="text-[10px] text-slate-500">Basis for EPF & Gratuity</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-extrabold text-sm text-slate-800">Component Breakdown</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {Object.entries(salaryStructure.components).map(([name, val]) => (
                      <div key={name} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-all">
                        <span className="font-bold text-slate-700">{name.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-slate-900">₹{val.toLocaleString('en-IN')}.00</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl h-fit space-y-4 shadow-sm">
                  <h4 className="font-extrabold text-sm text-slate-800">Projected Monthly Deductions</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                    {previewResult ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Monthly Gross:</span>
                          <span className="font-semibold text-slate-800">₹{Math.round(previewResult.grossSalary || salaryStructure.gross).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>EPF (Employee):</span>
                          <span>-₹{Math.round(previewResult.pfBreakdown?.employeePF || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>ESIC:</span>
                          <span>-₹{Math.round(previewResult.esiBreakdown?.employeeESI || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Professional Tax (PT):</span>
                          <span>-₹{Math.round(previewResult.ptBreakdown?.ptAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-rose-600 font-medium">
                          <span>Applied TDS Tax:</span>
                          <span>-₹{Math.round(previewResult.monthlyTDS || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2.5 font-black text-emerald-600 text-sm">
                          <span>Net Take-Home Pay:</span>
                          <span>₹{Math.round(previewResult.netSalary || (salaryStructure.gross)).toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 animate-pulse py-4 text-center">Loading calculations...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && !salaryStructure && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                <Layers className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-black text-slate-800">Salary Structure Not Assigned</h2>
              <p className="text-xs text-slate-500 max-w-md text-center leading-relaxed">
                Your salary structure has not been configured yet. Please contact your HR/Admin team to set up your CTC and allowance components.
              </p>
            </div>
          )}

          {/* TAB 2: MY PAYSLIPS */}
          {activeTab === 'payslips' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-2xl font-black text-slate-900">My Monthly Payslips</h2>
                <p className="text-xs text-slate-500 mt-1">Review payouts and download official PDF records for verification.</p>
              </div>

              {loading ? (
                <p className="text-xs text-slate-400 py-8 text-center animate-pulse">Loading payslips...</p>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                        <th className="p-4">Period</th>
                        <th className="p-4 text-right">Gross Salary</th>
                        <th className="p-4 text-right">Deductions</th>
                        <th className="p-4 text-right">Net Paid</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {payslips.map(ps => {
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return (
                          <tr key={ps.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="p-4 font-bold text-slate-800">
                              {monthNames[ps.month - 1]} {ps.year}
                            </td>
                            <td className="p-4 text-right font-medium">
                              ₹{ps.grossSalary.toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-right text-rose-600 font-medium">
                              -₹{ps.totalDeductions.toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-right font-black text-emerald-600">
                              ₹{ps.netSalary.toLocaleString('en-IN')}
                            </td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {ps.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => downloadPDF(ps)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                title="Download PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {payslips.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No payslips generated yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAX DECLARATIONS */}
          {activeTab === 'tax' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-sm">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Tax Regime & Declarations</h2>
                  <p className="text-xs text-slate-500 mt-1">Select your preferred tax regime and declare investments for TDS deductions.</p>
                </div>

                <form onSubmit={submitTaxDeclaration} className="space-y-6">
                  
                  {/* Regime select */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Select Regime</span>
                    <div className="flex items-center space-x-4 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="regime"
                          value="NEW"
                          checked={declarationRegime === 'NEW'}
                          onChange={() => setDeclarationRegime('NEW')}
                          className="text-indigo-600 focus:ring-0 focus:outline-none"
                        />
                        <span>New Regime (Standard deduction ₹75,000, lower slabs, no exemptions)</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-4 pt-1">
                      <label className="flex items-center space-x-2 text-xs font-medium cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="regime"
                          value="OLD"
                          checked={declarationRegime === 'OLD'}
                          onChange={() => setDeclarationRegime('OLD')}
                          className="text-indigo-600 focus:ring-0 focus:outline-none"
                        />
                        <span>Old Regime (Claim exemptions under Section 80C, 80D, HRA, etc.)</span>
                      </label>
                    </div>
                  </div>

                  {declarationRegime === 'OLD' && (
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-sm text-slate-800">Chapter VI-A Deductions</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-550 uppercase">Section 80C (Max ₹1.5L)</label>
                          <input
                            type="number"
                            placeholder="e.g. PPF, LIC, ELSS, EPF"
                            value={declarationAmounts['80C']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '80C': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">Section 80D Mediclaim</label>
                          <input
                            type="number"
                            placeholder="Health insurance premium"
                            value={declarationAmounts['80D']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '80D': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">Section 80CCD (1B) NPS</label>
                          <input
                            type="number"
                            placeholder="Additional NPS contribution"
                            value={declarationAmounts['80CCD_1B']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '80CCD_1B': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">House Rent Allowance (HRA)</label>
                          <input
                            type="number"
                            placeholder="Total rent paid annually"
                            value={declarationAmounts['HRA']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, 'HRA': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">Section 80G Donations</label>
                          <input
                            type="number"
                            placeholder="Charitable donations"
                            value={declarationAmounts['80G']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '80G': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">Section 80E Edu Loan</label>
                          <input
                            type="number"
                            placeholder="Interest on education loan"
                            value={declarationAmounts['80E']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '80E': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <label className="text-[10px] font-bold text-slate-555 uppercase">Section 24(b) Home Loan</label>
                          <input
                            type="number"
                            placeholder="Interest on home loan"
                            value={declarationAmounts['24B']}
                            onChange={(e) => setDeclarationAmounts({ ...declarationAmounts, '24B': e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-all font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10"
                  >
                    Submit Declaration for HR Review
                  </button>
                  <button
                    type="button"
                    onClick={downloadForm16}
                    className="w-full py-3 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold text-xs rounded-xl transition-all mt-3"
                  >
                    ⬇ Download Form 16
                  </button>
                </form>
              </div>

              {/* Status info right box / Live TDS Calculator */}
              <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl h-fit space-y-6 shadow-sm">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Tax Projection Summary</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Based on current declarations & salary structure.</p>
                </div>

                {previewResult ? (
                  <div className="space-y-4 font-sans">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Tax Regime:</span>
                        <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 uppercase">
                          {previewResult.taxBreakdown?.regime || declarationRegime}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-xs">
                        <span className="text-slate-500">Monthly TDS (Applied):</span>
                        <span className="font-extrabold text-rose-600 text-sm">₹{Math.round(previewResult.monthlyTDS || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Annual Tax Liability:</span>
                        <span className="font-bold text-slate-700">₹{Math.round(previewResult.taxBreakdown?.totalTaxLiability || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-200 pt-2 text-xs">
                        <span className="text-slate-500 font-bold">Estimated Take-Home:</span>
                        <span className="font-black text-emerald-600 text-sm">₹{Math.round(previewResult.netSalary || 0).toLocaleString('en-IN')}/mo</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-[11px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Projected Annual Income:</span>
                        <span className="text-slate-800 font-semibold">₹{Math.round(previewResult.taxBreakdown?.projectedAnnualIncome || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Allowed Exemptions:</span>
                        <span className="text-rose-600 font-semibold">-₹{Math.round(previewResult.taxBreakdown?.totalExemptions || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Net Taxable Income:</span>
                        <span className="text-emerald-600 font-semibold font-bold">₹{Math.round(previewResult.taxBreakdown?.taxableIncome || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Expandable Slab breakdown */}
                    <button
                      type="button"
                      onClick={() => setExpandedTaxInspector(!expandedTaxInspector)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center space-x-1"
                    >
                      <span>{expandedTaxInspector ? 'Hide' : 'Show'} Detailed Calculations</span>
                    </button>

                    {expandedTaxInspector && previewResult.taxBreakdown?.slabBreakdown && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-[10px] space-y-2 max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200 font-mono shadow-inner">
                        <p className="font-bold text-slate-850 uppercase border-b border-slate-100 pb-1">Tax Slab Calculations</p>
                        {previewResult.taxBreakdown.slabBreakdown.map((slab, index) => (
                          <div key={index} className="flex justify-between text-slate-500 py-0.5">
                            <span>₹{(slab.from/100000).toFixed(1)}L - {slab.to ? `₹${(slab.to/100000).toFixed(1)}L` : 'Above'} ({slab.rate}%)</span>
                            <span className="text-slate-800 font-bold">Tax: ₹{Math.round(slab.taxAmount).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-100 pt-1.5 space-y-1">
                          <div className="flex justify-between text-slate-400">
                            <span>Surcharges:</span>
                            <span>₹{Math.round(previewResult.taxBreakdown?.surcharge || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Cess (4%):</span>
                            <span>₹{Math.round(previewResult.taxBreakdown?.cess || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 animate-pulse">Running tax preview calculations...</p>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-3 text-xs">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Status: Auto-Verified</p>
                    <p className="text-[10px] text-slate-500">Tax deductions will reflect dynamically in your payslips.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TWO-WAY RESOLUTION QUERIES */}
          {activeTab === 'queries' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-[500px] shadow-sm">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-800">Active Tickets</h3>
                  <button 
                    onClick={() => setSelectedQuery(null)}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition-all"
                  >
                    Create New
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
                  {queries.map(q => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuery(q)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        selectedQuery?.id === q.id
                          ? 'bg-indigo-50/50 border-indigo-300 text-indigo-800 font-semibold'
                          : 'bg-white border-transparent hover:bg-slate-50/50 hover:border-slate-150'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-850">{q.subject}</span>
                        <span className={`px-2 py-0.5 text-[8px] rounded-full font-bold ${
                          q.status === 'OPEN' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{q.description}</p>
                    </div>
                  ))}
                  {queries.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No queries raised yet.</p>
                  )}
                </div>
              </div>

              {/* Right Side: Conversation / Create Ticket */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col h-[500px] overflow-hidden shadow-sm">
                {selectedQuery ? (
                  <>
                    <div className="p-5 border-b border-slate-200 bg-slate-50/50">
                      <span className="text-[9px] font-bold text-indigo-650 uppercase">Support Thread</span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-0.5">{selectedQuery.subject}</h3>
                      <p className="text-[10px] text-slate-500">Category: {selectedQuery.category} • Status: {selectedQuery.status}</p>
                    </div>

                    <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                      {selectedQuery.comments?.map(comment => {
                        const isMe = comment.commentByRole === 'EMPLOYEE';
                        return (
                          <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md rounded-2xl p-4 shadow-sm border ${
                              isMe
                                ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                                : 'bg-white text-slate-750 border-slate-200 rounded-tl-none'
                            }`}>
                              <div className="flex items-center justify-between mb-1 text-[8px] font-bold opacity-75">
                                <span>{comment.commentByName}</span>
                                <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs leading-normal font-medium">{comment.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={submitQueryComment} className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type response back to HR..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={submitLoading || !newComment.trim()}
                        className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="p-8 flex-1 flex flex-col justify-center">
                    <h3 className="font-extrabold text-base text-slate-800 border-b border-slate-100 pb-3">Submit a New Payroll Query</h3>
                    
                    <form onSubmit={handleCreateQuery} className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Query Category</label>
                          <select name="category" className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none">
                            <option value="PAYSLIP">Payslip Query (Calculation Error)</option>
                            <option value="TAX">Tax Deduction / regime</option>
                            <option value="REIMBURSEMENT">Reimbursement dispute</option>
                            <option value="LOAN">Loan recovery query</option>
                            <option value="OTHER">Other general query</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Subject</label>
                          <input
                            type="text"
                            name="subject"
                            placeholder="Brief summary..."
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Detailed Description</label>
                        <textarea
                          name="description"
                          rows={4}
                          placeholder="Provide details about the incorrect amount or discrepancy..."
                          className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                      >
                        {submitLoading ? 'Submitting ticket...' : 'Open Support Ticket'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
}
