import prisma from '@/lib/db/prisma';
import { calculateEffectiveLeaveDays } from '@/lib/utils/leave-calculator';

// Helper to calculate monthly summary
export function calculateSummary(leaves) {
  let totalDays = 0;
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let halfDayPaidLeaves = 0;
  let halfDayUnpaidLeaves = 0;

  (leaves || []).forEach((leave) => {
    const type = (leave.leaveType || "").toLowerCase();
    
    if (type.includes("unpaid")) {
      if (type.includes("half")) {
        halfDayUnpaidLeaves += 1;
        totalDays += 0.5;
      } else {
        unpaidLeaves += 1;
        totalDays += 1;
      }
    } else {
      if (type.includes("half")) {
        halfDayPaidLeaves += 1;
        totalDays += 0.5;
      } else {
        paidLeaves += 1;
        totalDays += 1;
      }
    }
  });

  const summary = {
    totalDays,
    paidLeaves,
    unpaidLeaves,
    halfDayPaidLeaves,
    halfDayUnpaidLeaves,
  };

  const thisMonthUnpaid = unpaidLeaves + (halfDayUnpaidLeaves * 0.5);

  return { summary, thisMonthUnpaid };
}

// Helper to update monthly leave balances across the year
export async function updateAnnualBalance(employeeId, organizationId, year) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    let totalEntitled = employee ? (employee.modelData?.totalLeaveEntitled || employee.modelData?.annualLeaveBalance || employee.payslipStructure?.totalLeaveEntitled) : null;
    let config = null;
    
    if (!totalEntitled && organizationId) {
      config = await prisma.payrollConfig.findFirst({
        where: { OR: [{ companyId: organizationId }, { mongoId: organizationId }] }
      });
      const configData = config?.configData || {};
      totalEntitled = configData.annualPaidLeaveQuota || 0;
    }
    
    totalEntitled = totalEntitled || 0;

    const configData = config?.configData || {};
    const enableRollover = configData.enableLeaveRollover || false;
    const maxRollover = configData.maxLeaveRollover || 0;
    const resetYearly = configData.resetRolloverYearly !== false;

    // Get all leave records for this employee in this year, sorted by month
    const allYearLeaves = await prisma.leave.findMany({
      where: {
        employeeId,
        year
      },
      orderBy: { month: "asc" }
    });

    let previousYearEndBalance = 0;
    if (enableRollover && !resetYearly) {
      const prevYearLeave = await prisma.leave.findFirst({
        where: {
          employeeId,
          year: year - 1,
          month: 12
        }
      });
      if (prevYearLeave) {
        const bal = prevYearLeave.annualLeaveBalance || {};
        let carryOver = bal.remaining || 0;
        if (maxRollover > 0) {
          carryOver = Math.min(carryOver, maxRollover);
        }
        previousYearEndBalance = Math.max(0, carryOver);
      }
    }

    let previousMonthRemaining = previousYearEndBalance;

    for (const monthRecord of allYearLeaves) {
      let carriedOver = 0;
      
      if (enableRollover && previousMonthRemaining > 0) {
        carriedOver = previousMonthRemaining;
        if (maxRollover > 0) {
          carriedOver = Math.min(carriedOver, maxRollover);
        }
      }
      
      const balanceAtMonthStart = totalEntitled + carriedOver;
      
      const monthlySummary = monthRecord.summary || {};
      const thisMonthPaidUsed = (monthlySummary.paidLeaves || 0) + 
                               ((monthlySummary.halfDayPaidLeaves || 0) * 0.5);
      
      const balanceAtMonthEnd = balanceAtMonthStart - thisMonthPaidUsed;
      
      const annualLeaveBalance = {
        totalEntitled: totalEntitled,
        used: thisMonthPaidUsed,
        remaining: balanceAtMonthEnd,
        balanceAtMonthStart: balanceAtMonthStart,
        carriedOverFromLastMonth: carriedOver,
        thisMonthUnpaid: (monthlySummary.unpaidLeaves || 0) + 
                        ((monthlySummary.halfDayUnpaidLeaves || 0) * 0.5)
      };

      await prisma.leave.update({
        where: { id: monthRecord.id },
        data: {
          annualLeaveBalance
        }
      });

      previousMonthRemaining = balanceAtMonthEnd;
    }
  } catch (error) {
    console.error("Error updating monthly balance in sync engine:", error);
  }
}

/**
 * Sync Engine to bridge LeaveApplications with Payroll Leave Summaries
 * Ensures Holidays, Weekends, and Annual Quotas are respected.
 */
