/**
 * ═══════════════════════════════════════════════════════════
 * LEAVE ENCASHMENT ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Per Day Salary = Basic / Working Days
 * Leave Encashment = Unused Leave × Per Day Salary
 */

export class LeaveEncashmentEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate leave encashment
   * 
   * @param {number} basicSalary - Monthly basic salary
   * @param {number} workingDaysPerMonth - Working days in month (configurable)
   * @param {number} unusedLeaves - Number of unused leaves to encash
   * @returns {object} Leave encashment result
   */
  calculate(basicSalary, workingDaysPerMonth, unusedLeaves) {
    if (this.logger) this.logger.startStep(8, 'CALCULATE_LEAVE_ENCASHMENT');

    const result = {
      basicSalary,
      workingDays: workingDaysPerMonth,
      perDaySalary: 0,
      unusedLeaves,
      encashmentAmount: 0,
    };

    if (!unusedLeaves || unusedLeaves <= 0 || !basicSalary || basicSalary <= 0) {
      if (this.logger) {
        this.logger.log(8, 'CALCULATE_LEAVE_ENCASHMENT', 'LEAVE_ENCASHMENT',
          'No leaves to encash or no basic salary', { basicSalary, unusedLeaves }, 0, result);
      }
      return result;
    }

    const workingDays = Number(workingDaysPerMonth || 26);
    const perDaySalary = basicSalary / workingDays;
    const encashment = unusedLeaves * perDaySalary;

    result.perDaySalary = this.roundingEngine.salary(perDaySalary);
    result.encashmentAmount = this.roundingEngine.salary(encashment);

    if (this.logger) {
      this.logger.log(8, 'CALCULATE_LEAVE_ENCASHMENT', 'LEAVE_ENCASHMENT',
        `Per Day = ${basicSalary} / ${workingDays} = ${perDaySalary.toFixed(2)}, Encashment = ${unusedLeaves} × ${perDaySalary.toFixed(2)} = ₹${result.encashmentAmount}`,
        { basicSalary, workingDays, unusedLeaves },
        result.encashmentAmount,
        result
      );
    }

    return result;
  }
}
