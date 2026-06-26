/**
 * ═══════════════════════════════════════════════════════════
 * FORM 16 ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Generates data structure and summaries for Form 16 (Part A & Part B).
 * Used for annual tax certificate generation for employees.
 */

export class Form16Engine {
  constructor(taxEngine) {
    this.taxEngine = taxEngine;
  }

  /**
   * Compile Form 16 data for an employee for a financial year
   * 
   * @param {object} employee - Employee database record
   * @param {object} organization - Organization database record
   * @param {Array} runEmployees - All PayrollRunEmployee records for this employee in the FY
   * @param {object} declaration - PayrollTaxDeclaration for this employee in the FY
   * @param {Array} taxSlabs - Tax slabs for the FY
   * @param {Array} taxSections - Tax sections for the FY
   * @returns {object} Form 16 structured data
   */
  compileForm16(employee, organization, runEmployees, declaration = {}, taxSlabs, taxSections) {
    const org = organization || {};
    const emp = employee || {};
    const dec = declaration || {};

    // 1. Gather YTD totals
    let ytdGross = 0;
    let ytdTDS = 0;
    let ytdPT = 0;
    let ytdPF = 0;

    // Quarterly breakdown for Part A
    const quarters = {
      Q1: { gross: 0, tds: 0 }, // Apr - Jun
      Q2: { gross: 0, tds: 0 }, // Jul - Sep
      Q3: { gross: 0, tds: 0 }, // Oct - Dec
      Q4: { gross: 0, tds: 0 }  // Jan - Mar
    };

    for (const re of runEmployees) {
      ytdGross += re.grossEarnings || 0;
      ytdTDS += re.totalTax || 0;
      ytdPT += Number(re.deductionsBreakdown?.PT || 0);
      ytdPF += Number(re.deductionsBreakdown?.PF || 0);

      const m = re.run?.month;
      if ([4, 5, 6].includes(m)) {
        quarters.Q1.gross += re.grossEarnings || 0;
        quarters.Q1.tds += re.totalTax || 0;
      } else if ([7, 8, 9].includes(m)) {
        quarters.Q2.gross += re.grossEarnings || 0;
        quarters.Q2.tds += re.totalTax || 0;
      } else if ([10, 11, 12].includes(m)) {
        quarters.Q3.gross += re.grossEarnings || 0;
        quarters.Q3.tds += re.totalTax || 0;
      } else if ([1, 2, 3].includes(m)) {
        quarters.Q4.gross += re.grossEarnings || 0;
        quarters.Q4.tds += re.totalTax || 0;
      }
    }

    // Determine regime
    const regime = dec.regime || emp.taxRegime || 'NEW';

    // 2. Build Chapter VI-A deductions from verified items or declarations
    const declarationsMap = {};
    if (dec.items) {
      for (const item of dec.items) {
        // Use verified amount if verified, otherwise declared amount
        const val = item.proofStatus === 'Verified' ? (item.verifiedAmount ?? item.declaredAmount) : item.declaredAmount;
        const code = item.section?.sectionCode || '';
        if (code) {
          declarationsMap[code] = (declarationsMap[code] || 0) + Number(val || 0);
        }
      }
    }

    // Auto-fill standard deduction and PT
    declarationsMap['STANDARD_DEDUCTION'] = regime === 'NEW' ? 75000 : 50000;
    if (ytdPT > 0) declarationsMap['SECTION_16_PT'] = ytdPT;
    if (ytdPF > 0 && regime === 'OLD') {
      declarationsMap['80C'] = (declarationsMap['80C'] || 0) + ytdPF;
    }

    // 3. Compute tax computation using TaxEngine
    const taxComp = this.taxEngine.calculateMonthlyTDS({
      taxSlabs,
      taxSections,
      regime,
      monthlyGross: ytdGross / Math.max(1, runEmployees.length), // average monthly
      month: 3, // Simulate end of year
      year: 2026,
      remainingMonths: 0, // 0 remaining, year-end calculation
      declarations: declarationsMap,
      previousEmployerTDS: 0,
      ytdTDS: ytdTDS,
      ytdGross: ytdGross,
      hraApplicable: emp.hraApplicable !== 'no',
    });

    return {
      employer: {
        name: org.name,
        tan: org.description || 'TAN-NOT-SET', // tan number field placeholder
        pan: org.website || 'PAN-NOT-SET', // pan number field placeholder
        address: org.street || 'Company Address'
      },
      employee: {
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
        pan: emp.panNumber || 'PAN-NOT-SET',
        employeeId: emp.employeeId,
        designation: emp.designation,
        department: emp.department
      },
      financialYear: dec.financialYearId || '2025-26',
      assessmentYear: this.getAssessmentYear(dec.financialYearId || '2025-26'),
      partA: {
        quarterlySummary: quarters,
        totalTDS: ytdTDS
      },
      partB: {
        regime,
        grossSalary: ytdGross,
        lessSection16: {
          standardDeduction: declarationsMap['STANDARD_DEDUCTION'] || 0,
          professionalTax: ytdPT,
          total: (declarationsMap['STANDARD_DEDUCTION'] || 0) + ytdPT
        },
        balanceIncome: ytdGross - ((declarationsMap['STANDARD_DEDUCTION'] || 0) + ytdPT),
        chapterVIA: taxComp.exemptionBreakdown,
        totalTaxableIncome: taxComp.taxableIncome,
        taxOnIncome: taxComp.projectedAnnualTax,
        surcharge: taxComp.surcharge,
        cess: taxComp.cess,
        totalTaxLiability: taxComp.totalTaxLiability,
        taxDeductedYTD: ytdTDS,
        taxRefundDue: Math.max(0, ytdTDS - taxComp.totalTaxLiability),
        taxShortfall: Math.max(0, taxComp.totalTaxLiability - ytdTDS)
      }
    };
  }

  getAssessmentYear(fy) {
    // e.g. "2025-26" -> "2026-27"
    const years = fy.split('-');
    if (years.length === 2) {
      const y1 = parseInt(years[0]) + 1;
      const y2 = parseInt(years[1]) + 1;
      return `${y1}-${String(y2).slice(-2)}`;
    }
    return '2026-27';
  }
}
