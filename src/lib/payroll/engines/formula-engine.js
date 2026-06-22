/**
 * ═══════════════════════════════════════════════════════════
 * FORMULA ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * The system supports:
 * 
 *   FIXED VALUE
 *     Medical Allowance = 1250
 * 
 *   PERCENTAGE FORMULA
 *     Basic = Gross × 40%
 *     HRA = Basic × 50%
 * 
 *   DERIVED FORMULA
 *     Special Allowance = Gross - (Basic + HRA + DA + Other)
 * 
 *   CONDITIONAL FORMULA
 *     If Gross <= ESI Threshold → Apply ESI
 *     Else → ESI = 0
 * 
 *   SLAB BASED FORMULA
 *     PT: Gross 0-7500 = 0, Gross >7500 = 200
 * 
 *   CUSTOM EXPRESSION
 *     Any mathematical expression with variable substitution
 * 
 * All formula definitions come from database configuration.
 * No calculation logic is hardcoded.
 */

export class FormulaEngine {
  constructor(roundingEngine = null) {
    // Variable context — stores all resolved component values
    this._context = {};
    this._roundingEngine = roundingEngine;
  }

  // ─────────────────────────────────────────────────────────
  // CONTEXT MANAGEMENT
  // ─────────────────────────────────────────────────────────

  /**
   * Set the calculation context (all available variables)
   * Called before evaluating formulas
   */
  setContext(variables) {
    this._context = { ...this._context, ...variables };
  }

  /**
   * Get a variable from context
   */
  getVariable(name) {
    return this._context[name] !== undefined ? Number(this._context[name]) : 0;
  }

  /**
   * Get entire context (for logging)
   */
  getContext() {
    return { ...this._context };
  }

  /**
   * Clear context
   */
  clearContext() {
    this._context = {};
  }

  // ─────────────────────────────────────────────────────────
  // MAIN EVALUATOR
  // ─────────────────────────────────────────────────────────

