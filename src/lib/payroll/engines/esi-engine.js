/**
 * ═══════════════════════════════════════════════════════════
 * ESI ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * If Gross Salary <= ESI Threshold:
 *   Employee ESI = Gross Salary × Employee ESI %
 *   Employer ESI = Gross Salary × Employer ESI %
 * Else:
 *   ESI = 0
 * 
 * Threshold configurable.
 * Rates configurable.
 */

export class ESIEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate ESI
   * 
   * @param {object} esiConfig - From ConfigLoader.loadESIConfig()
   * @param {number} grossSalary - Monthly gross salary
   * @param {boolean} isESIApplicable - Whether ESI is applicable for this employee
   * @returns {object} ESI breakdown
   */
  calculate(esiConfig, grossSalary, isESIApplicable) {
    if (this.logger) this.logger.startStep(10, 'CALCULATE_ESI');

    const result = {
      grossSalary,
      threshold: esiConfig.grossThreshold,
      isApplicable: false,
      employeeESI: 0,
      employerESI: 0,
      totalEmployeeDeduction: 0,
      totalEmployerCost: 0,
    };

    if (!isESIApplicable) {
      if (this.logger) {
        this.logger.log(10, 'CALCULATE_ESI', 'ESI', 'ESI not applicable for this employee', { isESIApplicable }, 0, result);
      }
      return result;
    }

    const threshold = Number(esiConfig.grossThreshold || 21000);
    const employeeRate = Number(esiConfig.employeeRate || 0.75);
    const employerRate = Number(esiConfig.employerRate || 3.25);

    result.threshold = threshold;

    if (grossSalary <= threshold) {
      result.isApplicable = true;
      result.employeeESI = this.roundingEngine.esi((grossSalary * employeeRate) / 100);
      result.employerESI = this.roundingEngine.esi((grossSalary * employerRate) / 100);
      result.totalEmployeeDeduction = result.employeeESI;
      result.totalEmployerCost = result.employerESI;
    }

    if (this.logger) {
      this.logger.log(10, 'CALCULATE_ESI', 'ESI',
        grossSalary <= threshold
          ? `Gross(${grossSalary}) <= Threshold(${threshold}): Employee ESI = ${grossSalary} × ${employeeRate}% = ${result.employeeESI}`
          : `Gross(${grossSalary}) > Threshold(${threshold}): ESI = 0`,
        { grossSalary, threshold, employeeRate, employerRate },
        result.employeeESI,
        result
      );
    }

    return result;
  }
}
