/**
 * ═══════════════════════════════════════════════════════════
 * PT ENGINE (Professional Tax)
 * ═══════════════════════════════════════════════════════════
 * 
 * Professional Tax is SLAB based.
 * State configurable.
 * 
 * Example (Maharashtra):
 *   0 - 7500     = ₹0
 *   Above 7500   = ₹200
 *   February     = ₹300
 * 
 * All slabs loaded from PayrollPTSlabConfig.
 */

export class PTEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate Professional Tax
   * 
   * @param {Array} ptSlabs - From ConfigLoader.loadPTSlabs(state)
   * @param {number} grossSalary - Monthly gross salary
   * @param {number} month - Payroll month (1-12)
   * @param {string} state - Employee's work state
   * @returns {object} PT result
   */
  calculate(ptSlabs, grossSalary, month, state) {
    if (this.logger) this.logger.startStep(10, 'CALCULATE_PT');

    const result = {
      grossSalary,
      state,
      month,
      ptAmount: 0,
      matchedSlab: null,
      isMonthOverride: false,
    };

    if (!ptSlabs || ptSlabs.length === 0) {
      if (this.logger) {
        this.logger.log(10, 'CALCULATE_PT', 'PT',
          `No PT slabs configured for state: ${state}`,
          { state, grossSalary }, 0, result
        );
      }
      return result;
    }

    // Find matching slab
    for (const slab of ptSlabs) {
      const slabFrom = Number(slab.slabFrom || 0);
      const slabTo = Number(slab.slabTo || 99999999);

      if (grossSalary >= slabFrom && grossSalary <= slabTo) {
        let ptAmount = Number(slab.amount || 0);
        result.matchedSlab = { from: slabFrom, to: slabTo, amount: ptAmount };

        // Check month override (e.g., February for Maharashtra)
        if (ptAmount > 0 && slab.monthOverrides) {
          const overrides = typeof slab.monthOverrides === 'object' ? slab.monthOverrides : {};
          const monthKey = String(month);
          if (overrides[monthKey] !== undefined && overrides[monthKey] !== null) {
            ptAmount = Number(overrides[monthKey]);
            result.isMonthOverride = true;
          }
        }

        result.ptAmount = this.roundingEngine.salary(ptAmount);
        break;
      }
    }

    if (this.logger) {
      this.logger.log(10, 'CALCULATE_PT', 'PT',
        result.matchedSlab
          ? `Gross(${grossSalary}) in slab [${result.matchedSlab.from}-${result.matchedSlab.to}] = ₹${result.ptAmount}${result.isMonthOverride ? ` (Month ${month} override)` : ''}`
          : `Gross(${grossSalary}): No matching PT slab`,
        { state, grossSalary, month, slabCount: ptSlabs.length },
        result.ptAmount,
        result
      );
    }

    return result;
  }
}
