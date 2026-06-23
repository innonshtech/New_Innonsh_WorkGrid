/**
 * ═══════════════════════════════════════════════════════════
 * LWF ENGINE (Labour Welfare Fund)
 * ═══════════════════════════════════════════════════════════
 * 
 * State wise configuration.
 * Deduction frequency configurable:
 *   MONTHLY, HALF_YEARLY, YEARLY
 * 
 * Only deducted in applicable months.
 */

export class LWFEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate LWF
   * 
   * @param {object|null} lwfConfig - From ConfigLoader.loadLWFConfig(state)
   * @param {number} month - Payroll month (1-12)
   * @param {string} state - Employee's work state
   * @returns {object} LWF result
   */
  calculate(lwfConfig, month, state) {
    if (this.logger) this.logger.startStep(10, 'CALCULATE_LWF');

    const result = {
      state,
      month,
      employeeAmount: 0,
      employerAmount: 0,
      isApplicableMonth: false,
      frequency: null,
    };

    if (!lwfConfig) {
      if (this.logger) {
        this.logger.log(10, 'CALCULATE_LWF', 'LWF',
          `No LWF config for state: ${state}`,
          { state, month }, 0, result
        );
      }
      return result;
    }

    result.frequency = lwfConfig.frequency;

    // Check if this month is applicable
    const applicableMonths = lwfConfig.applicableMonths || [];
    const isApplicable = applicableMonths.length === 0 || applicableMonths.includes(month);

    if (!isApplicable) {
      if (this.logger) {
        this.logger.log(10, 'CALCULATE_LWF', 'LWF',
          `LWF not applicable in month ${month}. Applicable months: ${applicableMonths.join(', ')}`,
          { state, month, applicableMonths }, 0, result
        );
      }
      return result;
    }

    result.isApplicableMonth = true;
    result.employeeAmount = this.roundingEngine.salary(Number(lwfConfig.employeeAmount || 0));
    result.employerAmount = this.roundingEngine.salary(Number(lwfConfig.employerAmount || 0));

    if (this.logger) {
      this.logger.log(10, 'CALCULATE_LWF', 'LWF',
        `LWF for ${state}: Employee = ₹${result.employeeAmount}, Employer = ₹${result.employerAmount} (${lwfConfig.frequency})`,
        { state, month, frequency: lwfConfig.frequency },
        result.employeeAmount,
        result
      );
    }

    return result;
  }
}
