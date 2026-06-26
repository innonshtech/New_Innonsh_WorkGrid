/**
 * ═══════════════════════════════════════════════════════════
 * TAX ENGINE (TDS / Income Tax)
 * ═══════════════════════════════════════════════════════════
 * 
 * TAX PROJECTION:
 *   Projected Income = Past Earnings + Current Earnings + Future Projected Earnings
 * 
 * OLD REGIME:
 *   Taxable Income = Projected Income - 80C - 80D - 80CCD - 80E - 80G - HRA Exemption - Standard Deduction
 * 
 * NEW REGIME:
 *   Taxable Income = Projected Income - Standard Deduction - Employer NPS
 * 
 * MONTHLY TDS:
 *   Projected Annual Tax - Previous Employer TDS = Balance Tax
 *   Monthly TDS = Balance Tax / Remaining Payroll Months
 * 
 * All tax slabs from PayrollTaxSlabConfig.
 * All sections from PayrollTaxSectionConfig.
 */

export class TaxEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate monthly TDS
   * 
   * @param {object} params
   * @param {Array} taxSlabs - From ConfigLoader.loadTaxSlabs(regime, fy)
   * @param {Array} taxSections - From ConfigLoader.loadTaxSections(regime)
   * @param {string} regime - "OLD" or "NEW"
   * @param {number} monthlyGross - Monthly gross salary
   * @param {number} month - Current payroll month
   * @param {number} year - Current payroll year
   * @param {number} remainingMonths - Remaining months in FY
   * @param {object} declarations - Investment declarations { "80C": 150000, "80D": 25000, ... }
   * @param {number} previousEmployerTDS - TDS already deducted by previous employer
   * @param {number} ytdTDS - Year-to-date TDS already deducted
   * @param {number} ytdGross - Year-to-date gross already paid
   * @returns {object} Tax calculation breakdown
   */
  calculateMonthlyTDS({
    taxSlabs,
    taxSections,
    regime,
    monthlyGross,
    month,
    year,
    remainingMonths,
    declarations = {},
    previousEmployerTDS = 0,
    ytdTDS = 0,
    ytdGross = 0,
    hraApplicable = true,
  }) {
    if (this.logger) this.logger.startStep(11, 'CALCULATE_TAX');

    const result = {
      regime,
      monthlyGross,
      projectedAnnualIncome: 0,
      totalExemptions: 0,
      taxableIncome: 0,
      projectedAnnualTax: 0,
      surcharge: 0,
      cess: 0,
      totalTaxLiability: 0,
      previousEmployerTDS,
      ytdTDS,
      balanceTax: 0,
      monthlyTDS: 0,
      remainingMonths,
      exemptionBreakdown: {},
      slabBreakdown: [],
    };

    // ── Step 1: Project Annual Income ──
    // Past + Current + Future
    const pastIncome = ytdGross;
    const currentIncome = monthlyGross;
    const futureIncome = monthlyGross * (remainingMonths - 1); // -1 because current month is included
    const projectedAnnual = pastIncome + currentIncome + futureIncome;
    result.projectedAnnualIncome = this.roundingEngine.salary(projectedAnnual);

    if (!taxSlabs || taxSlabs.length === 0) {
      if (this.logger) {
        this.logger.log(11, 'CALCULATE_TAX', 'TDS',
          `No tax slabs configured for regime: ${regime}`,
          { regime }, 0, result);
      }
      return result;
    }

    // ── Step 2: Calculate Exemptions ──
    let totalExemptions = 0;
    const exemptionBreakdown = {};

    if (regime === 'OLD') {
      // 1. Calculate HRA Exemption if HRA rent details are present
      const hraRent = Number(declarations['HRA_RENT'] || 0);
      if (hraRent > 0 && hraApplicable !== false) {
        const annualBasic = Number(declarations['BASIC_ANNUAL'] || 0);
        const annualHraReceived = Number(declarations['HRA_ANNUAL'] || 0);
        
        // Indian HRA exemption rules:
        // Min of:
        // a. Actual HRA received
        // b. Rent paid - 10% of Basic
        // c. Metro Rate of Basic (Metro) or Non-Metro Rate of Basic (Non-Metro)
        const isMetro = declarations['HRA_CITY'] === 'Metro';
        const metroRate = taxSections?.find(s => s.sectionCode === 'HRA_METRO_RATE')?.maxLimit || 50;
        const nonMetroRate = taxSections?.find(s => s.sectionCode === 'HRA_NON_METRO_RATE')?.maxLimit || 40;
        const basicLimit = isMetro ? (annualBasic * (metroRate / 100)) : (annualBasic * (nonMetroRate / 100));
        const rentMinusBasic = Math.max(0, hraRent - (annualBasic * 0.1));
        
        const hraExemption = Math.min(annualHraReceived, rentMinusBasic, basicLimit);
        if (hraExemption > 0) {
          exemptionBreakdown['HRA'] = {
            declared: hraRent,
            maxLimit: annualHraReceived,
            allowed: this.roundingEngine.tax(hraExemption),
            rule: `Min of [HRA: ₹${annualHraReceived}, (Rent - 10% Basic): ₹${rentMinusBasic.toFixed(0)}, (${isMetro ? '50%' : '40%'} Basic): ₹${basicLimit.toFixed(0)}]`
          };
          totalExemptions += hraExemption;
        }
      }

      // 2. Apply other sections
      for (const section of (taxSections || [])) {
        if (section.sectionCode === 'HRA' && exemptionBreakdown['HRA']) {
          // Already calculated dynamically above
          continue;
        }
        const defaultValue = section.sectionCode === 'STANDARD_DEDUCTION' ? section.maxLimit : 0;
        const declared = declarations[section.sectionCode] !== undefined 
          ? Number(declarations[section.sectionCode]) 
          : defaultValue;
        const allowed = Math.min(declared, section.maxLimit);
        if (allowed > 0) {
          exemptionBreakdown[section.sectionCode] = {
            declared,
            maxLimit: section.maxLimit,
            allowed,
          };
          totalExemptions += allowed;
        }
      }
    } else {
      // NEW Regime: Only Standard Deduction and Employer NPS
      for (const section of (taxSections || [])) {
        if (['STANDARD_DEDUCTION', 'EMPLOYER_NPS'].includes(section.sectionCode)) {
          const declared = Number(declarations[section.sectionCode] || section.maxLimit);
          const allowed = Math.min(declared, section.maxLimit);
          if (allowed > 0) {
            exemptionBreakdown[section.sectionCode] = {
              declared,
              maxLimit: section.maxLimit,
              allowed,
            };
            totalExemptions += allowed;
          }
        }
      }
    }

    result.totalExemptions = totalExemptions;
    result.exemptionBreakdown = exemptionBreakdown;

    // ── Step 3: Taxable Income ──
    const taxableIncome = Math.max(0, projectedAnnual - totalExemptions);
    result.taxableIncome = this.roundingEngine.salary(taxableIncome);

    // ── Step 4: Calculate Tax from Slabs ──
    let totalTax = 0;
    let remainingIncome = taxableIncome;
    const slabBreakdown = [];

    // Sort slabs by slabFrom
    const sortedSlabs = [...taxSlabs].sort((a, b) => a.slabFrom - b.slabFrom);

    for (const slab of sortedSlabs) {
      if (remainingIncome <= 0) break;

      const slabWidth = (slab.slabTo || 99999999) - slab.slabFrom;
      const taxableInSlab = Math.min(remainingIncome, slabWidth);
      const taxForSlab = (taxableInSlab * Number(slab.rate)) / 100;

      slabBreakdown.push({
        from: slab.slabFrom,
        to: slab.slabTo,
        rate: slab.rate,
        taxableAmount: this.roundingEngine.salary(taxableInSlab),
        taxAmount: this.roundingEngine.tax(taxForSlab),
      });

      totalTax += taxForSlab;
      remainingIncome -= taxableInSlab;
    }

    result.projectedAnnualTax = this.roundingEngine.tax(totalTax);
    result.slabBreakdown = slabBreakdown;

    // ── Step 4B: Section 87A Rebate & Marginal Relief ──
    let rebateAmount = 0;
    
    // Rebate Limits for FY 2026-27 (New Regime: 12L, Old Regime: 5L)
    const isNewRegime = regime.toUpperCase() === 'NEW';
    const rebateThreshold = isNewRegime ? 1200000 : 500000;
    
    if (taxableIncome <= rebateThreshold) {
      // Full Rebate
      rebateAmount = totalTax;
      totalTax = 0;
    } else {
      // Marginal Relief Check
      // If the tax causes their take-home to be less than what it would be at the threshold, 
      // cap the tax at the income exceeding the threshold.
      const incomeExceedingThreshold = taxableIncome - rebateThreshold;
      if (totalTax > incomeExceedingThreshold) {
        rebateAmount = totalTax - incomeExceedingThreshold;
        totalTax = incomeExceedingThreshold;
      }
    }
    
    result.rebate87A = this.roundingEngine.tax(rebateAmount);
    result.taxAfterRebate = this.roundingEngine.tax(totalTax);

    // ── Step 5: Surcharge ──
    let surcharge = 0;
    const applicableSlab = sortedSlabs.find(s => s.surchargeRate > 0 && taxableIncome > (s.surchargeThreshold || 0));
    if (applicableSlab && applicableSlab.surchargeRate > 0) {
      surcharge = (totalTax * applicableSlab.surchargeRate) / 100;
    }
    result.surcharge = this.roundingEngine.tax(surcharge);

    // ── Step 6: Cess ──
    const cessRate = sortedSlabs[0]?.cessRate || 4;
    const cess = ((totalTax + surcharge) * cessRate) / 100;
    result.cess = this.roundingEngine.tax(cess);

    // ── Step 7: Total Tax Liability ──
    const totalLiability = totalTax + surcharge + cess;
    result.totalTaxLiability = this.roundingEngine.tax(totalLiability);

    // ── Step 8: Monthly TDS ──
    // Balance Tax = Total Tax - Previous Employer TDS - YTD TDS
    const balanceTax = Math.max(0, totalLiability - previousEmployerTDS - ytdTDS);
    result.balanceTax = this.roundingEngine.tax(balanceTax);

    // Monthly TDS = Balance Tax / Remaining Months
    const monthlyTDS = remainingMonths > 0 ? balanceTax / remainingMonths : 0;
    result.monthlyTDS = this.roundingEngine.tax(monthlyTDS);

    if (this.logger) {
      this.logger.log(11, 'CALCULATE_TAX', 'TDS',
        `${regime} Regime: Projected Income = ₹${projectedAnnual}, Exemptions = ₹${totalExemptions}, Taxable = ₹${taxableIncome}, Annual Tax = ₹${result.projectedAnnualTax}, Monthly TDS = ₹${result.monthlyTDS}`,
        {
          regime, monthlyGross, projectedAnnual, taxableIncome,
          totalExemptions, remainingMonths, ytdTDS, previousEmployerTDS,
        },
        result.monthlyTDS,
        result
      );
    }

    return result;
  }
}
