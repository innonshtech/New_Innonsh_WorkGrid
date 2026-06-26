/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PAYROLL CALCULATION ENGINE — MAIN 14-STEP ORCHESTRATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This is the MASTER engine that orchestrates the entire payroll calculation
 * for a single employee. It follows the exact 14-step execution flow:
 * 
 *   Step 1:  Load Employee
 *   Step 2:  Load Salary Structure
 *   Step 3:  Load Payroll Month
 *   Step 4:  Load Attendance
 *   Step 5:  Load Payroll Rules (Component Formulas)
 *   Step 6:  Load Statutory Rules (PF, ESI, PT, LWF)
 *   Step 7:  Load Tax Rules (Slabs, Sections)
 *   Step 8:  Calculate Earnings (Formula-Driven)
 *   Step 9:  Calculate Gross Salary
 *   Step 10: Calculate Statutory Deductions (PF, ESI, PT, LWF)
 *   Step 11: Calculate Tax (TDS)
 *   Step 12: Calculate Other Deductions (Loan, Advance, Arrear)
 *   Step 13: Calculate Net Salary
 *   Step 14: Generate Payslip Result
 * 
 * ARCHITECTURE:
 *   - Configuration-driven: ALL formulas loaded from database
 *   - Formula-driven: FormulaEngine evaluates each component
 *   - No hardcoded calculations
 *   - Every step is logged to PayrollCalculationLog
 *   - Supports: Multi Company, Multi Branch, Multi State
 * 
 * FUTURE READY:
 *   - Multi Country, Multi Currency
 *   - Contract, Hourly, Consultant, Freelancer employees
 *   - Custom salary components & custom formula builder
 *   - Government rule changes without code changes
 */

import prisma from '@/lib/db/prisma';
import { ConfigLoader } from './config-loader.js';
import { FormulaEngine } from './formula-engine.js';
import { RoundingEngine } from './rounding-engine.js';
import { CalculationLogger } from './calculation-logger.js';
import { AttendanceEngine } from './attendance-engine.js';
import { PFEngine } from './pf-engine.js';
import { ESIEngine } from './esi-engine.js';
import { PTEngine } from './pt-engine.js';
import { LWFEngine } from './lwf-engine.js';
import { BonusEngine } from './bonus-engine.js';
import { OvertimeEngine } from './overtime-engine.js';
import { LoanRecoveryEngine } from './loan-recovery-engine.js';
import { ArrearEngine } from './arrear-engine.js';
import { GratuityEngine } from './gratuity-engine.js';
import { LeaveEncashmentEngine } from './leave-encashment-engine.js';
import { TaxEngine } from './tax-engine.js';
import { YTDTracker } from './ytd-tracker.js';

