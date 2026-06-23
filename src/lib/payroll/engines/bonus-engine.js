/**
 * ═══════════════════════════════════════════════════════════
 * BONUS ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Bonus = Eligible Salary × Bonus Percentage
 * 
 * Supports:
 *   Monthly Bonus
 *   Quarterly Bonus
 *   Yearly Bonus
 *   Performance Bonus
 *   Festival Bonus
 * 
 * Calculation methods: FLAT, PERCENTAGE_BASIC, PERCENTAGE_GROSS, CUSTOM
 */

export class BonusEngine {
  constructor(roundingEngine, logger) {
    this.roundingEngine = roundingEngine;
    this.logger = logger;
  }

  /**
   * Calculate bonus from configuration
   * 
   * @param {Array} bonusConfigs - From ConfigLoader.loadBonusConfigs()
   * @param {object} componentValues - Resolved component values { "BASIC": 25000, ... }
   * @param {number} grossSalary - Monthly gross
   * @returns {object} Bonus breakdown
   */
  calculateFromConfig(bonusConfigs, componentValues, grossSalary) {
    if (this.logger) this.logger.startStep(8, 'CALCULATE_BONUS_CONFIG');

    const result = {
      bonuses: [],
      totalBonus: 0,
    };

    if (!bonusConfigs || bonusConfigs.length === 0) return result;

    for (const config of bonusConfigs) {
      let amount = 0;

      switch (config.calculationMethod) {
        case 'FLAT':
          amount = Number(config.flatAmount || 0);
          break;

        case 'PERCENTAGE_BASIC': {
          const basic = Number(componentValues['BASIC'] || 0);
          amount = (basic * Number(config.percentage || 0)) / 100;
          break;
        }

        case 'PERCENTAGE_GROSS':
          amount = (grossSalary * Number(config.percentage || 0)) / 100;
          break;

        case 'CUSTOM': {
          // Custom: calculate from eligible components
          const eligible = (config.eligibleComponents || []).reduce((sum, code) => {
            return sum + Number(componentValues[code] || 0);
          }, 0);
          amount = (eligible * Number(config.percentage || 0)) / 100;
          break;
        }
      }

      amount = this.roundingEngine.salary(amount);

      if (amount > 0) {
        result.bonuses.push({
          name: config.name,
          type: config.bonusType,
          method: config.calculationMethod,
          amount,
        });
        result.totalBonus += amount;
      }
    }

    if (this.logger) {
      this.logger.log(8, 'CALCULATE_BONUS_CONFIG', 'BONUS',
        `${result.bonuses.length} bonus(es) calculated, total = ₹${result.totalBonus}`,
        { bonusCount: bonusConfigs.length },
        result.totalBonus,
        result
      );
    }

    return result;
  }

  /**
   * Calculate bonus from pending bonus records
   * 
   * @param {Array} pendingBonuses - From ConfigLoader.loadPendingBonuses()
   * @returns {object} Bonus breakdown
   */
  calculateFromPending(pendingBonuses) {
    const result = {
      bonuses: [],
      totalBonus: 0,
    };

    if (!pendingBonuses || pendingBonuses.length === 0) return result;

    for (const bonus of pendingBonuses) {
      const amount = this.roundingEngine.salary(Number(bonus.amount || 0));
      if (amount > 0) {
        result.bonuses.push({
          name: bonus.reason || 'Bonus',
          type: 'PENDING',
          bonusId: bonus.id,
          amount,
        });
        result.totalBonus += amount;
      }
    }

    return result;
  }
}