export async function syncLeaveApplicationToPayroll(applicationId) {
    try {
        // 1. Resolve Application and Employee
        const triggerApplication = await prisma.leaveApplication.findFirst({
            where: { OR: [{ id: applicationId }, { mongoId: applicationId }] }
        });
        if (!triggerApplication) return;
        
        const mData = triggerApplication.modelData || {};
        const employeeId = triggerApplication.employeeId || mData.employee;
        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
        });
        if (!employee) return;

        console.log(`[LeaveSync] Total Refresh Triggered for ${employee.firstName} ${employee.lastName} (Due to application update)`);

        // 2. Fetch ALL approved applications for this employee in the current year
        const currentYear = new Date().getFullYear();
        const allEmpApps = await prisma.leaveApplication.findMany({
            where: {
                OR: [{ employeeId: employee.id }, { employeeId: employee.mongoId || '' }]
            }
        });

        const allApprovedApps = allEmpApps.filter(app => {
            const data = app.modelData || {};
            const appStatus = app.status || data.status || "";
            const isApproved = /^approved$/i.test(appStatus);
            const isNotWFH = (data.leaveType || "").toUpperCase() !== 'WFH';
            
            const startDate = data.startDate ? new Date(data.startDate) : null;
            const endDate = data.endDate ? new Date(data.endDate) : null;
            const isInYear = startDate && (startDate.getFullYear() === currentYear || (endDate && endDate.getFullYear() === currentYear));

            return isApproved && isNotWFH && isInYear;
        }).map(app => ({
            _id: app.id,
            ...app,
            ...(app.modelData || {})
        }));

        // 3. Extract and Deduplicate ALL Working Days
        const distinctDates = new Map(); // DateString -> { reason, type, approvedBy }

        for (const app of allApprovedApps) {
            console.log(`[LeaveSync] Processing App: ${app.leaveType} (${new Date(app.startDate).toDateString()} - ${new Date(app.endDate).toDateString()})`);
            const effectiveData = await calculateEffectiveLeaveDays(employee.id, app.startDate, app.endDate);
            console.log(`[LeaveSync]   Effective Days: ${effectiveData.totalEffectiveDays} / ${effectiveData.totalCalendarDays}`);
            
            effectiveData.details.forEach(day => {
                const dateKey = new Date(day.date).toISOString().split('T')[0];
                if (!day.isDeductable) {
                    console.log(`[LeaveSync]   SKIP: ${dateKey} (${day.reason})`);
                    return;
                }
                
                if (!distinctDates.has(dateKey)) {
                    console.log(`[LeaveSync]   ADD: ${dateKey}`);
                    distinctDates.set(dateKey, {
                        dateStr: dateKey,
                        reason: app.reason || 'Approved Leave',
                        leaveType: app.leaveType,
                        approvedBy: app.approvedBy,
                        approvedAt: app.approvedAt || app.createdAt
                    });
                }
            });
        }

        // 4. Group Distinct Dates by Month
        const monthlyGroups = {};
        distinctDates.forEach((info) => {
            const date = new Date(info.dateStr);
            const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyGroups[key]) monthlyGroups[key] = [];
            monthlyGroups[key].push(info);
        });

        // 5. Process each month (Overwrite/Update records)
        const affectedMonths = Object.keys(monthlyGroups);
        
        for (const key of affectedMonths) {
            const [year, month] = key.split('-').map(Number);
            const items = monthlyGroups[key];
            
            let leaveRecord = await prisma.leave.findFirst({
                where: {
                    employeeId: employee.id,
                    month,
                    year
                }
            });

            // Reconcile and calculate summary
            const newLeavesItems = items.map(item => {
                const type = (item.leaveType || "").toLowerCase();
                let mappedType = "Paid"; // Default for Sick/Casual/Paid
                
                if (type.includes("unpaid")) {
                    mappedType = type.includes("half") ? "Half-Day Unpaid" : "Unpaid";
                } else {
                    mappedType = type.includes("half") ? "Half-Day Paid" : "Paid";
                }

                return {
                    date: new Date(item.dateStr),
                    leaveType: mappedType,
                    reason: item.reason,
                    approvedBy: item.approvedBy,
                    approvedAt: item.approvedAt
                };
            });

            const { summary, thisMonthUnpaid } = calculateSummary(newLeavesItems);

            if (!leaveRecord) {
                leaveRecord = await prisma.leave.create({
                    data: {
                        employeeId: employee.id,
                        employeeCode: employee.employeeId,
                        employeeName: `${employee.firstName} ${employee.lastName}`,
                        organizationId: employee.organizationId,
                        organizationType: employee.organizationId ? 'Company' : 'General',
                        department: employee.department || 'General',
                        month,
                        year,
                        leaves: newLeavesItems,
                        summary,
                        annualLeaveBalance: {
                            totalEntitled: 0,
                            used: summary.paidLeaves || 0,
                            remaining: 0,
                            balanceAtMonthStart: 0,
                            carriedOverFromLastMonth: 0,
                            thisMonthUnpaid
                        },
                        status: 'Approved'
                    }
                });
            } else {
                let updatedStatus = leaveRecord.status;
                if (leaveRecord.status === 'Draft' || !leaveRecord.leaves || leaveRecord.leaves.length === 0) {
                    updatedStatus = 'Approved';
                    console.log(`[LeaveSync] Upgrading Draft record for ${employee.firstName} in Month ${month}`);
                }

                leaveRecord = await prisma.leave.update({
                    where: { id: leaveRecord.id },
                    data: {
                        leaves: newLeavesItems,
                        summary,
                        status: updatedStatus
                    }
                });
            }
            console.log(`[LeaveSync] Reconciled: ${summary.paidLeaves} Paid days for ${employee.firstName}`);
        }

        // 6. Global Re-balance
        await updateAnnualBalance(employee.id, employee.organizationId, currentYear);

        console.log(`[LeaveSync] Successfully re-synced all ${allApprovedApps.length} applications for ${employee.firstName}`);
    } catch (error) {
        console.error('[LeaveSync] Critical Error:', error);
        throw error;
    }
}
