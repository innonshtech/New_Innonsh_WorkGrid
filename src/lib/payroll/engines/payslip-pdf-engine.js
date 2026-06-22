/**
 * ═══════════════════════════════════════════════════════════
 * PAYSLIP PDF ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Generates professional PDF payslips using jsPDF.
 * Supports server-side (NodeJS Buffer) and client-side download.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export class PayslipPDFEngine {
  /**
   * Generate a PDF for a single employee's payslip
   * 
   * @param {object} payslipData - PayrollRunEmployee with resolved values, employee, and org details
   * @returns {jsPDF} jsPDF instance
   */
  generate(payslipData) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const emp = payslipData.employee || {};
    const org = payslipData.organization || { name: 'WorkGrid ERP Solution' };
    const run = payslipData.run || {};
    const earnings = payslipData.earningsBreakdown || {};
    const deductions = payslipData.deductionsBreakdown || {};

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const periodName = `${monthNames[run.month - 1] || 'Month ' + run.month} ${run.year}`;

    // --- Page border & Header ---
    doc.setDrawColor(220, 220, 220);
    doc.rect(5, 5, 200, 287); // A4 border

    // Logo Placeholder or company name
    doc.setTextColor(30, 41, 59);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(org.name.toUpperCase(), 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(org.address?.street || org.address?.city || 'Corporate Office Address', 14, 25);

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`PAYSLIP FOR THE MONTH OF ${periodName.toUpperCase()}`, 14, 38);

    // Divider
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);

    // --- Employee & Organization metadata table ---
    const empDetails = [
      [
        { content: 'Employee ID', styles: { fontStyle: 'bold' } },
        emp.employeeId || 'N/A',
        { content: 'Name', styles: { fontStyle: 'bold' } },
        `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A'
      ],
      [
        { content: 'Department', styles: { fontStyle: 'bold' } },
        emp.department || 'N/A',
        { content: 'Designation', styles: { fontStyle: 'bold' } },
        emp.designation || 'N/A'
      ],
      [
        { content: 'Date of Joining', styles: { fontStyle: 'bold' } },
        emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : 'N/A',
        { content: 'PAN Number', styles: { fontStyle: 'bold' } },
        emp.panNumber || 'N/A'
      ],
      [
        { content: 'Bank Account No', styles: { fontStyle: 'bold' } },
        emp.bankAccountNumber || 'N/A',
        { content: 'Bank Name', styles: { fontStyle: 'bold' } },
        emp.bankName || 'N/A'
      ],
      [
        { content: 'Payable Days', styles: { fontStyle: 'bold' } },
        payslipData.payableDays || run.workingDays || '0',
        { content: 'LOP Days', styles: { fontStyle: 'bold' } },
        payslipData.lopDays || '0'
      ]
    ];

    doc.autoTable({
      startY: 45,
      margin: { left: 14, right: 14 },
      theme: 'plain',
      body: empDetails,
      styles: {
        fontSize: 9,
        cellPadding: 1.5,
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 50 }
      }
    });

    // Divider
    doc.line(14, doc.lastAutoTable.finalY + 3, 196, doc.lastAutoTable.finalY + 3);

    // --- Earnings & Deductions Tables ---
    const startY = doc.lastAutoTable.finalY + 8;
    
    // Process earnings components
    const earningRows = Object.entries(earnings).map(([code, val]) => [code.replace('_', ' '), Number(val).toFixed(2)]);
    // Process deductions components
    const deductionRows = Object.entries(deductions).map(([code, val]) => [code.replace('_', ' '), Number(val).toFixed(2)]);

    // Fill row gaps to make columns equal height
    const maxRows = Math.max(earningRows.length, deductionRows.length);
    while (earningRows.length < maxRows) earningRows.push(['', '']);
    while (deductionRows.length < maxRows) deductionRows.push(['', '']);

    const tableData = [];
    for (let i = 0; i < maxRows; i++) {
      tableData.push([
        earningRows[i][0],
        earningRows[i][1],
        deductionRows[i][0],
        deductionRows[i][1]
      ]);
    }

    doc.autoTable({
      startY: startY,
      margin: { left: 14, right: 14 },
      head: [['Earnings', 'Amount (INR)', 'Deductions', 'Amount (INR)']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55 },
        1: { halign: 'right', cellWidth: 36 },
        2: { halign: 'left', cellWidth: 55 },
        3: { halign: 'right', cellWidth: 36 }
      }
    });

    // --- Totals Summary Row ---
    const totalEarnings = Number(payslipData.totalEarnings || 0).toFixed(2);
    const totalDeductions = Number(payslipData.totalDeductions || 0).toFixed(2);
    const netSalary = Number(payslipData.netSalary || 0).toFixed(2);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY,
      margin: { left: 14, right: 14 },
      body: [
        ['Total Earnings', totalEarnings, 'Total Deductions', totalDeductions]
      ],
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 55 },
        1: { halign: 'right', cellWidth: 36 },
        2: { halign: 'left', cellWidth: 55 },
        3: { halign: 'right', cellWidth: 36 }
      }
    });

    // --- Net Salary Banner ---
    const bannerY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, bannerY, 182, 14, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`NET PAYABLE SALARY: INR ${Number(payslipData.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, bannerY + 9);

    // Number to words helper (simplified for English/Indian rupees)
    const netWords = this.numberToWords(Math.round(payslipData.netSalary || 0));
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Amount in words: Rupees ${netWords} Only`, 14, bannerY + 20);

    // --- Footer / Signatures ---
    const footerY = bannerY + 45;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is a system-generated payslip and does not require a physical signature.', 14, footerY);

    doc.setDrawColor(200, 200, 200);
    doc.line(140, footerY - 10, 190, footerY - 10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Authorized Signatory', 145, footerY - 5);

    return doc;
  }

  /**
   * Helper to convert number to English text
   */
  numberToWords(amount) {
    const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const double = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const translate = (num) => {
      let word = '';
      if (num < 20) {
        word = single[num];
      } else if (num < 100) {
        word = double[Math.floor(num / 10)] + ' ' + single[num % 10];
      } else if (num < 1000) {
        word = single[Math.floor(num / 100)] + ' Hundred ' + translate(num % 100);
      } else if (num < 100000) {
        word = translate(Math.floor(num / 1000)) + ' Thousand ' + translate(num % 1000);
      } else if (num < 10000000) {
        word = translate(Math.floor(num / 100000)) + ' Lakh ' + translate(num % 100000);
      } else {
        word = translate(Math.floor(num / 10000000)) + ' Crore ' + translate(num % 10000000);
      }
      return word.trim();
    };

    if (amount === 0) return 'Zero';
    return translate(amount);
  }

  /**
   * Output PDF as base64 string
   */
  toBase64(doc) {
    return doc.output('datauristring');
  }

  /**
   * Output PDF as Buffer (Node.js compatible)
   */
  toBuffer(doc) {
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