  /**
   * Evaluate a formula configuration
   * 
   * @param {string} formulaType - "FIXED", "PERCENTAGE", "DERIVED", "CONDITIONAL", "SLAB", "CUSTOM_EXPRESSION"
   * @param {object} formulaConfig - Formula definition from database
   * @param {string} componentType - For rounding ("SALARY", "PF", etc.)
   * @returns {{ value: number, formulaDescription: string }} Result and human-readable formula
   */
  evaluate(formulaType, formulaConfig, componentType = 'SALARY') {
    let result;

    switch (formulaType) {
      case 'FIXED':
        result = this._evaluateFixed(formulaConfig);
        break;

      case 'PERCENTAGE':
        result = this._evaluatePercentage(formulaConfig);
        break;

      case 'DERIVED':
        result = this._evaluateDerived(formulaConfig);
        break;

      case 'CONDITIONAL':
        result = this._evaluateConditional(formulaConfig, componentType);
        break;

      case 'SLAB':
        result = this._evaluateSlab(formulaConfig);
        break;

      case 'CUSTOM_EXPRESSION':
        result = this._evaluateExpression(formulaConfig);
        break;

      default:
        throw new Error(`Unknown formula type: ${formulaType}`);
    }

    // Apply rounding
    if (this._roundingEngine) {
      result.value = this._roundingEngine.round(result.value, componentType);
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: FIXED VALUE
  // ─────────────────────────────────────────────────────────
  // Config: { "value": 1250 }

  _evaluateFixed(config) {
    const value = Number(config.value || 0);
    return {
      value,
      formulaDescription: `Fixed = ${value}`,
    };
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: PERCENTAGE
  // ─────────────────────────────────────────────────────────
  // Config: { "percentageOf": "GROSS", "percentage": 40 }
  // or:     { "percentageOf": "BASIC", "percentage": 50 }

  _evaluatePercentage(config) {
    const baseComponentCode = config.percentageOf;
    const percentage = Number(config.percentage || 0);
    const baseValue = this._resolveVariable(baseComponentCode);
    const value = (baseValue * percentage) / 100;

    return {
      value,
      formulaDescription: `${baseComponentCode}(${baseValue}) × ${percentage}% = ${value}`,
    };
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: DERIVED
  // ─────────────────────────────────────────────────────────
  // Config: { "baseComponent": "GROSS", "subtractComponents": ["BASIC", "HRA", "DA"] }
  // or:     { "addComponents": ["BASIC", "HRA", "DA"] }

  _evaluateDerived(config) {
    if (config.baseComponent && config.subtractComponents) {
      // Derived = Base - Sum(subtract components)
      const baseValue = this._resolveVariable(config.baseComponent);
      const subtractDetails = [];
      let subtractTotal = 0;

      for (const code of config.subtractComponents) {
        const val = this._resolveVariable(code);
        subtractTotal += val;
        subtractDetails.push(`${code}(${val})`);
      }

      const value = baseValue - subtractTotal;
      return {
        value: Math.max(0, value), // Derived can't be negative
        formulaDescription: `${config.baseComponent}(${baseValue}) - (${subtractDetails.join(' + ')}) = ${value}`,
      };
    }

    if (config.addComponents) {
      // Derived = Sum(add components)
      const addDetails = [];
      let total = 0;

      for (const code of config.addComponents) {
        const val = this._resolveVariable(code);
        total += val;
        addDetails.push(`${code}(${val})`);
      }

      return {
        value: total,
        formulaDescription: `Sum(${addDetails.join(' + ')}) = ${total}`,
      };
    }

    if (config.formula) {
      return this._evaluateExpression(config);
    }

    return { value: 0, formulaDescription: 'Derived: no valid config' };
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: CONDITIONAL
  // ─────────────────────────────────────────────────────────
  // Config: {
  //   "conditions": [
  //     {
  //       "if": "GROSS <= 21000",
  //       "then": { "formulaType": "PERCENTAGE", "formulaConfig": { "percentageOf": "GROSS", "percentage": 0.75 } }
  //     }
  //   ],
  //   "else": { "formulaType": "FIXED", "formulaConfig": { "value": 0 } }
  // }

  _evaluateConditional(config, componentType = 'SALARY') {
    const conditions = config.conditions || [];

    for (const condition of conditions) {
      const conditionStr = condition.if || condition.condition;
      const conditionResult = this._evaluateCondition(conditionStr);

      if (conditionResult) {
        const thenConfig = condition.then;
        const result = this.evaluate(
          thenConfig.formulaType,
          thenConfig.formulaConfig || thenConfig,
          componentType
        );
        return {
          value: result.value,
          formulaDescription: `IF (${conditionStr}) = TRUE → ${result.formulaDescription}`,
        };
      }
    }

    // Execute else branch
    if (config.else) {
      const elseConfig = config.else;
      const result = this.evaluate(
        elseConfig.formulaType,
        elseConfig.formulaConfig || elseConfig,
        componentType
      );
      return {
        value: result.value,
        formulaDescription: `ELSE → ${result.formulaDescription}`,
      };
    }

    return { value: 0, formulaDescription: 'Conditional: no matching condition, no else' };
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: SLAB BASED
  // ─────────────────────────────────────────────────────────
  // Config: {
  //   "slabOn": "GROSS",
  //   "slabs": [
  //     { "from": 0, "to": 7500, "value": 0 },
  //     { "from": 7500, "to": 99999999, "value": 200 }
  //   ],
  //   "monthOverrides": { "2": 300 }
  // }

  _evaluateSlab(config) {
    const slabVariable = config.slabOn || config.slabVariable;
    const slabValue = this._resolveVariable(slabVariable);
    const slabs = config.slabs || [];
    const month = this._context.PAYROLL_MONTH;

    for (const slab of slabs) {
      const from = Number(slab.from || 0);
      const to = Number(slab.to || 99999999);

      if (slabValue >= from && slabValue <= to) {
        let amount;

        // Check if this slab uses a rate (percentage) or a fixed value
        if (slab.rate !== undefined && slab.rate !== null) {
          amount = (slabValue * Number(slab.rate)) / 100;
        } else {
          amount = Number(slab.value || 0);
        }

        // Apply month override (e.g., February PT in Maharashtra)
        if (amount > 0 && config.monthOverrides && config.monthOverrides[String(month)]) {
          const overrideAmount = Number(config.monthOverrides[String(month)]);
          return {
            value: overrideAmount,
            formulaDescription: `SLAB on ${slabVariable}(${slabValue}): [${from}-${to}] = ${amount}, MONTH ${month} OVERRIDE = ${overrideAmount}`,
          };
        }

        return {
          value: amount,
          formulaDescription: `SLAB on ${slabVariable}(${slabValue}): [${from}-${to}] = ${amount}`,
        };
      }
    }

    return { value: 0, formulaDescription: `SLAB on ${slabVariable}(${slabValue}): no matching slab` };
  }

  // ─────────────────────────────────────────────────────────
  // FORMULA TYPE: CUSTOM EXPRESSION
  // ─────────────────────────────────────────────────────────
  // Config: { "formula": "(BASIC + DA) * 15 / 26 * SERVICE_YEARS" }

  _evaluateExpression(config) {
    const formula = config.formula || config.expression;
    if (!formula) return { value: 0, formulaDescription: 'Expression: empty formula' };

    let resolvedExpr = formula;
    const usedVars = {};

    // Replace all known variables with their values
    // Sort by length descending to avoid partial matches (e.g., "BASIC_DA" before "BASIC")
    const varNames = Object.keys(this._context).sort((a, b) => b.length - a.length);
    for (const varName of varNames) {
      const regex = new RegExp(`\\b${this._escapeRegex(varName)}\\b`, 'g');
      if (regex.test(resolvedExpr)) {
        usedVars[varName] = this._context[varName];
        resolvedExpr = resolvedExpr.replace(regex, String(Number(this._context[varName])));
      }
    }

    // Safe evaluation — only allows numeric operations
    try {
      // Validate: only allow numbers, operators, parentheses, and whitespace
      const safeExpr = resolvedExpr.replace(/\s/g, '');
      if (!/^[0-9+\-*/.()]+$/.test(safeExpr)) {
        throw new Error(`Unsafe expression: ${safeExpr}`);
      }

      const fn = new Function(`"use strict"; return (${resolvedExpr});`);
      const value = fn();

      return {
        value: isFinite(value) ? value : 0,
        formulaDescription: `Expression: ${formula} → ${resolvedExpr} = ${value}`,
      };
    } catch (error) {
      console.error(`[FormulaEngine] Expression eval failed: ${formula}`, error.message);
      return {
        value: 0,
        formulaDescription: `Expression ERROR: ${formula} → ${error.message}`,
      };
    }
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────

  /**
   * Resolve a variable name to its value from context
   */
  _resolveVariable(name) {
    if (name === null || name === undefined) return 0;

    // Direct context lookup
    if (this._context[name] !== undefined) {
      return Number(this._context[name]);
    }

    // Try as a number
    const num = parseFloat(name);
    if (!isNaN(num)) return num;

    return 0;
  }

  /**
   * Evaluate a condition string against context
   * Supports: <=, >=, <, >, ==, !=, &&, ||
   */
  _evaluateCondition(conditionStr) {
    if (!conditionStr) return false;

    let resolved = conditionStr;
    const varNames = Object.keys(this._context).sort((a, b) => b.length - a.length);
    for (const varName of varNames) {
      const regex = new RegExp(`\\b${this._escapeRegex(varName)}\\b`, 'g');
      resolved = resolved.replace(regex, String(Number(this._context[varName])));
    }

    try {
      // Validate: only numbers, comparison operators, logic operators, parens, whitespace
      const safe = resolved.replace(/\s/g, '');
      if (!/^[0-9+\-*/.()><=!&|]+$/.test(safe)) {
        throw new Error(`Unsafe condition: ${safe}`);
      }

      const fn = new Function(`"use strict"; return (${resolved});`);
      return Boolean(fn());
    } catch (error) {
      console.error(`[FormulaEngine] Condition eval failed: ${conditionStr}`, error.message);
      return false;
    }
  }

  /**
   * Escape special regex characters in variable names
   */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
