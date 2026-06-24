/**
 * ═══════════════════════════════════════════════════════════
 * YTD (Year-To-Date) TRACKER ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Aggregates gross, TDS, PF, ESI from previous Payslip records
 * for the current financial year. This ensures accurate progressive
 * TDS calculation without requiring manual overrides.
 * 
 * Usage:
 *   const tracker = new YTDTracker();
 *   const ytd = await tracker.getYTD(employeeId, month, year);
 */

import prisma from '@/lib/db/prisma';

export class YTDTracker {
  /**
   * Get YTD figures for an employee up to (but not including) the given month.
   * 
   * @param {string} employeeId 
   * @param {number} month - Current payroll month (1-12)
   * @param {number} year - Current payroll year
   * @returns {object} { ytdGross, ytdTDS, ytdPF, ytdESI, ytdPT, ytdNet, monthsProcessed }
   */
  async getYTD(employeeId, month, year) {
    // Determine financial year boundaries
    // Indian FY: April (month 4) to March (month 3)
    let fyStartMonth, fyStartYear, fyEndMonth, fyEndYear;
    
    if (month >= 4) {
      // Current month is Apr-Dec → FY started in April of this year
      fyStartMonth = 4;
      fyStartYear = year;
      fyEndMonth = month - 1; // Previous month
      fyEndYear = year;
    } else {
      // Current month is Jan-Mar → FY started in April of previous year
      fyStartMonth = 4;
      fyStartYear = year - 1;
      fyEndMonth = month - 1 || 12; // Previous month, if Jan then Dec of prev year
      fyEndYear = month === 1 ? year - 1 : year;
    }

    // Build month/year conditions for all months in this FY before current month
    const monthYearConditions = [];
    let iterMonth = fyStartMonth;
    let iterYear = fyStartYear;

    while (true) {
      // Stop if we've reached or passed the current month
      if (iterYear === year && iterMonth >= month) break;
      if (iterYear > year) break;

      monthYearConditions.push({ month: iterMonth, year: iterYear });

      iterMonth++;
      if (iterMonth > 12) {
        iterMonth = 1;
        iterYear++;
      }
    }

    if (monthYearConditions.length === 0) {
      return {
        ytdGross: 0,
        ytdTDS: 0,
        ytdPF: 0,
        ytdESI: 0,
        ytdPT: 0,
        ytdNet: 0,
        monthsProcessed: 0,
        details: []
      };
    }

    // Query all payslips for this employee in the FY up to previous month
    const payslips = await prisma.payslip.findMany({
      where: {
        employeeId,
        OR: monthYearConditions
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      select: {
        month: true,
        year: true,
        grossSalary: true,
        netSalary: true,
        totalDeductions: true,
        deductions: true,
        pfDetails: true,
        esicDetails: true,
        professionalTax: true,
        earnings: true,
        status: true
      }
    });

    // Only include released/processed payslips
    const validPayslips = payslips.filter(p => 
      p.status === 'Released' || p.status === 'Processed' || p.status === 'Generated'
    );

    let ytdGross = 0;
    let ytdTDS = 0;
    let ytdPF = 0;
    let ytdESI = 0;
    let ytdPT = 0;
    let ytdNet = 0;
    const details = [];

    for (const ps of validPayslips) {
      const gross = Number(ps.grossSalary || 0);
      const net = Number(ps.netSalary || 0);
      const pt = Number(ps.professionalTax || 0);

      // Extract TDS from deductions JSON
      let tds = 0;
      if (ps.deductions && typeof ps.deductions === 'object') {
        tds = Number(ps.deductions.TDS || ps.deductions.tds || ps.deductions.incomeTax || 0);
      }

      // Extract PF from pfDetails
      let pf = 0;
      if (ps.pfDetails && typeof ps.pfDetails === 'object') {
        pf = Number(ps.pfDetails.employeePF || ps.pfDetails.employee_pf || 0);
      }

      // Extract ESI from esicDetails
      let esi = 0;
      if (ps.esicDetails && typeof ps.esicDetails === 'object') {
        esi = Number(ps.esicDetails.employeeESI || ps.esicDetails.employee_esi || 0);
      }

      ytdGross += gross;
      ytdTDS += tds;
      ytdPF += pf;
      ytdESI += esi;
      ytdPT += pt;
      ytdNet += net;

      details.push({
        month: ps.month,
        year: ps.year,
        gross,
        tds,
        pf,
        esi,
        pt,
        net
      });
    }

    return {
      ytdGross,
      ytdTDS,
      ytdPF,
      ytdESI,
      ytdPT,
      ytdNet,
      monthsProcessed: validPayslips.length,
      details
    };
  }

  /**
   * Get remaining months in the financial year from the given month.
   */
  getRemainingMonths(month, year) {
    // FY ends in March
    if (month >= 4) {
      return 12 - (month - 4); // Apr=12, May=11, ..., Mar=1
    } else {
      return 3 - month + 1; // Jan=3, Feb=2, Mar=1
    }
  }
}
