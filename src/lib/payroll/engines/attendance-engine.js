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
  processAttendance(attendanceRecords, leaveRecord, holidays, month, year) {
    const startTime = performance.now();

    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Build date maps
    const attendanceMap = new Map();
    for (const rec of attendanceRecords) {
      attendanceMap.set(new Date(rec.date).toDateString(), rec);
    }

    const holidayDates = new Set();
    for (const h of holidays) {
      holidayDates.set(new Date(h.date).toDateString());
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

    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toDateString();
      const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
      const record = attendanceMap.get(dateStr);
      const isHoliday = holidayDates.has(dateStr);
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

      if (isHoliday) {
        holidayCount++;
      } else if (isWeekend) {
        weeklyOffs++;
      } else if (record) {
        const status = record.status;
        switch (status) {
          case 'Present':
            presentDays++;
            break;
          case 'Half Day':
            halfDays++;
            presentDays += 0.5;
            absentDays += 0.5;
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
            // If record exists but unknown status, count as present
            presentDays++;
            break;
        }
        // Accumulate overtime
        if (record.overtimeHours) {
          overtimeHours += Number(record.overtimeHours);
        }
      } else {
        // No record for a working day — treat as present (configurable)
        presentDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    // Add leave record LOP (from leave management module)
    if (leaveRecord && leaveRecord.summary) {
      const summary = typeof leaveRecord.summary === 'object' ? leaveRecord.summary : {};
      const leaveUnpaid = (summary.unpaidLeaves || 0) + (summary.halfDayUnpaidLeaves || 0) * 0.5;
      const leavePaid = (summary.paidLeaves || 0) + (summary.halfDayPaidLeaves || 0) * 0.5;

      // Only add if not already counted via attendance
      unpaidLeaves = Math.max(unpaidLeaves, leaveUnpaid);
      paidLeaves = Math.max(paidLeaves, leavePaid);
    }

    // Final calculations
    const payrollDays = totalDaysInMonth;  // Calendar days approach
    const lopDays = unpaidLeaves;
    const payableDays = payrollDays - lopDays;

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
