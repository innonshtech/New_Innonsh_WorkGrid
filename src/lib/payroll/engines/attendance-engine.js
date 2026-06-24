/**
 * ═══════════════════════════════════════════════════════════
 * ATTENDANCE & PRORATION ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Payable Days = Payroll Days - LOP Days
 * 
 * Prorated Component = (Component Amount / Payroll Days) × Payable Days
 * 
 * Apply proration on ALL earnings components.
 */

export class AttendanceEngine {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Process attendance records and compute payable days
   * 
   * @param {Array} attendanceRecords - Attendance records for the month
   * @param {object} leaveRecord - Leave summary for the month
   * @param {Array} holidays - Holiday records for the month
   * @param {number} month - Payroll month
   * @param {number} year - Payroll year
   * @returns {object} Attendance breakdown
   */
  processAttendance(attendanceRecords, leaveRecord, holidays, month, year, workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) {
    const startTime = performance.now();

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    
    // Normalize to UTC midnight to avoid local timezone offsets shifting dates
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    // UTC formatting helper
    const toUTCDateString = (date) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    // Build date maps using YYYY-MM-DD
    const attendanceMap = new Map();
    for (const rec of attendanceRecords) {
      const dateStr = toUTCDateString(rec.date);
      if (dateStr) {
        attendanceMap.set(dateStr, rec);
      }
    }

    const holidayDates = new Set();
    for (const h of holidays) {
      const dateStr = toUTCDateString(h.date);
      if (dateStr) {
        holidayDates.set(dateStr);
      }
    }

    const leaveMap = new Map();
    if (leaveRecord && leaveRecord.leaves) {
      const leavesList = typeof leaveRecord.leaves === 'string' 
        ? JSON.parse(leaveRecord.leaves) 
        : (Array.isArray(leaveRecord.leaves) ? leaveRecord.leaves : []);
      for (const item of leavesList) {
        if (item && item.date) {
          const lDateStr = toUTCDateString(item.date);
          if (lDateStr) {
            leaveMap.set(lDateStr, item);
          }
        }
      }
    }

    // Count each day type
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let weeklyOffs = 0;
    let holidayCount = 0;
    let paidLeaves = 0;
    let unpaidLeaves = 0;
    let overtimeHours = 0;
    const warnings = [];
    let overriddenLeavesCount = 0;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = toUTCDateString(current);
      const dayOfWeek = current.getUTCDay();
      const dayOfWeekName = dayNames[dayOfWeek];
      
      const record = attendanceMap.get(dateStr);
      const isHoliday = holidayDates.has(dateStr);
      const isWeekend = !workingDays.includes(dayOfWeekName);
      const leaveItem = leaveMap.get(dateStr);

      const hasPunchOnLeave = leaveItem && record && (record.checkIn || record.status === 'Present');

      if (isHoliday) {
        holidayCount++;
      } else if (isWeekend) {
        weeklyOffs++;
      } else if (leaveItem && !hasPunchOnLeave) {
        const type = leaveItem.leaveType || '';
        if (type.includes('Half-Day') || type.includes('half')) {
          halfDays++;
          presentDays += 0.5;
          if (type.toLowerCase().includes('paid')) {
            paidLeaves += 0.5;
          } else {
            unpaidLeaves += 0.5;
            absentDays += 0.5;
          }
        } else {
          if (type.toLowerCase().includes('paid')) {
            paidLeaves++;
          } else {
            unpaidLeaves++;
            absentDays++;
          }
        }
      } else if (record) {
        if (hasPunchOnLeave) {
          overriddenLeavesCount++;
          warnings.push(`${dateStr}: Punched in on an approved leave day. Overrode leave and counted as Present.`);
        }

        const status = record.status;
        switch (status) {
          case 'Present':
            presentDays++;
            break;
          case 'Half Day':
            halfDays++;
            presentDays += 0.5;
            absentDays += 0.5;
            unpaidLeaves += 0.5;
            break;
          case 'Absent':
          case 'LOP':
          case 'Unpaid Leave':
            absentDays++;
            unpaidLeaves++;
            break;
          case 'Paid Leave':
            paidLeaves++;
            break;
          case 'Weekly Off':
            weeklyOffs++;
            break;
          case 'Holiday':
            holidayCount++;
            break;
          default:
            // Check-in fallback
            if (record.checkIn) {
              presentDays++;
            } else {
              absentDays++;
              unpaidLeaves++;
            }
            break;
        }
        // Accumulate overtime
        if (record.overtimeHours) {
          overtimeHours += Number(record.overtimeHours);
        }
      } else {
        // No record for a working day — count as LOP/absent
        absentDays++;
        unpaidLeaves++;
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Fallback sync with leave summary totals if day-by-day was lower (adjusting for overridden leave days)
    if (leaveRecord && leaveRecord.summary) {
      const summary = typeof leaveRecord.summary === 'object' ? leaveRecord.summary : {};
      const leaveUnpaid = Number(summary.unpaidLeaves || 0) + Number(summary.halfDayUnpaidLeaves || 0) * 0.5;
      const leavePaid = Math.max(0, (Number(summary.paidLeaves || 0) + Number(summary.halfDayPaidLeaves || 0) * 0.5) - overriddenLeavesCount);

      unpaidLeaves = Math.max(unpaidLeaves, leaveUnpaid);
      paidLeaves = Math.max(paidLeaves, leavePaid);
    }

    // Final calculations
    const payrollDays = totalDaysInMonth;  // Calendar days approach
    const lopDays = unpaidLeaves;
    const payableDays = Math.max(0, payrollDays - lopDays);

    const result = {
      payrollDays,
      totalDaysInMonth,
      presentDays,
      absentDays,
      halfDays,
      weeklyOffs,
      holidays: holidayCount,
      paidLeaves,
      unpaidLeaves,
      lopDays,
      payableDays,
      overtimeHours,
      prorationFactor: payrollDays > 0 ? payableDays / payrollDays : 1,
      warnings,
    };

    // Log
    if (this.logger) {
      this.logger.log(4, 'LOAD_ATTENDANCE', null,
        `Payable Days = ${payrollDays} - ${lopDays} = ${payableDays}`,
        { totalDays: totalDaysInMonth, attendanceRecords: attendanceRecords.length },
        payableDays,
        result
      );
    }

    return result;
  }

  /**
   * Prorate a component amount based on attendance
   * 
   * Prorated = (Amount / Payroll Days) × Payable Days
   * 
   * @param {number} amount - Full monthly component amount
   * @param {number} payrollDays - Total payroll days
   * @param {number} payableDays - Actual payable days
   * @returns {number} Prorated amount
   */
  prorate(amount, payrollDays, payableDays) {
    if (payrollDays <= 0) return 0;
    if (payableDays >= payrollDays) return amount; // No proration needed
    return (amount / payrollDays) * payableDays;
  }

  /**
   * Prorate all earnings in a breakdown object
   * 
   * @param {object} earningsBreakdown - { "BASIC": 25000, "HRA": 12500, ... }
   * @param {number} payrollDays
   * @param {number} payableDays
   * @returns {object} Prorated breakdown
   */
  prorateAll(earningsBreakdown, payrollDays, payableDays) {
    const prorated = {};
    for (const [code, amount] of Object.entries(earningsBreakdown)) {
      prorated[code] = this.prorate(amount, payrollDays, payableDays);
    }
    return prorated;
  }
}
