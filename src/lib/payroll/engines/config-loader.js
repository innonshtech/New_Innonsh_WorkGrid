/**
 * ═══════════════════════════════════════════════════════════
 * CONFIGURATION LOADER
 * ═══════════════════════════════════════════════════════════
 * 
 * Loads ALL payroll configuration from database:
 *   - Salary components & formulas
 *   - PF / ESI / PT / LWF rules
 *   - Tax slabs & sections
 *   - Bonus / OT / Gratuity configs
 *   - Rounding rules
 *   - Employee salary assignments
 * 
 * All configs are effective-date based.
 * Supports Multi Company, Multi Branch, Multi State.
 */

import prisma from '@/lib/db/prisma';

export class ConfigLoader {
  constructor(organizationId, effectiveDate = new Date()) {
    this.organizationId = organizationId;
    this.effectiveDate = effectiveDate;
  }

  /**
   * Build the base where clause for org-scoped, active, effective-date filtered queries
   */
  _baseWhere(extraFilters = {}) {
    return {
      isActive: true,
      OR: [
        { organizationId: this.organizationId },
        { organizationId: null }, // Global/default configs
      ],
      effectiveFrom: { lte: this.effectiveDate },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: this.effectiveDate } },
      ],
      ...extraFilters,
    };
  }

  /**
   * Simpler where for configs that might not have effectiveTo
   */
  _activeWhere(extraFilters = {}) {
    return {
      isActive: true,
      effectiveFrom: { lte: this.effectiveDate },
      ...extraFilters,
    };
  }

  // ─────────────────────────────────────────────────────────
  // SALARY COMPONENTS & FORMULAS
  // ─────────────────────────────────────────────────────────

  /**
   * Load all active salary component masters for this org
   * Returns components sorted by dependency order (dependsOn resolved)
   */
  async loadComponentMasters() {
    const components = await prisma.payrollComponentMaster.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Prefer org-specific over global (deduplicate by code)
    const byCode = new Map();
    for (const comp of components) {
      const existing = byCode.get(comp.code);
      if (!existing || (comp.organizationId === this.organizationId)) {
        byCode.set(comp.code, comp);
      }
    }

    // Topological sort by dependencies
    return this._topologicalSort(Array.from(byCode.values()));
  }

  /**
   * Sort components by dependency order
   */
  _topologicalSort(components) {
    const byCode = new Map(components.map(c => [c.code, c]));
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (code) => {
      if (visited.has(code)) return;
      if (visiting.has(code)) {
        // Circular dependency — add anyway and warn
        console.warn(`[ConfigLoader] Circular dependency detected for component: ${code}`);
        return;
      }
      visiting.add(code);

      const comp = byCode.get(code);
      if (comp && comp.dependsOn) {
        for (const dep of comp.dependsOn) {
          visit(dep);
        }
      }

      visiting.delete(code);
      visited.add(code);
      if (comp) sorted.push(comp);
    };

    for (const comp of components) {
      visit(comp.code);
    }

    return sorted;
  }

  // ─────────────────────────────────────────────────────────
  // SALARY TEMPLATE & EMPLOYEE ASSIGNMENT
  // ─────────────────────────────────────────────────────────

  /**
   * Load the active salary assignment for an employee
   */
  async loadEmployeeSalary(employeeId) {
    const assignment = await prisma.payrollEmployeeSalary.findFirst({
      where: {
        employeeId,
        status: 'Active',
        effectiveFrom: { lte: this.effectiveDate },
      },
      include: {
        template: {
          include: {
            components: {
              where: { isActive: true },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return assignment;
  }

  // ─────────────────────────────────────────────────────────
  // PF CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadPFConfig() {
    const config = await prisma.payrollPFConfig.findFirst({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    // Return config or sensible defaults
    return config || {
      pfWageComponents: ['BASIC', 'DA'],
      pfCeiling: 15000,
      employeePFRate: 12,
      employerPFRate: 12,
      epsRate: 8.33,
      adminChargeRate: 0.5,
      edliRate: 0.5,
      restrictToCeiling: true,
    };
  }

  // ─────────────────────────────────────────────────────────
  // ESI CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadESIConfig() {
    const config = await prisma.payrollESIConfig.findFirst({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return config || {
      grossThreshold: 21000,
      employeeRate: 0.75,
      employerRate: 3.25,
    };
  }

  // ─────────────────────────────────────────────────────────
  // PT SLAB CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadPTSlabs(state) {
    const slabs = await prisma.payrollPTSlabConfig.findMany({
      where: {
        isActive: true,
        state: state,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { slabFrom: 'asc' },
    });

    return slabs;
  }

  // ─────────────────────────────────────────────────────────
  // LWF CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadLWFConfig(state) {
    const config = await prisma.payrollLWFConfig.findFirst({
      where: {
        isActive: true,
        state: state,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return config;
  }

  // ─────────────────────────────────────────────────────────
  // TAX SLAB CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadTaxSlabs(regime, financialYear) {
    console.log(`loadTaxSlabs called with: regime=${regime}, financialYear=${financialYear}`);
    const slabs = await prisma.payrollTaxSlabConfig.findMany({
      where: {
        isActive: true,
        regime: regime.toLowerCase(),
        financialYear: financialYear,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { slabFrom: 'asc' },
    });
    console.log(`loadTaxSlabs returned ${slabs.length} slabs`);
    return slabs;
  }

  // ─────────────────────────────────────────────────────────
  // TAX SECTION CONFIGURATION (80C, 80D, etc.)
  // ─────────────────────────────────────────────────────────

  async loadTaxSections(regime) {
    const sections = await prisma.payrollTaxSectionConfig.findMany({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        applicableRegime: { in: [regime, regime.toLowerCase(), 'BOTH'] },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
    });

    return sections;
  }

  // ─────────────────────────────────────────────────────────
  // BONUS CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadBonusConfigs(bonusType = null) {
    const where = {
      isActive: true,
      effectiveFrom: { lte: this.effectiveDate },
      OR: [
        { organizationId: this.organizationId },
        { organizationId: null },
      ],
    };

    if (bonusType) where.bonusType = bonusType;

    return prisma.payrollBonusConfig.findMany({ where });
  }

  // ─────────────────────────────────────────────────────────
  // OVERTIME CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadOTConfig() {
    const config = await prisma.payrollOTConfig.findFirst({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return config || {
      baseSalaryComponents: ['BASIC'],
      workingDaysPerMonth: 26,
      workingHoursPerDay: 8,
      otMultiplier: 2,
      maxOTHoursPerMonth: null,
    };
  }

  // ─────────────────────────────────────────────────────────
  // GRATUITY CONFIGURATION
  // ─────────────────────────────────────────────────────────

  async loadGratuityConfig() {
    const config = await prisma.payrollGratuityConfig.findFirst({
      where: {
        isActive: true,
        effectiveFrom: { lte: this.effectiveDate },
        OR: [
          { organizationId: this.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    return config || {
      minServiceYears: 5,
      daysPerYear: 15,
      divisor: 26,
      maxAmount: null,
      eligibleComponents: ['BASIC', 'DA'],
    };
  }

  // ─────────────────────────────────────────────────────────
  // ATTENDANCE DATA
  // ─────────────────────────────────────────────────────────

  async loadAttendance(employeeId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    return records;
  }

  // ─────────────────────────────────────────────────────────
  // LEAVE DATA
  // ─────────────────────────────────────────────────────────

  async loadLeaveRecord(employeeId, month, year) {
    return prisma.leave.findFirst({
      where: {
        employeeId,
        month,
        year,
        status: { in: ['Approved', 'Draft'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────
  // ACTIVE LOANS
  // ─────────────────────────────────────────────────────────

  async loadActiveLoans(employeeId) {
    return prisma.loan.findMany({
      where: {
        employeeId,
        status: 'Active',
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // PENDING BONUSES
  // ─────────────────────────────────────────────────────────

  async loadPendingBonuses(employeeId, month, year) {
    return prisma.bonus.findMany({
      where: {
        employeeId,
        status: 'Pending',
        organizationId: this.organizationId,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // PENDING ARREARS / RETRO ADJUSTMENTS
  // ─────────────────────────────────────────────────────────

  async loadPendingArrears(employeeId) {
    return prisma.retroAdjustment.findMany({
      where: {
        employeeId,
        status: 'Pending',
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // SHIFTS AND WORKING DAYS
  // ─────────────────────────────────────────────────────────

  async loadWorkingDays(employee) {
    if (!employee || !employee.defaultShift) {
      return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    }

    try {
      const shift = await prisma.workingShift.findFirst({
        where: {
          OR: [
            { id: employee.defaultShift },
            { mongoId: employee.defaultShift }
          ]
        }
      });

      if (shift && shift.modelData) {
        const data = typeof shift.modelData === 'string' ? JSON.parse(shift.modelData) : shift.modelData;
        if (Array.isArray(data.workingDays) && data.workingDays.length > 0) {
          return data.workingDays;
        }
      }
    } catch (err) {
      console.error(`Failed to load working days for employee shift ${employee.defaultShift}:`, err);
    }

    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  }

  // ─────────────────────────────────────────────────────────
  // HOLIDAYS
  // ─────────────────────────────────────────────────────────

  async loadHolidays(employeeId, employee, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const holidayListId = employee.holidayListId;
    const orgId = employee.organizationId;

    // Fetch regular holidays
    const regularHolidays = await prisma.holiday.findMany({
      where: {
        status: 'Active',
        date: { gte: startDate, lte: endDate },
        isRestricted: false,
        OR: holidayListId
          ? [{ holidayListId }]
          : [{ organizationId: orgId }],
      },
    });

    // Fetch approved restricted holiday claims for this employee in this month
    try {
      const claims = await prisma.restrictedHolidayClaim.findMany({
        where: {
          employeeId: employeeId,
          status: 'Approved',
          year: year
        }
      });

      if (claims.length > 0) {
        const claimHolidayIds = claims.map(c => c.holidayId).filter(Boolean);
        const claimedHolidays = await prisma.holiday.findMany({
          where: {
            id: { in: claimHolidayIds },
            status: 'Active',
            date: { gte: startDate, lte: endDate },
            isRestricted: true
          }
        });

        return [...regularHolidays, ...claimedHolidays];
      }
    } catch (err) {
      console.error("Failed to load claimed restricted holidays:", err);
    }

    return regularHolidays;
  }

  // ─────────────────────────────────────────────────────────
  // EMPLOYEE INVESTMENT DECLARATIONS (for tax)
  // ─────────────────────────────────────────────────────────

  async loadInvestmentDeclarations(employeeId) {
    return prisma.investmentDeclaration.findMany({
      where: {
        employeeId,
        status: { in: ['Active', 'Pending', 'Approved', 'Verified'] },
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // UTILITY: Determine Financial Year
  // ─────────────────────────────────────────────────────────

  getFinancialYear(month, year) {
    if (month >= 4) {
      return `${year}-${String(year + 1).slice(-2)}`;
    }
    return `${year - 1}-${String(year).slice(-2)}`;
  }

  /**
   * Get remaining payroll months in financial year (for TDS projection)
   */
  getRemainingMonths(month, year) {
    // FY is April to March
    if (month >= 4) {
      return 12 - (month - 4); // April=12, May=11, ..., March=1
    }
    return 3 - (month - 1); // Jan=3, Feb=2, March=1
  }
}
