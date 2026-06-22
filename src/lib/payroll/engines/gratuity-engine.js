/**
 * ═══════════════════════════════════════════════════════════
 * GRATUITY ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Eligibility: Minimum Service Years (configurable)
 * 
 * Formula:
 *   (Basic + DA) × 15 ÷ 26 × Completed Years
 * 
 * All values configurable:
 *   - daysPerYear (default: 15)
 *   - divisor (default: 26)
 *   - eligible components (default: ["BASIC", "DA"])
 *   - max amount (government cap)
 */

export class GratuityEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate gratuity
   * 
   * @param {object} gratuityConfig - From ConfigLoader.loadGratuityConfig()
   * @param {object} componentValues - { "BASIC": 25000, "DA": 5000, ... }
   * @param {Date} dateOfJoining - Employee's joining date
   * @param {Date} asOfDate - Calculate as of this date
   * @returns {object} Gratuity result
   */
  calculate(gratuityConfig, componentValues, dateOfJoining, asOfDate = new Date()) {
    if (this.logger) this.logger.startStep(12, 'CALCULATE_GRATUITY');

    const result = {
      isEligible: false,
      serviceYears: 0,
      serviceDays: 0,
      eligibleSalary: 0,
      daysPerYear: gratuityConfig.daysPerYear || 15,
      divisor: gratuityConfig.divisor || 26,
      gratuityAmount: 0,
      maxAmount: gratuityConfig.maxAmount || null,
      capped: false,
    };

    if (!dateOfJoining) {
      if (this.logger) {
        this.logger.log(12, 'CALCULATE_GRATUITY', 'GRATUITY', 'No joining date', {}, 0, result);
      }
      return result;
    }

    // Calculate service years
    const joiningDate = new Date(dateOfJoining);
    const diffMs = asOfDate.getTime() - joiningDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const serviceYears = Math.floor(diffDays / 365);
    result.serviceYears = serviceYears;
    result.serviceDays = diffDays;

    // Check eligibility
    const minYears = Number(gratuityConfig.minServiceYears || 5);
    result.isEligible = serviceYears >= minYears;

    if (!result.isEligible) {
      if (this.logger) {
        this.logger.log(12, 'CALCULATE_GRATUITY', 'GRATUITY',
          `Service years (${serviceYears}) < minimum (${minYears})`,
          { serviceYears, minYears }, 0, result);
      }
      return result;
    }

    // Calculate eligible salary from configured components
    const eligibleComponents = gratuityConfig.eligibleComponents || ['BASIC', 'DA'];
    let eligibleSalary = 0;
    for (const code of eligibleComponents) {
      eligibleSalary += Number(componentValues[code] || 0);
    }
    result.eligibleSalary = eligibleSalary;

    // Gratuity = (Eligible Salary) × daysPerYear ÷ divisor × Service Years
    const daysPerYear = Number(gratuityConfig.daysPerYear || 15);
    const divisor = Number(gratuityConfig.divisor || 26);
    let gratuityAmount = (eligibleSalary * daysPerYear / divisor) * serviceYears;

    // Apply max cap if configured
    if (gratuityConfig.maxAmount && gratuityAmount > gratuityConfig.maxAmount) {
      gratuityAmount = gratuityConfig.maxAmount;
      result.capped = true;
    }

    result.gratuityAmount = this.roundingEngine.gratuity(gratuityAmount);

    if (this.logger) {
      this.logger.log(12, 'CALCULATE_GRATUITY', 'GRATUITY',
        `(${eligibleComponents.join('+')})(${eligibleSalary}) × ${daysPerYear} / ${divisor} × ${serviceYears} years = ₹${result.gratuityAmount}`,
        { eligibleSalary, daysPerYear, divisor, serviceYears },
        result.gratuityAmount,
        result
      );
    }

    return result;
  }
}
