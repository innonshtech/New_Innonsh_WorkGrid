/**
 * ═══════════════════════════════════════════════════════════
 * BANK TRANSFER FILE ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Generates payment instruction files (NEFT/RTGS CSV format)
 * for bulk upload to corporate banking portals (HDFC, ICICI, SBI).
 */

export class BankFileEngine {
  /**
   * Generate a bank CSV upload string
   * 
   * @param {Array} runEmployees - List of PayrollRunEmployee objects with employee relations loaded
   * @param {object} orgDetails - Organization bank configurations
   * @param {number} month - Payroll month
   * @param {number} year - Payroll year
   * @returns {string} CSV content
   */
  generateCSV(runEmployees, orgDetails = {}, month, year) {
    const headers = [
      'Beneficiary Account Number',
      'IFSC Code',
      'Beneficiary Name',
      'Amount',
      'Transaction Type',
      'Corporate Ref/Remarks',
      'Email ID',
      'Mobile Number'
    ];

    const rows = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const remarks = `Salary_${monthNames[month - 1]}_${year}`;

    for (const re of runEmployees) {
      const emp = re.employee || {};
      
      // Basic validation: skip or mark records missing critical payment details
      const accNum = emp.bankAccountNumber ? emp.bankAccountNumber.trim() : '';
      const ifsc = emp.ifscCode ? emp.ifscCode.trim() : '';
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().replace(/,/g, ''); // strip commas for CSV
      const amt = Number(re.netSalary || 0).toFixed(2);
      const email = emp.email || '';
      const phone = emp.phone || '';

      // Determine payment type based on bank details/amount
      // e.g. NEFT by default, RTGS for >= 2 Lakhs
      const txType = Number(re.netSalary || 0) >= 200000 ? 'RTGS' : 'NEFT';

      if (accNum && ifsc && Number(amt) > 0) {
        rows.push([
          `"${accNum}"`, // force quotes/string type for account numbers
          `"${ifsc}"`,
          `"${name}"`,
          amt,
          txType,
          `"${remarks}"`,
          `"${email}"`,
          `"${phone}"`
        ]);
      }
    }

    // Convert to CSV string format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}
