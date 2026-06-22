/**
 * ═══════════════════════════════════════════════════════════
 * PAYROLL CALCULATION LOGGER
 * ═══════════════════════════════════════════════════════════
 * 
 * Stores EVERY formula execution for audit & dispute resolution.
 * 
 * Stores:
 *   - Formula Used
 *   - Input Values
 *   - Output Value
 *   - Execution Time
 *   - User
 *   - Payroll Month
 * 
 * This is mandatory for audit and payroll dispute resolution.
 */

import prisma from '@/lib/db/prisma';

export class CalculationLogger {
  constructor({ organizationId, employeeId, payrollMonth, payrollYear, payrollRunId, calculatedById }) {
    this.organizationId = organizationId;
    this.employeeId = employeeId;
    this.payrollMonth = payrollMonth;
    this.payrollYear = payrollYear;
    this.payrollRunId = payrollRunId;
    this.calculatedById = calculatedById;

    // In-memory buffer — flushed to DB at end or on demand
    this._buffer = [];
    this._stepTimers = {};
  }

  /**
   * Start timing a step
   */
  startStep(stepNumber, stepName) {
    this._stepTimers[`${stepNumber}_${stepName}`] = performance.now();
  }

  /**
   * Log a single calculation step
   * 
   * @param {number} stepNumber - Step (1-14) in the calculation flow
   * @param {string} stepName - e.g., "CALCULATE_EARNINGS"
   * @param {string|null} componentCode - Which component (e.g., "BASIC", "HRA")
   * @param {string} formulaUsed - Human-readable formula description
   * @param {object} inputValues - All inputs to this calculation
   * @param {number|null} outputValue - Numeric result
   * @param {object|null} outputData - Complex output (breakdowns, etc.)
   * @param {string} status - "SUCCESS", "ERROR", "WARNING"
   * @param {string|null} errorMessage - Error details if status is ERROR
   */
  log(stepNumber, stepName, componentCode, formulaUsed, inputValues, outputValue, outputData = null, status = 'SUCCESS', errorMessage = null) {
    const timerKey = `${stepNumber}_${stepName}`;
    const startTime = this._stepTimers[timerKey];
    const executionTimeMs = startTime ? Math.round(performance.now() - startTime) : 0;

    this._buffer.push({
      organizationId: this.organizationId,
      employeeId: this.employeeId,
      payrollMonth: this.payrollMonth,
      payrollYear: this.payrollYear,
      payrollRunId: this.payrollRunId,
      stepNumber,
      stepName,
      componentCode: componentCode || null,
      formulaUsed: String(formulaUsed),
      inputValues: inputValues || {},
      outputValue: outputValue !== null && outputValue !== undefined ? Number(outputValue) : null,
      outputData: outputData || null,
      executionTimeMs,
      status,
      errorMessage: errorMessage || null,
      calculatedById: this.calculatedById,
    });
  }

  /**
   * Log a component calculation
   */
  logComponent(stepNumber, stepName, componentCode, formulaType, formulaConfig, inputs, result) {
    const formulaUsed = `${componentCode} = ${formulaType}(${JSON.stringify(formulaConfig)})`;
    this.log(stepNumber, stepName, componentCode, formulaUsed, inputs, result);
  }

  /**
   * Log an error
   */
  logError(stepNumber, stepName, componentCode, error) {
    this.log(stepNumber, stepName, componentCode, 'ERROR', {}, null, null, 'ERROR', error.message || String(error));
  }

  /**
   * Log a warning
   */
  logWarning(stepNumber, stepName, message, data = {}) {
    this.log(stepNumber, stepName, null, message, data, null, null, 'WARNING');
  }

  /**
   * Get all buffered logs (for in-memory inspection)
   */
  getLogs() {
    return [...this._buffer];
  }

  /**
   * Get logs summary for embedding in payslip/result
   */
  getSummary() {
    return {
      totalSteps: this._buffer.length,
      errors: this._buffer.filter(l => l.status === 'ERROR').length,
      warnings: this._buffer.filter(l => l.status === 'WARNING').length,
      totalExecutionMs: this._buffer.reduce((sum, l) => sum + l.executionTimeMs, 0),
      steps: this._buffer.map(l => ({
        step: l.stepNumber,
        name: l.stepName,
        component: l.componentCode,
        value: l.outputValue,
        status: l.status,
        ms: l.executionTimeMs,
      })),
    };
  }

  /**
   * Flush all buffered logs to database
   * Call this at the end of a full calculation cycle
   */
  async flush() {
    if (this._buffer.length === 0) return;

    try {
      await prisma.payrollCalculationLog.createMany({
        data: this._buffer,
        skipDuplicates: true,
      });
      const count = this._buffer.length;
      this._buffer = [];
      return count;
    } catch (error) {
      console.error('[CalculationLogger] Failed to flush logs:', error.message);
      // Don't throw — logging failure should not break payroll calculation
      return 0;
    }
  }

  /**
   * Clear buffer without flushing
   */
  clear() {
    this._buffer = [];
    this._stepTimers = {};
  }
}
