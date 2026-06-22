/**
 * ═══════════════════════════════════════════════════════════
 * PF ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * PF Wage       = Sum of Configured Components (from PayrollPFConfig)
 * Employee PF   = MIN(PF Wage, PF Ceiling) × PF %
 * Employer PF   = MIN(PF Wage, PF Ceiling) × Employer PF %
 * EPS           = MIN(PF Wage, PF Ceiling) × EPS %
 * Employer EPF  = Employer PF - EPS
 * 
 * PF Ceiling configurable.
 * All rates configurable.
 * PF wage components configurable.
 */

export class PFEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate PF for an employee
   * 
   * @param {object} pfConfig - From ConfigLoader.loadPFConfig()
   * @param {object} componentValues - Resolved component values { "BASIC": 25000, "DA": 5000, ... }
   * @param {boolean} isPFApplicable - Whether PF is applicable for this employee
   * @returns {object} PF breakdown
   */
  calculate(pfConfig, componentValues, isPFApplicable) {
    if (this.logger) this.logger.startStep(10, 'CALCULATE_PF');

    const result = {
      pfWage: 0,
      pfCeiling: pfConfig.pfCeiling,
      pfBasis: 0,
      employeePF: 0,
      employerPF: 0,
      eps: 0,
      employerEPF: 0,
      adminCharge: 0,
      edli: 0,
      totalEmployeeDeduction: 0,
      totalEmployerCost: 0,
    };

    if (!isPFApplicable) {
      if (this.logger) {
        this.logger.log(10, 'CALCULATE_PF', 'PF', 'PF not applicable for this employee', { isPFApplicable }, 0, result);
      }
      return result;
    }

    // Step 1: Calculate PF Wage from configured components
    const pfWageComponents = pfConfig.pfWageComponents || ['BASIC', 'DA'];
    let pfWage = 0;
    for (const code of pfWageComponents) {
      pfWage += Number(componentValues[code] || 0);
    }
    result.pfWage = pfWage;

    // Step 2: Apply PF Ceiling
    const pfCeiling = Number(pfConfig.pfCeiling || 15000);
    result.pfCeiling = pfCeiling;
    result.pfBasis = pfConfig.restrictToCeiling !== false
      ? Math.min(pfWage, pfCeiling)
      : pfWage;

    // Step 3: Employee PF
    const employeePFRate = Number(pfConfig.employeePFRate || 12);
    result.employeePF = this.roundingEngine.pf((result.pfBasis * employeePFRate) / 100);

    // Step 4: Employer PF (total)
    const employerPFRate = Number(pfConfig.employerPFRate || 12);
    result.employerPF = this.roundingEngine.pf((result.pfBasis * employerPFRate) / 100);

    // Step 5: EPS (from employer's share)
    const epsRate = Number(pfConfig.epsRate || 8.33);
    result.eps = this.roundingEngine.pf((result.pfBasis * epsRate) / 100);

    // Step 6: Employer EPF = Employer PF - EPS
    result.employerEPF = this.roundingEngine.pf(result.employerPF - result.eps);

    // Step 7: Admin charges
    const adminRate = Number(pfConfig.adminChargeRate || 0.5);
    result.adminCharge = this.roundingEngine.pf((result.pfBasis * adminRate) / 100);

    const edliRate = Number(pfConfig.edliRate || 0.5);
    result.edli = this.roundingEngine.pf((result.pfBasis * edliRate) / 100);

    // Totals
    result.totalEmployeeDeduction = result.employeePF;
    result.totalEmployerCost = result.employerPF + result.adminCharge + result.edli;

    // Log
    if (this.logger) {
      this.logger.log(10, 'CALCULATE_PF', 'PF',
        `PF Wage = ${pfWageComponents.join('+')} = ${pfWage}, Basis = MIN(${pfWage}, ${pfCeiling}) = ${result.pfBasis}, Employee PF = ${result.pfBasis} × ${employeePFRate}% = ${result.employeePF}`,
        { pfWageComponents, pfWage, pfCeiling, employeePFRate, employerPFRate, epsRate },
        result.employeePF,
        result
      );
    }

    return result;
  }
}
