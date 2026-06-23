/**
 * ═══════════════════════════════════════════════════════════
 * ARREAR ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Arrear = Revised Salary - Paid Salary
 * 
 * Recompute: PF, ESI, TDS for arrear months
 * 
 * Generate arrear payslip.
 */

export class ArrearEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate arrears from pending retro adjustments
   * 
   * @param {Array} pendingArrears - From ConfigLoader.loadPendingArrears()
   * @returns {object} Arrear breakdown
   */
  calculate(pendingArrears) {
    if (this.logger) this.logger.startStep(12, 'CALCULATE_ARREARS');

    const result = {
      arrears: [],
      totalArrear: 0,
      pfArrear: 0,
      esiArrear: 0,
      tdsArrear: 0,
    };

    if (!pendingArrears || pendingArrears.length === 0) {
      if (this.logger) {
        this.logger.log(12, 'CALCULATE_ARREARS', 'ARREAR',
          'No pending arrears', {}, 0, result);
      }
      return result;
    }

    for (const arrear of pendingArrears) {
      const data = arrear.modelData && typeof arrear.modelData === 'object' ? arrear.modelData : {};
      const amount = Number(data.amount || data.arrearAmount || 0);
      const arrearType = data.arrearType || 'SALARY_REVISION';
      const fromMonth = data.fromMonth;
      const toMonth = data.toMonth;

      // PF/ESI/TDS adjustments from arrear data
      const pfAdj = Number(data.pfAdjustment || 0);
      const esiAdj = Number(data.esiAdjustment || 0);
      const tdsAdj = Number(data.tdsAdjustment || 0);

      if (amount !== 0) {
        result.arrears.push({
          arrearId: arrear.id,
          type: arrearType,
          amount: this.roundingEngine.salary(amount),
          fromMonth,
          toMonth,
          pfAdjustment: pfAdj,
          esiAdjustment: esiAdj,
          tdsAdjustment: tdsAdj,
          description: data.description || `${arrearType} arrear`,
        });

        result.totalArrear += amount;
        result.pfArrear += pfAdj;
        result.esiArrear += esiAdj;
        result.tdsArrear += tdsAdj;
      }
    }

    result.totalArrear = this.roundingEngine.salary(result.totalArrear);

    if (this.logger) {
      this.logger.log(12, 'CALCULATE_ARREARS', 'ARREAR',
        `${result.arrears.length} arrear(s), total = ₹${result.totalArrear}`,
        { arrearCount: pendingArrears.length },
        result.totalArrear,
        result
      );
    }

    return result;
  }
}