export class PayrollCalculationEngine {
  constructor() {
    // Sub-engines initialized during calculation
    this.roundingEngine = null;
    this.formulaEngine = null;
    this.logger = null;
    this.configLoader = null;
    this.attendanceEngine = null;
    this.pfEngine = null;
    this.esiEngine = null;
    this.ptEngine = null;
    this.lwfEngine = null;
    this.bonusEngine = null;
    this.overtimeEngine = null;
    this.loanEngine = null;
    this.arrearEngine = null;
    this.gratuityEngine = null;
    this.leaveEncashmentEngine = null;
    this.taxEngine = null;
    this.ytdTracker = null;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * MAIN ENTRY POINT
   * ═══════════════════════════════════════════════════════════
   * 
   * Calculate payroll for a single employee for a given month/year.
   * 
   * @param {object} params
   * @param {string} params.employeeId - Employee ID
   * @param {number} params.month - Payroll month (1-12)
   * @param {number} params.year - Payroll year
   * @param {string} params.organizationId - Organization ID
   * @param {string|null} params.payrollRunId - Payroll Run ID (optional)
   * @param {string|null} params.calculatedById - User who triggered this
   * @param {object} params.overrides - Manual overrides { "BONUS": 5000, lopDays: 2, ... }
   * @returns {object} Complete payslip result with all breakdowns
   */
  async calculate({
    employeeId,
    month,
    year,
    organizationId,
    payrollRunId = null,
    calculatedById = null,
    overrides = {},
    configLoader = null,
  }) {
    const totalStartTime = performance.now();

    // ── Initialize Sub-Engines ──
    this.roundingEngine = new RoundingEngine();

    this.logger = new CalculationLogger({
      organizationId,
      employeeId,
      payrollMonth: month,
      payrollYear: year,
      payrollRunId,
      calculatedById,
    });

    this.configLoader = configLoader || new ConfigLoader(organizationId, new Date(year, month - 1, 15));
    this.formulaEngine = new FormulaEngine(this.roundingEngine);
    this.attendanceEngine = new AttendanceEngine(this.logger);
    this.pfEngine = new PFEngine(this.roundingEngine, this.logger);
    this.esiEngine = new ESIEngine(this.roundingEngine, this.logger);
    this.ptEngine = new PTEngine(this.roundingEngine, this.logger);
    this.lwfEngine = new LWFEngine(this.roundingEngine, this.logger);
    this.bonusEngine = new BonusEngine(this.roundingEngine, this.logger);
    this.overtimeEngine = new OvertimeEngine(this.roundingEngine, this.logger);
    this.loanEngine = new LoanRecoveryEngine(this.roundingEngine, this.logger);
    this.arrearEngine = new ArrearEngine(this.roundingEngine, this.logger);
    this.gratuityEngine = new GratuityEngine(this.roundingEngine, this.logger);
    this.leaveEncashmentEngine = new LeaveEncashmentEngine(this.roundingEngine, this.logger);
    this.taxEngine = new TaxEngine(this.roundingEngine, this.logger);
    this.ytdTracker = new YTDTracker();

    // Result object — built progressively through all 14 steps
    const result = {
      employeeId,
      organizationId,
      month,
      year,
      status: 'CALCULATED',
      errorMessage: null,

      // Employee Info (Step 1)
      employee: null,

      // Salary Structure (Step 2)
      salaryAssignment: null,
      salaryAssignmentId: null,
      templateName: null,
      ctc: 0,

      // Attendance (Step 4)
      attendance: null,

      // Earnings (Step 8-9)
      earningsBreakdown: {},       // { "BASIC": 25000, "HRA": 12500, ... }
      proratedEarnings: {},        // After LOP proration
      grossEarnings: 0,

      // Additional Earnings
      bonusAmount: 0,
      bonusBreakdown: null,
      overtimeAmount: 0,
      overtimeBreakdown: null,
      leaveEncashment: 0,
      leaveEncashmentBreakdown: null,
      arrearAmount: 0,
      arrearBreakdown: null,
      reimbursementAmount: 0,

      // Total Earnings
      totalEarnings: 0,

      // Statutory Deductions (Step 10)
      pfBreakdown: null,
      esiBreakdown: null,
      ptBreakdown: null,
      lwfBreakdown: null,
      totalStatutory: 0,

      // Tax (Step 11)
      taxBreakdown: null,
      monthlyTDS: 0,

      // Other Deductions (Step 12)
      loanBreakdown: null,
      loanRecovery: 0,
      advanceRecovery: 0,
      otherDeductions: 0,

      // Total Deductions
      totalDeductions: 0,

      // Net Pay (Step 13)
      netSalary: 0,

      // Calculation metadata
      calculatedAt: new Date(),
      calculationLogs: null,
    };

    try {
      const financialYear = this.configLoader.getFinancialYear(month, year);
      const timePromise = async (name, promise) => {
        const s = performance.now();
        const res = await promise;
        console.log(`[Prefetch Timer] ${name} took ${(performance.now() - s).toFixed(2)}ms`);
        return res;
      };

      const [
        rawEmployee,
        rawSalaryAssignment,
        fyRecord,
        componentMasters,
        pfConfig,
        esiConfig,
        otConfig,
        declarations,
        bonusConfigs,
        pendingBonuses,
        pendingArrears,
        activeLoans,
        attendanceRecords,
        leaveRecord,
        ytdData,
        _roundingLoaded
      ] = await Promise.all([
        timePromise('employee', prisma.employee.findUnique({ where: { id: employeeId } })),
        timePromise('salaryAssignment', this.configLoader.loadEmployeeSalary(employeeId)),
        timePromise('fyRecord', prisma.payrollFinancialYear.findFirst({
          where: {
            organizationId: organizationId,
            name: { in: [financialYear, `FY ${financialYear}`] }
          }
        })),
        timePromise('componentMasters', this.configLoader.loadComponentMasters()),
        timePromise('pfConfig', this.configLoader.loadPFConfig()),
        timePromise('esiConfig', this.configLoader.loadESIConfig()),
        timePromise('otConfig', this.configLoader.loadOTConfig()),
        timePromise('declarations', this.configLoader.loadInvestmentDeclarations(employeeId)),
        timePromise('bonusConfigs', this.configLoader.loadBonusConfigs()),
        timePromise('pendingBonuses', this.configLoader.loadPendingBonuses(employeeId, month, year)),
        timePromise('pendingArrears', this.configLoader.loadPendingArrears(employeeId)),
        timePromise('activeLoans', this.configLoader.loadActiveLoans(employeeId)),
        timePromise('attendanceRecords', this.configLoader.loadAttendance(employeeId, month, year)),
        timePromise('leaveRecord', this.configLoader.loadLeaveRecord(employeeId, month, year)),
        timePromise('ytdData', this.ytdTracker.getYTD(employeeId, month, year).catch(err => {
          console.error('[PayrollEngine] YTD lookup failed during prefetch:', err);
          return { ytdGross: 0, ytdTDS: 0, monthsProcessed: 0 };
        })),
        timePromise('roundingConfig', this.roundingEngine.loadConfig(organizationId))
      ]);

      if (!rawEmployee) {
        throw new Error(`Employee not found: ${employeeId}`);
      }

      const employee = rawEmployee;

      // ── PHASE 2: DEPENDENT PREFETCHING (Requires Employee record details) ──
      const workState = rawEmployee.workState || 'Maharashtra';
      const taxRegime = rawEmployee.taxRegime?.toUpperCase() === 'OLD' ? 'OLD' : 'NEW';

      const [
        ptSlabs,
        lwfConfig,
        holidays,
        workingDays,
        taxSlabs,
        taxSections
      ] = await Promise.all([
        this.configLoader.loadPTSlabs(workState),
        this.configLoader.loadLWFConfig(workState),
        this.configLoader.loadHolidays(employeeId, rawEmployee, month, year),
        this.configLoader.loadWorkingDays(rawEmployee),
        this.configLoader.loadTaxSlabs(taxRegime, financialYear),
        this.configLoader.loadTaxSections(taxRegime)
      ]);

      // ═══════════════════════════════════════════════════════
      // STEP 1: LOAD EMPLOYEE
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(1, 'LOAD_EMPLOYEE');

      result.employee = {
        id: rawEmployee.id,
        employeeId: rawEmployee.employeeId,
        name: `${rawEmployee.firstName} ${rawEmployee.lastName}`,
        department: rawEmployee.department,
        designation: rawEmployee.designation,
        dateOfJoining: rawEmployee.dateOfJoining,
        workState: rawEmployee.workState || 'Maharashtra',
        pfApplicable: rawEmployee.pfApplicable === 'yes',
        esicApplicable: rawEmployee.esicApplicable === 'yes',
        taxRegime: rawEmployee.taxRegime || 'new',
        organizationId: rawEmployee.organizationId,
        hraApplicable: rawEmployee.hraApplicable !== 'no',
      };

      this.logger.log(1, 'LOAD_EMPLOYEE', null,
        `Loaded: ${result.employee.name} (${rawEmployee.employeeId})`,
        { employeeId: rawEmployee.id },
        null, result.employee
      );

      // ═══════════════════════════════════════════════════════
      // STEP 2: LOAD SALARY STRUCTURE
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(2, 'LOAD_SALARY_STRUCTURE');

      if (!rawSalaryAssignment) {
        // Fallback to rawEmployee.payslipStructure if no V2 assignment
        const legacyStructure = rawEmployee.payslipStructure;
        if (legacyStructure) {
          result.salaryAssignment = {
            ctc: (legacyStructure.grossSalary || 0) * 12,
            basicSalary: legacyStructure.basicSalary || 0,
            grossSalary: legacyStructure.grossSalary || 0,
            componentValues: this._extractLegacyComponents(legacyStructure),
            isLegacy: true,
          };
        } else {
          throw new Error(`No salary structure found for employee: ${employeeId}`);
        }
      } else {
        result.salaryAssignment = {
          id: rawSalaryAssignment.id,
          ctc: rawSalaryAssignment.ctc,
          basicSalary: rawSalaryAssignment.basicSalary,
          grossSalary: rawSalaryAssignment.grossSalary,
          componentValues: rawSalaryAssignment.componentValues || {},
          templateName: rawSalaryAssignment.template?.name,
          isLegacy: false,
        };
      }

      result.ctc = result.salaryAssignment.ctc;
      result.templateName = result.salaryAssignment.templateName || 'Legacy Structure';

      this.logger.log(2, 'LOAD_SALARY_STRUCTURE', null,
        `CTC: ₹${result.ctc}, Basic: ₹${result.salaryAssignment.basicSalary}, Gross: ₹${result.salaryAssignment.grossSalary}`,
        { ctc: result.ctc },
        result.salaryAssignment.grossSalary,
        { templateName: result.templateName }
      );

      // ═══════════════════════════════════════════════════════
      // STEP 3: LOAD PAYROLL MONTH INFO
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(3, 'LOAD_PAYROLL_MONTH');
      const totalDaysInMonth = new Date(year, month, 0).getDate();
      const remainingMonths = this.configLoader.getRemainingMonths(month, year);

      // Check if financial year is locked using prefetched fyRecord
      if (fyRecord && fyRecord.isLocked) {
        throw new Error(`Cannot run calculation: Financial Year ${financialYear} is locked.`);
      }

      this.logger.log(3, 'LOAD_PAYROLL_MONTH', null,
        `Month: ${month}/${year}, FY: ${financialYear}, Days: ${totalDaysInMonth}, Remaining months: ${remainingMonths}`,
        { month, year, totalDaysInMonth, financialYear, remainingMonths },
        totalDaysInMonth
      );

      // ═══════════════════════════════════════════════════════
      // STEP 4: LOAD ATTENDANCE
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(4, 'LOAD_ATTENDANCE');

      result.attendance = this.attendanceEngine.processAttendance(
        attendanceRecords, leaveRecord, holidays, month, year, workingDays
      );

      // Apply LOP override if provided
      if (overrides.lopDays !== undefined) {
        result.attendance.lopDays = Number(overrides.lopDays);
        result.attendance.payableDays = result.attendance.payrollDays - result.attendance.lopDays;
        result.attendance.prorationFactor = result.attendance.payrollDays > 0
          ? result.attendance.payableDays / result.attendance.payrollDays : 1;
      }

      this.logger.log(4, 'LOAD_ATTENDANCE', null,
        `Days in Month: ${result.attendance.payrollDays}, Present: ${result.attendance.presentDays}, Paid Leaves: ${result.attendance.paidLeaveDays}, Holidays: ${result.attendance.holidayDays}, LOP: ${result.attendance.lopDays}, Payable: ${result.attendance.payableDays}`,
        { overrideLopDays: overrides.lopDays },
        result.attendance.payableDays,
        result.attendance
      );

      // ═══════════════════════════════════════════════════════
      // STEP 5: LOAD PAYROLL RULES (Component Formulas)
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(5, 'LOAD_PAYROLL_RULES');

      this.logger.log(5, 'LOAD_PAYROLL_RULES', null,
        `Loaded ${componentMasters.length} component formulas`,
        { componentCount: componentMasters.length },
        componentMasters.length
      );

      // ═══════════════════════════════════════════════════════
      // STEP 6: LOAD STATUTORY RULES
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(6, 'LOAD_STATUTORY_RULES');

      this.logger.log(6, 'LOAD_STATUTORY_RULES', null,
        `PF Ceiling: ₹${pfConfig.pfCeiling}, ESI Threshold: ₹${esiConfig.grossThreshold}, PT Slabs: ${ptSlabs.length}, LWF: ${lwfConfig ? 'Yes' : 'No'}`,
        { pfCeiling: pfConfig.pfCeiling, esiThreshold: esiConfig.grossThreshold },
        null
      );

      // ═══════════════════════════════════════════════════════
      // STEP 7: LOAD TAX RULES
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(7, 'LOAD_TAX_RULES');

      // Convert declarations to lookup map
      const declarationMap = {};
      for (const decl of declarations) {
        // Enforce HR Approval Sync
        const isApproved = ['Approved', 'Verified'].includes(decl.status) || decl.status === 'Active';
        if (!isApproved) continue;
        
        const data = decl.modelData || {};
        if (data.sectionCode && data.amount) {
          declarationMap[data.sectionCode] = (declarationMap[data.sectionCode] || 0) + Number(data.amount);
        } else if (data.sections) {
          // Parse legacy nested format from investments page
          const sec = data.sections;
          if (sec.section80C && sec.section80C.total !== undefined) {
            declarationMap['80C'] = Number(sec.section80C.total || 0);
          }
          if (sec.section80D && sec.section80D.total !== undefined) {
            declarationMap['80D'] = Number(sec.section80D.total || 0);
          }
          if (sec.hra && sec.hra.annualRent !== undefined) {
            declarationMap['HRA_RENT'] = Number(sec.hra.annualRent || 0);
            declarationMap['HRA_CITY'] = sec.hra.city || 'Non-Metro';
          }
          if (sec.section80CCD_1B !== undefined) {
            declarationMap['80CCD_1B'] = Number(sec.section80CCD_1B || 0);
          } else if (sec.section80CCD_1B?.total !== undefined) {
            declarationMap['80CCD_1B'] = Number(sec.section80CCD_1B.total || 0);
          } else if (sec.nps !== undefined) {
            declarationMap['80CCD_1B'] = Number(sec.nps || 0);
          }
          if (sec.section80G && sec.section80G.total !== undefined) {
            declarationMap['80G'] = Number(sec.section80G.total || 0);
          }
          if (sec.section80E && sec.section80E.total !== undefined) {
            declarationMap['80E'] = Number(sec.section80E.total || 0);
          }
          if (sec.section24b && sec.section24b.total !== undefined) {
            declarationMap['24B'] = Number(sec.section24b.total || 0);
          }
          if (sec.otherDeductions) {
            if (sec.otherDeductions.standardDeduction) {
              declarationMap['STANDARD_DEDUCTION'] = Number(sec.otherDeductions.standardDeduction || 0);
            }
            if (sec.otherDeductions.professionalTax) {
              declarationMap['PROFESSIONAL_TAX'] = Number(sec.otherDeductions.professionalTax || 0);
            }
          }
        }
      }

      this.logger.log(7, 'LOAD_TAX_RULES', null,
        `Regime: ${taxRegime}, Tax Slabs: ${taxSlabs.length}, Sections: ${taxSections.length}`,
        { regime: taxRegime, slabCount: taxSlabs.length },
        null
      );

      // ═══════════════════════════════════════════════════════
      // STEP 8: CALCULATE EARNINGS (Formula-Driven)
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(8, 'CALCULATE_EARNINGS');

      // Set initial context for formula engine
      const assignedValues = result.salaryAssignment.componentValues || {};
      this.formulaEngine.setContext({
        CTC: result.ctc,
        ANNUAL_CTC: result.ctc,
        MONTHLY_CTC: result.ctc / 12,
        GROSS: result.salaryAssignment.grossSalary,
        GROSS_SALARY: result.salaryAssignment.grossSalary,
        BASIC: result.salaryAssignment.basicSalary,
        PAYROLL_MONTH: month,
        PAYROLL_YEAR: year,
        PAYROLL_DAYS: totalDaysInMonth,
        PAYABLE_DAYS: result.attendance.payableDays,
        LOP_DAYS: result.attendance.lopDays,
        OT_HOURS: result.attendance.overtimeHours,
        ...assignedValues,
      });

      // Calculate each component using formulas (in dependency order)
      const earningsBreakdown = {};

      const customStructure = employee.payslipStructure || {};
      const customEarnings = Array.isArray(customStructure.earnings) ? customStructure.earnings : [];
      const customDeductions = Array.isArray(customStructure.deductions) ? customStructure.deductions : [];

      if (componentMasters.length > 0) {
        // V2 mode: Use formula engine with component masters
        for (const master of componentMasters) {
          if (master.category !== 'EARNING') continue;

          try {
            let value = 0;
            let formulaDescription = '';

            // Check if there is an employee-specific custom configuration in payslipStructure
            const customConfig = customEarnings.find(e => e.code === master.code);

            if (master.code === 'BASIC') {
              value = result.salaryAssignment.basicSalary;
              formulaDescription = `Basic Salary = ${value}`;
            } else if (customConfig) {
              if (customConfig.enabled === false) {
                value = 0;
                formulaDescription = `Disabled by admin`;
              } else if (customConfig.calculationType === 'percentage') {
                const percentage = Number(customConfig.percentage || 0);
                const basicVal = earningsBreakdown['BASIC'] || result.salaryAssignment.basicSalary || 0;
                value = (basicVal * percentage) / 100;
                formulaDescription = `Admin Custom: Basic(${basicVal}) × ${percentage}% = ${value}`;
              } else if (customConfig.calculationType === 'metro') {
                const metroRate = taxSections?.find(s => s.sectionCode === 'HRA_METRO_RATE')?.maxLimit || 50;
                const basicVal = earningsBreakdown['BASIC'] || result.salaryAssignment.basicSalary || 0;
                value = (basicVal * metroRate) / 100;
                formulaDescription = `Admin Custom (Metro): Basic(${basicVal}) × ${metroRate}% = ${value}`;
              } else if (customConfig.calculationType === 'non_metro') {
                const nonMetroRate = taxSections?.find(s => s.sectionCode === 'HRA_NON_METRO_RATE')?.maxLimit || 40;
                const basicVal = earningsBreakdown['BASIC'] || result.salaryAssignment.basicSalary || 0;
                value = (basicVal * nonMetroRate) / 100;
                formulaDescription = `Admin Custom (Non-Metro): Basic(${basicVal}) × ${nonMetroRate}% = ${value}`;
              } else {
                value = Number(customConfig.fixedAmount || 0);
                formulaDescription = `Admin Custom: Fixed = ${value}`;
              }
            } else if (assignedValues[master.code] !== undefined) {
              value = Number(assignedValues[master.code]);
              formulaDescription = `Assigned Override = ${value}`;
            } else {
              // Use override formula from template if available, else master formula
              const formulaConfig = master.formulaConfig;
              const formulaType = master.formulaType;

              const { value: val, formulaDescription: desc } = this.formulaEngine.evaluate(
                formulaType, formulaConfig, 'SALARY'
              );
              value = val;
              formulaDescription = desc;
            }

            earningsBreakdown[master.code] = value;

            // Update context so dependent components can use this value
            this.formulaEngine.setContext({ [master.code]: value });

            this.logger.logComponent(8, 'CALCULATE_EARNINGS', master.code,
              customConfig ? 'CUSTOM' : (assignedValues[master.code] !== undefined ? 'OVERRIDE' : master.formulaType),
              customConfig ? {} : (assignedValues[master.code] !== undefined ? {} : master.formulaConfig),
              { formula: formulaDescription },
              value
            );
          } catch (error) {
            this.logger.logError(8, 'CALCULATE_EARNINGS', master.code, error);
            earningsBreakdown[master.code] = Number(assignedValues[master.code] || 0);
          }
        }
      } else {
        // Legacy mode: Use assigned component values directly
        for (const [code, value] of Object.entries(assignedValues)) {
          earningsBreakdown[code] = Number(value);
        }
        // Ensure BASIC is set
        if (!earningsBreakdown['BASIC']) {
          earningsBreakdown['BASIC'] = result.salaryAssignment.basicSalary;
        }
      }

      result.earningsBreakdown = earningsBreakdown;

      // Apply attendance proration on all earnings
      const { payrollDays, payableDays } = result.attendance;
      result.proratedEarnings = this.attendanceEngine.prorateAll(earningsBreakdown, payrollDays, payableDays);

      // Round prorated values
      for (const [code, val] of Object.entries(result.proratedEarnings)) {
        result.proratedEarnings[code] = this.roundingEngine.salary(val);
      }

      // Update context with prorated values
      this.formulaEngine.setContext(result.proratedEarnings);

      // ── Bonus (prefetched in Phase 1) ──
      const configBonus = this.bonusEngine.calculateFromConfig(bonusConfigs, result.proratedEarnings, result.salaryAssignment.grossSalary);
      const pendingBonus = this.bonusEngine.calculateFromPending(pendingBonuses);
      result.bonusAmount = this.roundingEngine.salary(
        (overrides.BONUS !== undefined ? overrides.BONUS : configBonus.totalBonus) + pendingBonus.totalBonus
      );
      result.bonusBreakdown = { config: configBonus, pending: pendingBonus };

      // ── Overtime (prefetched in Phase 1/2) ──
      const otResult = this.overtimeEngine.calculate(otConfig, result.proratedEarnings, result.attendance.overtimeHours);
      result.overtimeAmount = otResult.otAmount;
      result.overtimeBreakdown = otResult;

      // ── Leave Encashment ──
      const unusedLeaves = Number(overrides.unusedLeaves || 0);
      const leResult = this.leaveEncashmentEngine.calculate(
        result.proratedEarnings['BASIC'] || result.salaryAssignment.basicSalary,
        otConfig.workingDaysPerMonth || 26,
        unusedLeaves
      );
      result.leaveEncashment = leResult.encashmentAmount;
      result.leaveEncashmentBreakdown = leResult;

      // ── Arrears (prefetched in Phase 1) ──
      const arrearResult = this.arrearEngine.calculate(pendingArrears);
      result.arrearAmount = arrearResult.totalArrear;
      result.arrearBreakdown = arrearResult;

      // ── Reimbursements (from overrides) ──
      result.reimbursementAmount = this.roundingEngine.salary(Number(overrides.reimbursements || 0));

      // ═══════════════════════════════════════════════════════
      // STEP 9: CALCULATE GROSS SALARY
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(9, 'CALCULATE_GROSS');

      // Gross = Sum of all prorated earnings
      const grossFromComponents = Object.values(result.proratedEarnings).reduce((sum, val) => sum + val, 0);

      // Total Earnings = Gross + Bonus + OT + Leave Encashment + Arrear + Reimbursements
      result.grossEarnings = this.roundingEngine.salary(grossFromComponents);
      result.totalEarnings = this.roundingEngine.salary(
        grossFromComponents +
        result.bonusAmount +
        result.overtimeAmount +
        result.leaveEncashment +
        result.arrearAmount +
        result.reimbursementAmount
      );

      this.logger.log(9, 'CALCULATE_GROSS', 'GROSS',
        `Gross Earnings = ₹${result.grossEarnings}, Total Earnings = ₹${result.totalEarnings}`,
        { grossFromComponents, bonus: result.bonusAmount, ot: result.overtimeAmount, arrear: result.arrearAmount },
        result.totalEarnings,
        {
          earningsBreakdown: result.earningsBreakdown,
          proratedEarnings: result.proratedEarnings,
          bonus: { amount: result.bonusAmount, breakdown: result.bonusBreakdown },
          overtime: { amount: result.overtimeAmount, breakdown: result.overtimeBreakdown },
          leaveEncashment: { amount: result.leaveEncashment, breakdown: result.leaveEncashmentBreakdown },
          arrear: { amount: result.arrearAmount, breakdown: result.arrearBreakdown },
          reimbursements: result.reimbursementAmount
        }
      );

      // Update context with gross for statutory calculations
      this.formulaEngine.setContext({
        GROSS: result.grossEarnings,
        GROSS_EARNED: result.grossEarnings,
        TOTAL_EARNINGS: result.totalEarnings,
      });

      // ═══════════════════════════════════════════════════════
      // STEP 10: CALCULATE STATUTORY DEDUCTIONS
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(10, 'CALCULATE_STATUTORY');

      // PF
      result.pfBreakdown = this.pfEngine.calculate(pfConfig, result.proratedEarnings, result.employee.pfApplicable);

      // ESI
      result.esiBreakdown = this.esiEngine.calculate(esiConfig, result.grossEarnings, result.employee.esicApplicable);

      // PT
      result.ptBreakdown = this.ptEngine.calculate(ptSlabs, result.grossEarnings, month, result.employee.workState);

      // LWF
      result.lwfBreakdown = this.lwfEngine.calculate(lwfConfig, month, result.employee.workState);

      // Total Statutory
      result.totalStatutory = this.roundingEngine.salary(
        result.pfBreakdown.totalEmployeeDeduction +
        result.esiBreakdown.totalEmployeeDeduction +
        result.ptBreakdown.ptAmount +
        result.lwfBreakdown.employeeAmount
      );

      const statutoryData = {
        pf: result.pfBreakdown,
        esi: result.esiBreakdown,
        pt: result.ptBreakdown,
        lwf: result.lwfBreakdown
      };
      this.logger.log(10, 'CALCULATE_STATUTORY', null,
        `PF: ₹${result.pfBreakdown.employeePF}, ESI: ₹${result.esiBreakdown.employeeESI}, PT: ₹${result.ptBreakdown.ptAmount}, LWF: ₹${result.lwfBreakdown.employeeAmount}, Total: ₹${result.totalStatutory}`,
        {},
        result.totalStatutory,
        statutoryData
      );

      // ═══════════════════════════════════════════════════════
      // STEP 11: CALCULATE TAX (TDS)
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(11, 'CALCULATE_TAX');
      declarationMap['BASIC_ANNUAL'] = (result.proratedEarnings?.BASIC || result.salaryAssignment?.basicSalary || 0) * 12;
      declarationMap['HRA_ANNUAL'] = (result.proratedEarnings?.HRA || result.salaryAssignment?.componentValues?.HRA || 0) * 12;

      // Fix #9: Auto-calculate YTD from previous payslips (prefetched in Phase 1)
      this.logger.log(11, 'CALCULATE_TAX', 'YTD_LOOKUP',
        `YTD from ${ytdData.monthsProcessed} previous months: Gross=₹${ytdData.ytdGross}, TDS=₹${ytdData.ytdTDS}`,
        { monthsProcessed: ytdData.monthsProcessed },
        ytdData.ytdTDS
      );

      // Use manual overrides if provided, otherwise use auto-calculated YTD
      const effectiveYtdTDS = overrides.ytdTDS !== undefined ? Number(overrides.ytdTDS) : ytdData.ytdTDS;
      const effectiveYtdGross = overrides.ytdGross !== undefined ? Number(overrides.ytdGross) : ytdData.ytdGross;

      result.taxBreakdown = this.taxEngine.calculateMonthlyTDS({
        taxSlabs,
        taxSections,
        regime: taxRegime,
        monthlyGross: result.grossEarnings,
        month,
        year,
        remainingMonths,
        declarations: declarationMap,
        previousEmployerTDS: Number(overrides.previousEmployerTDS || 0),
        ytdTDS: effectiveYtdTDS,
        ytdGross: effectiveYtdGross,
        hraApplicable: result.employee.hraApplicable,
      });
      result.monthlyTDS = result.taxBreakdown.monthlyTDS;
      result.ytdData = ytdData; // Attach for inspection

      // ═══════════════════════════════════════════════════════
      // STEP 12: CALCULATE OTHER DEDUCTIONS
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(12, 'CALCULATE_OTHER_DEDUCTIONS');

      // Loan Recovery (prefetched in Phase 1)
      result.loanBreakdown = this.loanEngine.calculate(activeLoans, month, year);
      result.loanRecovery = result.loanBreakdown.totalLoanRecovery;
      result.advanceRecovery = result.loanBreakdown.totalAdvanceRecovery;

      // Other deductions from overrides
      result.otherDeductions = this.roundingEngine.salary(Number(overrides.otherDeductions || 0));

      // Calculate custom deductions
      const customDeductionsBreakdown = {};
      if (componentMasters.length > 0) {
        for (const master of componentMasters) {
          if (master.category !== 'DEDUCTION') continue;

          try {
            let value = 0;
            let formulaDescription = '';

            const customConfig = customDeductions.find(d => d.code === master.code);

            if (customConfig) {
              if (customConfig.enabled === false) {
                value = 0;
                formulaDescription = `Disabled by admin`;
              } else if (customConfig.calculationType === 'percentage') {
                const percentage = Number(customConfig.percentage || 0);
                const basicVal = earningsBreakdown['BASIC'] || result.salaryAssignment.basicSalary || 0;
                value = (basicVal * percentage) / 100;
                formulaDescription = `Admin Custom: Basic(${basicVal}) × ${percentage}% = ${value}`;
              } else {
                value = Number(customConfig.fixedAmount || 0);
                formulaDescription = `Admin Custom: Fixed = ${value}`;
              }
            } else if (assignedValues[master.code] !== undefined) {
              value = Number(assignedValues[master.code]);
              formulaDescription = `Assigned Override = ${value}`;
            } else {
              const formulaConfig = master.formulaConfig;
              const formulaType = master.formulaType;

              const { value: val, formulaDescription: desc } = this.formulaEngine.evaluate(
                formulaType, formulaConfig, 'SALARY'
              );
              value = val;
              formulaDescription = desc;
            }

            customDeductionsBreakdown[master.code] = value;
            this.formulaEngine.setContext({ [master.code]: value });

            this.logger.logComponent(12, 'CALCULATE_OTHER_DEDUCTIONS', master.code,
              customConfig ? 'CUSTOM' : (assignedValues[master.code] !== undefined ? 'OVERRIDE' : master.formulaType),
              customConfig ? {} : (assignedValues[master.code] !== undefined ? {} : master.formulaConfig),
              { formula: formulaDescription },
              value
            );
          } catch (error) {
            this.logger.logError(12, 'CALCULATE_OTHER_DEDUCTIONS', master.code, error);
            customDeductionsBreakdown[master.code] = Number(assignedValues[master.code] || 0);
          }
        }
      }

      const totalCustomDeductions = Object.values(customDeductionsBreakdown).reduce((sum, val) => sum + val, 0);

      this.logger.log(12, 'CALCULATE_OTHER_DEDUCTIONS', null,
        `Loan: ₹${result.loanRecovery}, Advance: ₹${result.advanceRecovery}, Other: ₹${result.otherDeductions}, Custom: ₹${totalCustomDeductions}`,
        {},
        result.loanRecovery + result.advanceRecovery + result.otherDeductions + totalCustomDeductions,
        {
          loans: result.loanBreakdown,
          loanRecovery: result.loanRecovery,
          advanceRecovery: result.advanceRecovery,
          otherDeductions: result.otherDeductions,
          customDeductions: customDeductionsBreakdown
        }
      );

      // ═══════════════════════════════════════════════════════
      // STEP 13: CALCULATE NET SALARY
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(13, 'CALCULATE_NET_SALARY');

      // Total Deductions = Statutory + Tax + Loan + Advance + Other + Custom
      result.totalDeductions = this.roundingEngine.salary(
        result.totalStatutory +
        result.monthlyTDS +
        result.loanRecovery +
        result.advanceRecovery +
        result.otherDeductions +
        totalCustomDeductions
      );

      // Net Salary = Total Earnings - Total Deductions
      result.netSalary = this.roundingEngine.netPay(result.totalEarnings - result.totalDeductions);

      this.logger.log(13, 'CALCULATE_NET_SALARY', 'NET_PAY',
        `Net = ₹${result.totalEarnings} - ₹${result.totalDeductions} = ₹${result.netSalary}`,
        { totalEarnings: result.totalEarnings, totalDeductions: result.totalDeductions },
        result.netSalary,
        {
          totalEarnings: result.totalEarnings,
          totalDeductions: result.totalDeductions,
          netSalary: result.netSalary,
          statutoryDeductions: result.totalStatutory,
          taxTDS: result.monthlyTDS,
          otherDeductions: result.loanRecovery + result.advanceRecovery + result.otherDeductions + totalCustomDeductions
        }
      );

      // ═══════════════════════════════════════════════════════
      // STEP 14: GENERATE PAYSLIP RESULT
      // ═══════════════════════════════════════════════════════
      this.logger.startStep(14, 'GENERATE_PAYSLIP');

      result.status = 'CALCULATED';
      result.calculatedAt = new Date();
      result.salaryAssignmentId = result.salaryAssignment?.id || null;

      // Build structured deductions breakdown for payslip
      result.deductionsBreakdown = {};
      if (result.pfBreakdown.employeePF > 0) result.deductionsBreakdown['PF_EMPLOYEE'] = result.pfBreakdown.employeePF;
      if (result.esiBreakdown.employeeESI > 0) result.deductionsBreakdown['ESI_EMPLOYEE'] = result.esiBreakdown.employeeESI;
      if (result.ptBreakdown.ptAmount > 0) result.deductionsBreakdown['PT'] = result.ptBreakdown.ptAmount;
      if (result.lwfBreakdown.employeeAmount > 0) result.deductionsBreakdown['LWF'] = result.lwfBreakdown.employeeAmount;
      if (result.monthlyTDS > 0) result.deductionsBreakdown['TDS'] = result.monthlyTDS;
      if (result.loanRecovery > 0) result.deductionsBreakdown['LOAN_RECOVERY'] = result.loanRecovery;
      if (result.advanceRecovery > 0) result.deductionsBreakdown['ADVANCE_RECOVERY'] = result.advanceRecovery;
      if (result.otherDeductions > 0) result.deductionsBreakdown['OTHER'] = result.otherDeductions;
      
      // Inject custom deductions
      for (const [code, val] of Object.entries(customDeductionsBreakdown)) {
        if (val > 0) {
          result.deductionsBreakdown[code] = val;
        }
      }

      // Build statutory breakdown (employer cost)
      result.statutoryBreakdown = {
        PF_EMPLOYEE: result.pfBreakdown.employeePF,
        PF_EMPLOYER: result.pfBreakdown.employerPF,
        EPS: result.pfBreakdown.eps,
        PF_ADMIN: result.pfBreakdown.adminCharge,
        PF_EDLI: result.pfBreakdown.edli,
        ESI_EMPLOYEE: result.esiBreakdown.employeeESI,
        ESI_EMPLOYER: result.esiBreakdown.employerESI,
        PT: result.ptBreakdown.ptAmount,
        LWF_EMPLOYEE: result.lwfBreakdown.employeeAmount,
        LWF_EMPLOYER: result.lwfBreakdown.employerAmount,
      };

      // Attach calculation metadata
      const totalExecutionMs = Math.round(performance.now() - totalStartTime);
      result.calculationLogs = this.logger.getSummary();
      result.calculationLogs.totalExecutionMs = totalExecutionMs;

      this.logger.log(14, 'GENERATE_PAYSLIP', null,
        `Payslip generated successfully in ${totalExecutionMs}ms. Net Pay: ₹${result.netSalary}`,
        { executionMs: totalExecutionMs },
        result.netSalary
      );

      // Flush all logs to database if not a preview
      if (!overrides.isPreview) {
        await this.logger.flush();
      }

    } catch (error) {
      result.status = 'ERROR';
      result.errorMessage = error.message;

      this.logger.logError(0, 'CALCULATION_FAILED', null, error);

      if (!overrides.isPreview) {
        try {
          await this.logger.flush();
        } catch (flushError) {
          console.error('[PayrollEngine] Failed to flush error logs:', flushError.message);
        }
      }
    }

    return result;
  }

  /**
   * Extract component values from legacy payslipStructure JSON
   */
  _extractLegacyComponents(structure) {
    const components = {};
    components['BASIC'] = Number(structure.basicSalary || 0);

    if (Array.isArray(structure.earnings)) {
      for (const e of structure.earnings) {
        if (e.name && e.enabled !== false) {
          const code = this._nameToCode(e.name);
          components[code] = e.calculationType === 'percentage'
            ? (components['BASIC'] * (e.percentage || 0)) / 100
            : Number(e.fixedAmount || 0);
        }
      }
    }

    return components;
  }

  /**
   * Convert display name to code (e.g., "House Rent Allowance" → "HRA")
   */
  _nameToCode(name) {
    const map = {
      'House Rent Allowance': 'HRA',
      'HRA': 'HRA',
      'Dearness Allowance': 'DA',
      'DA': 'DA',
      'Conveyance Allowance': 'CONVEYANCE',
      'Medical Allowance': 'MEDICAL',
      'Special Allowance': 'SPECIAL_ALLOWANCE',
      'Travel Allowance': 'TRAVEL',
      'Telephone Allowance': 'TELEPHONE',
      'Food Allowance': 'FOOD',
    };
    return map[name] || name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  // ═══════════════════════════════════════════════════════════
  // BATCH CALCULATION (for entire payroll run)
  // ═══════════════════════════════════════════════════════════

  /**
   * Calculate payroll for multiple employees (batch)
   * 
   * @param {Array<string>} employeeIds - List of employee IDs
   * @param {number} month
   * @param {number} year
   * @param {string} organizationId
   * @param {string} payrollRunId
   * @param {string} calculatedById
   * @returns {object} Batch results
   */
  async calculateBatch({
    employeeIds,
    month,
    year,
    organizationId,
    payrollRunId,
    calculatedById,
  }) {
    const results = {
      total: employeeIds.length,
      success: 0,
      errors: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      employees: [],
    };

    const BATCH_SIZE = 5;
    for (let i = 0; i < employeeIds.length; i += BATCH_SIZE) {
      const batch = employeeIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (empId) => {
          const empResult = await this.calculate({
            employeeId: empId,
            month,
            year,
            organizationId,
            payrollRunId,
            calculatedById,
          });
          return { empResult };
        })
      );

      for (let j = 0; j < batchResults.length; j++) {
        const settled = batchResults[j];
        const empId = batch[j];
        if (settled.status === 'fulfilled') {
          const { empResult } = settled.value;
          if (empResult.status === 'CALCULATED') {
            results.success++;
            results.totalGross += empResult.totalEarnings;
            results.totalDeductions += empResult.totalDeductions;
            results.totalNet += empResult.netSalary;
          } else {
            results.errors++;
          }

          results.employees.push({
            employeeId: empId,
            name: empResult.employee?.name,
            status: empResult.status,
            netSalary: empResult.netSalary,
            errorMessage: empResult.errorMessage,
          });
        } else {
          results.errors++;
          results.employees.push({
            employeeId: empId,
            status: 'ERROR',
            errorMessage: settled.reason?.message || 'Parallel calculation rejected',
          });
        }
      }
    }

    return results;
  }
}
