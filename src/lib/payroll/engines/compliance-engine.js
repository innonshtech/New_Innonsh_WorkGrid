/**
 * ═══════════════════════════════════════════════════════════
 * COMPLIANCE REPORTING ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Generates official compliance data formats for statutory filings:
 *   - EPF Unified Portal ECR (Electronic Challan-cum-Return) text format (#~# delimited)
 *   - ESIC Contribution spreadsheet CSV format
 *   - PT challan summaries (state-wise)
 */

export class ComplianceEngine {
  /**
   * Generate PF ECR text file content (#~# delimited)
   * 
   * @param {Array} runEmployees - List of PayrollRunEmployee with statutory breakdowns and employee records loaded
   * @returns {string} ECR file text
   */
  generatePFECR(runEmployees) {
    const lines = [];

    for (const re of runEmployees) {
      const emp = re.employee || {};
      const stat = re.statutoryBreakdown || {};

      // PF numbers / parameters
      const uan = emp.aadharNumber || ''; // Aadhar/UAN fallback
      const memberName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().slice(0, 36).replace(/[^a-zA-Z ]/g, '');
      const grossWages = Math.round(re.grossEarnings || 0);
      const epfWages = Math.round(stat.pfWage || 0);
      const epsWages = Math.round(stat.pfBasis || 0); // restricted to ceiling usually
      const edliWages = Math.round(stat.pfBasis || 0);
      
      const employeePFShare = Math.round(stat.employeePF || 0);
      const employerEPSShare = Math.round(stat.eps || 0);
      const employerEPFShare = Math.round(stat.employerEPF || 0);

      const ncpDays = Math.round(re.lopDays || 0);
      const refundOfAdvances = 0; // standard default

      if (epfWages > 0) {
        // EPF ECR Fields format:
        // UAN #~# Member Name #~# Gross Wages #~# EPF Wages #~# EPS Wages #~# EDLI Wages #~# EPF Contribution #~# EPS Contribution #~# EPF/EPS Diff #~# NCP Days #~# Refund of Advances
        const line = [
          uan,
          memberName,
          grossWages,
          epfWages,
          epsWages,
          edliWages,
          employeePFShare,
          employerEPSShare,
          employerEPFShare,
          ncpDays,
          refundOfAdvances
        ].join('#~#');

        lines.push(line);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate ESIC Contribution CSV content
   * 
   * @param {Array} runEmployees - List of PayrollRunEmployee
   * @returns {string} ESIC CSV content
   */
  generateESICSpreadsheet(runEmployees) {
    const headers = [
      'IP Number',
      'IP Name',
      'No of Days for which wages paid',
      'Total Monthly Wages',
      'Reason Code for Zero Work days'
    ];

    const rows = [];

    for (const re of runEmployees) {
      const emp = re.employee || {};
      const stat = re.statutoryBreakdown || {};

      // If ESI was calculated for this employee
      if (stat.employeeESI > 0 || stat.employerESI > 0) {
        const ipNumber = emp.biometricDeviceId || ''; // Fallback ID if ESI number is not mapped explicitly
        const ipName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim().replace(/,/g, '');
        const paidDays = Math.round(re.payableDays || 0);
        const wages = Math.round(re.grossEarnings || 0);
        
        let zeroReason = 0;
        if (paidDays === 0) {
          zeroReason = re.lopDays > 0 ? 1 : 2; // LOP vs other reasons
        }

        rows.push([
          `"${ipNumber}"`,
          `"${ipName}"`,
          paidDays,
          wages,
          zeroReason
        ]);
      }
    }

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Summarize Professional Tax collected by State
   * 
   * @param {Array} runEmployees - List of PayrollRunEmployee
   * @returns {object} Summary object
   */
  summarizePT(runEmployees) {
    const summary = {};

    for (const re of runEmployees) {
      const emp = re.employee || {};
      const ptAmount = Number(re.deductionsBreakdown?.PT || 0);
      const state = emp.workState || 'Maharashtra';

      if (ptAmount > 0) {
        if (!summary[state]) {
          summary[state] = {
            state,
            totalEmployees: 0,
            totalGrossWages: 0,
            totalPTAmount: 0,
            slabs: {}
          };
        }

        const stateSummary = summary[state];
        stateSummary.totalEmployees += 1;
        stateSummary.totalGrossWages += re.grossEarnings;
        stateSummary.totalPTAmount += ptAmount;

        // Group by deduction amounts (slabs visualizer)
        const amountKey = `₹${ptAmount}`;
        stateSummary.slabs[amountKey] = (stateSummary.slabs[amountKey] || 0) + 1;
      }
    }

    return summary;
  }
}
