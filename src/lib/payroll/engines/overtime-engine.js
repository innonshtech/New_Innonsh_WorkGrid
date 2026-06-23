/**
 * ═══════════════════════════════════════════════════════════
 * OVERTIME ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Hourly Rate = Monthly Salary / Working Days / Working Hours
 * OT Amount   = OT Hours × Hourly Rate × OT Multiplier
 * 
 * Multiplier configurable.
 * Max OT hours configurable.
 * Base salary components configurable.
 */

export class OvertimeEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate overtime
   * 
   * @param {object} otConfig - From ConfigLoader.loadOTConfig()
   * @param {object} componentValues - { "BASIC": 25000, ... }
   * @param {number} otHours - Overtime hours from attendance
   * @returns {object} OT breakdown
   */
  calculate(otConfig, componentValues, otHours) {
    if (this.logger) this.logger.startStep(8, 'CALCULATE_OVERTIME');

    const result = {
      otHours: 0,
      hourlyRate: 0,
      otMultiplier: otConfig.otMultiplier || 2,
      otAmount: 0,
      baseSalary: 0,
      workingDays: otConfig.workingDaysPerMonth || 26,
      workingHours: otConfig.workingHoursPerDay || 8,
      capped: false,
    };

    if (!otHours || otHours <= 0) {
      if (this.logger) {
        this.logger.log(8, 'CALCULATE_OVERTIME', 'OVERTIME', 'No OT hours', {}, 0, result);
      }
      return result;
    }

    // Cap OT hours if configured
    let effectiveOTHours = otHours;
    if (otConfig.maxOTHoursPerMonth && otHours > otConfig.maxOTHoursPerMonth) {
      effectiveOTHours = otConfig.maxOTHoursPerMonth;
      result.capped = true;
    }
    result.otHours = effectiveOTHours;

    // Calculate base salary from configured components
    const baseComponents = otConfig.baseSalaryComponents || ['BASIC'];
    let baseSalary = 0;
    for (const code of baseComponents) {
      baseSalary += Number(componentValues[code] || 0);
    }
    result.baseSalary = baseSalary;

    // Hourly Rate = Monthly Salary / Working Days / Working Hours
    const workingDays = Number(otConfig.workingDaysPerMonth || 26);
    const workingHours = Number(otConfig.workingHoursPerDay || 8);
    result.hourlyRate = baseSalary / workingDays / workingHours;

    // OT Amount = OT Hours × Hourly Rate × OT Multiplier
    const multiplier = Number(otConfig.otMultiplier || 2);
    result.otMultiplier = multiplier;
    result.otAmount = this.roundingEngine.salary(effectiveOTHours * result.hourlyRate * multiplier);

    if (this.logger) {
      this.logger.log(8, 'CALCULATE_OVERTIME', 'OVERTIME',
        `Hourly Rate = ${baseSalary} / ${workingDays} / ${workingHours} = ${result.hourlyRate.toFixed(2)}, OT = ${effectiveOTHours} × ${result.hourlyRate.toFixed(2)} × ${multiplier} = ₹${result.otAmount}`,
        { baseSalary, otHours: effectiveOTHours, multiplier },
        result.otAmount,
        result
      );
    }

    return result;
  }
}
