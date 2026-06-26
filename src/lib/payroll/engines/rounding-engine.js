/**
 * ═══════════════════════════════════════════════════════════
 * ROUNDING ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Salary Components  = 2 Decimals
 * PF                 = Nearest Rupee
 * ESI                = Statutory Rule
 * Income Tax         = Nearest Rupee
 * Net Pay            = Nearest Rupee
 * 
 * All rounding rules are configurable from PayrollRoundingConfig.
 */

import prisma from '@/lib/db/prisma';

// Default rounding rules (used if no config found in DB)
const DEFAULT_ROUNDING_RULES = {
  SALARY:   { method: 'DECIMAL_2', decimalPlaces: 2 },
  PF:       { method: 'NEAREST_RUPEE', decimalPlaces: 0 },
  ESI:      { method: 'CEIL', decimalPlaces: 0 },
  TAX:      { method: 'NEAREST_RUPEE', decimalPlaces: 0 },
  NET_PAY:  { method: 'NEAREST_RUPEE', decimalPlaces: 0 },
  GRATUITY: { method: 'NEAREST_RUPEE', decimalPlaces: 0 },
};

export class RoundingEngine {
  constructor() {
    this._rules = { ...DEFAULT_ROUNDING_RULES };
    this._loaded = false;
  }

  /**
   * Load rounding configuration from database
   * Falls back to defaults if no config found
   */
  async loadConfig(organizationId) {
    try {
      const conditions = [{ organizationId: null }];
      if (organizationId) conditions.push({ organizationId });

      const configs = await prisma.payrollRoundingConfig.findMany({
        where: {
          OR: conditions,
          isActive: true,
        },
      });

      // Sort configs: global (null) first, org-specific next, so org-specific overrides global
      const sortedConfigs = [...configs].sort((a, b) => {
        if (a.organizationId === null && b.organizationId !== null) return -1;
        if (a.organizationId !== null && b.organizationId === null) return 1;
        return 0;
      });

      for (const config of sortedConfigs) {
        this._rules[config.componentType] = {
          method: config.roundingMethod,
          decimalPlaces: config.decimalPlaces,
        };
      }

      this._loaded = true;
    } catch (error) {
      console.warn('[RoundingEngine] Failed to load config, using defaults:', error.message);
      this._loaded = true;
    }
  }

  /**
   * Round a value based on component type
   * 
   * @param {number} value - The value to round
   * @param {string} componentType - "SALARY", "PF", "ESI", "TAX", "NET_PAY", "GRATUITY"
   * @returns {number} Rounded value
   */
  round(value, componentType = 'SALARY') {
    if (value === null || value === undefined || isNaN(value)) return 0;

    const rule = this._rules[componentType] || this._rules.SALARY;

    switch (rule.method) {
      case 'DECIMAL_2':
        return Number(Number(value).toFixed(rule.decimalPlaces || 2));

      case 'NEAREST_RUPEE':
        return Math.round(value);

      case 'FLOOR':
        return Math.floor(value * Math.pow(10, rule.decimalPlaces)) / Math.pow(10, rule.decimalPlaces);

      case 'CEIL':
        return Math.ceil(value * Math.pow(10, rule.decimalPlaces)) / Math.pow(10, rule.decimalPlaces);

      default:
        return Number(Number(value).toFixed(2));
    }
  }

  /**
   * Round salary component
   */
  salary(value) {
    return this.round(value, 'SALARY');
  }

  /**
   * Round PF amount
   */
  pf(value) {
    return this.round(value, 'PF');
  }

  /**
   * Round ESI amount
   */
  esi(value) {
    return this.round(value, 'ESI');
  }

  /**
   * Round tax amount
   */
  tax(value) {
    return this.round(value, 'TAX');
  }

  /**
   * Round net pay
   */
  netPay(value) {
    return this.round(value, 'NET_PAY');
  }

  /**
   * Round gratuity
   */
  gratuity(value) {
    return this.round(value, 'GRATUITY');
  }

  /**
   * Get current rules (for logging/audit)
   */
  getRules() {
    return { ...this._rules };
  }
}
