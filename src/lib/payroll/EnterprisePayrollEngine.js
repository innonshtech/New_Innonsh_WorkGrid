
/**
 * EnterprisePayrollEngine
 * 
 * A professional, calendar-day based payroll calculation engine.
 * Follows enterprise HRMS principles (SAP/Oracle style).
 */
export class EnterprisePayrollEngine {
  /**
   * Calculate salary for an employee over a specific period.
   * 
   * @param {Object} employee - Mongoose Employee Document
   * @param {Array} attendanceRecords - Array of attendance objects for the period
   * @param {Object} options - { startDate, endDate, monthlyLeaveQuota, payrollConfig }
   */
  static async calculate(employee, attendanceRecords, options = {}) {
    const { startDate, endDate, monthlyLeaveQuota = 4 } = options;
    const auditLog = [];
    
    auditLog.push(`Starting calculation for ${employee.personalDetails.firstName} ${employee.personalDetails.lastName}`);
    auditLog.push(`Payroll Period: ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // 1. Split the period into month-wise segments
    const segments = this.splitIntoMonthSegments(startDate, endDate);
    const results = {
      segments: [],
      totalPayableDays: 0,
      totalLOPDays: 0,
      totalPaidLeaves: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      netSalary: 0,
      auditLog: auditLog
    };

    const standardBasic = employee.payslipStructure.basicSalary || 0;
    const standardGross = employee.payslipStructure.grossSalary || 0;

    // 2. Process each month segment
    for (const segment of segments) {
      const segmentYear = segment.start.getFullYear();
      const segmentMonth = segment.start.getMonth() + 1;
      const daysInMonth = new Date(segmentYear, segmentMonth, 0).getDate();
      
      // Calculate Per Day Salary for THIS specific month (Calendar Day Based)
      const perDaySalary = Number((standardBasic / daysInMonth).toFixed(2));
      const perDayGross = Number((standardGross / daysInMonth).toFixed(2));
      
      auditLog.push(`Processing Segment: ${segmentYear}-${segmentMonth} (${daysInMonth} days in month)`);
      auditLog.push(`Per Day Basic: ${perDaySalary}, Per Day Gross: ${perDayGross}`);

      // Filter attendance records for this segment
      const segmentAttendance = attendanceRecords.filter(rec => {
        const d = new Date(rec.date);
        return d >= segment.start && d <= segment.end;
      });

      // Count statuses month-wise
      const stats = this.processAttendance(segmentAttendance, segment.start, segment.end);
      
      // Month-wise Leave Validation
      const { paidLeaves, lopFromLeaves } = this.validateLeaveQuota(stats.totalLeaves, monthlyLeaveQuota);
      
      const totalLOP = stats.absentDays + lopFromLeaves;
      const payableDays = stats.totalDays - totalLOP;

      // Segment Financials
      const segmentBasic = Number((perDaySalary * payableDays).toFixed(2));
      const lopDeduction = Number((perDaySalary * totalLOP).toFixed(2));
      
      // Calculate other earnings and deductions based on segmentBasic
      const segmentEarnings = (employee.payslipStructure.earnings || [])
        .filter(e => e.enabled)
        .map(e => {
            const amount = e.calculationType === 'percentage' ? (segmentBasic * (e.percentage || 0)) / 100 : (e.fixedAmount / daysInMonth) * stats.totalDays;
            return { name: e.name, calculatedAmount: Math.round(amount) };
        });

      const segmentDeductions = (employee.payslipStructure.deductions || [])
        .filter(d => d.enabled)
        .map(d => {
            const amount = d.calculationType === 'percentage' ? (segmentBasic * (d.percentage || 0)) / 100 : (d.fixedAmount / daysInMonth) * stats.totalDays;
            return { name: d.name, calculatedAmount: Math.round(amount) };
        });

      results.segments.push({
        month: segmentMonth,
        year: segmentYear,
        daysInMonth,
        segmentDays: stats.totalDays,
        perDaySalary,
        payableDays,
        lopDays: totalLOP,
        paidLeaves,
        basicEarned: segmentBasic,
        lopDeduction,
        earnings: segmentEarnings,
        deductions: segmentDeductions
      });

      results.totalPayableDays += payableDays;
      results.totalLOPDays += totalLOP;
      results.totalPaidLeaves += paidLeaves;
      results.totalEarnings += segmentBasic + segmentEarnings.reduce((sum, e) => sum + e.calculatedAmount, 0);
      results.totalDeductions += lopDeduction + segmentDeductions.reduce((sum, d) => sum + d.calculatedAmount, 0);

      auditLog.push(`Segment Summary: Payable=${payableDays}, LOP=${totalLOP}, Basic Earned=${segmentBasic}`);
    }

    // 4. Final Aggregation
    results.netSalary = Number((results.totalEarnings - results.totalDeductions).toFixed(2));
    
    // Map to final structure expected by Payslip model
    results.basicSalary = results.segments.reduce((sum, s) => sum + s.basicEarned, 0);
    results.earnings = this.aggregateComponents(results.segments, 'earnings');
    results.deductions = this.aggregateComponents(results.segments, 'deductions');
    
    // Add LOP as an explicit deduction
    if (results.totalLOPDays > 0) {
        const totalLopAmt = results.segments.reduce((sum, s) => sum + s.lopDeduction, 0);
        results.deductions.push({ name: 'Loss of Pay (LOP)', calculatedAmount: Math.round(totalLopAmt), days: results.totalLOPDays });
    }

    auditLog.push(`Final Aggregation: Total Payable Days=${results.totalPayableDays}, Total LOP=${results.totalLOPDays}`);
    auditLog.push(`Net Calculated Salary: ${results.netSalary}`);

    return results;
  }

  /**
   * Aggregates components across multiple month segments.
   */
  static aggregateComponents(segments, type) {
    const map = new Map();
    segments.forEach(s => {
        (s[type] || []).forEach(c => {
            const current = map.get(c.name) || 0;
            map.set(c.name, current + c.calculatedAmount);
        });
    });
    return Array.from(map.entries()).map(([name, amount]) => ({ name, calculatedAmount: amount }));
  }

  /**
   * Splits a date range into month segments.
   */
  static splitIntoMonthSegments(start, end) {
    const segments = [];
    let current = new Date(start);

    while (current <= end) {
      const segmentStart = new Date(current);
      const segmentEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0); // Last day of month
      
      const effectiveEnd = segmentEnd < end ? segmentEnd : new Date(end);
      
      segments.push({
        start: segmentStart,
        end: effectiveEnd
      });

      current = new Date(effectiveEnd);
      current.setDate(current.getDate() + 1);
    }

    return segments;
  }

  /**
   * Processes attendance for a period and returns counts.
   * Priority: LOP > Paid Leave > Holiday > Weekly Off > Present
   */
  static processAttendance(records, start, end) {
    const counts = {
      present: 0,
      paidLeave: 0,
      unpaidLeave: 0, // Explicit LOP
      absentDays: 0,
      weeklyOff: 0,
      holiday: 0,
      totalLeaves: 0,
      totalDays: 0
    };

    const dateMap = new Map();
    records.forEach(r => dateMap.set(new Date(r.date).toDateString(), r.status));

    let current = new Date(start);
    while (current <= end) {
      counts.totalDays++;
      const status = dateMap.get(current.toDateString());

      if (status === 'LOP' || status === 'Unpaid Leave' || status === 'Absent') {
        counts.absentDays++;
      } else if (status === 'Paid Leave') {
        counts.paidLeave++;
        counts.totalLeaves++;
      } else if (status === 'Holiday') {
        counts.holiday++;
      } else if (status === 'Weekly Off') {
        counts.weeklyOff++;
      } else if (status === 'Present' || status === 'Half Day') {
        counts.present += (status === 'Half Day' ? 0.5 : 1);
        if (status === 'Half Day') counts.absentDays += 0.5;
      } else {
        // DEFAULT: If no record, it's NOT payable in Enterprise systems unless it's a weekend/holiday
        // But per USER RULE: Only LOP/Absent reduces salary. 
        // So we assume it's payable if NOT marked absent.
        // HOWEVER, to be safe, we usually expect records. 
        // For now, let's treat unmarked as Present to avoid accidental deductions.
        counts.present++; 
      }

      current.setDate(current.getDate() + 1);
    }

    return counts;
  }

  /**
   * Validates leaves against monthly quota.
   */
  static validateLeaveQuota(leavesTaken, quota) {
    const paid = Math.min(leavesTaken, quota);
    const lop = Math.max(0, leavesTaken - quota);
    return {
      paidLeaves: paid,
      lopFromLeaves: lop
    };
  }
}
