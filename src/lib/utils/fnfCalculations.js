
/**
 * Utility functions for Full and Final Settlement Calculations
 */

export const calculatePerDaySalary = (salaryStructure, totalDaysInMonth = 30) => {
    const basic = salaryStructure.basicSalary || 0;
    const gross = salaryStructure.grossSalary || 0;

    // Keka/Standard logic: Usually Basic / 26 or Gross / 30 depending on policy.
    // Defaulting to Basic / 26 for Leave Encashment/Gratuity usually, 
    // but for proration of monthly salary, it's usually / DaysInMonth.

    return {
        basicPerDay: basic / totalDaysInMonth,
        grossPerDay: gross / totalDaysInMonth,
        encashmentRate: basic / 26, // Commonly used for Leave Encashment (Basic / 26)
        noticeRecoveryRate: gross / 30 // Usually on Gross
    };
};

export const calculateGratuityAmount = (basicSalary, tenureYears) => {
    if (tenureYears < 5) return 0; // Standard gratuity rule: 5 years continuous service
    // Formula: (Last Drawn Basic * 15 / 26) * Tenure Years
    return Math.round((basicSalary * 15 / 26) * tenureYears);
};

export const calculateLeaveEncashment = (leaveBalance, basicSalary) => {
    if (leaveBalance <= 0) return 0;
    // Formula: (Basic / 26) * Leave Balance
    const rate = basicSalary / 26;
    return Math.round(rate * leaveBalance);
};

export const calculateNoticeRecovery = (shortfallDays, grossSalary) => {
    if (shortfallDays <= 0) return 0;
    // Usually calculated on Gross Salary
    // Formula: (Gross / 30) * Shortfall Days
    const rate = grossSalary / 30;
    return Math.round(rate * shortfallDays);
};

export const calculateProratedEarnings = (salaryStructure, daysWorked, totalDaysInMonth) => {
    const prorate = (amount) => Math.round((amount / totalDaysInMonth) * daysWorked);

    // Prorate Basic
    const basic = prorate(salaryStructure.basicSalary || 0);

    // Prorate other earnings
    const earnings = (salaryStructure.earnings || []).map(e => {
        let amount = 0;
        if (e.calculationType === 'fixed') {
            amount = e.fixedAmount; // Even fixed might need proration if it's monthly
        } else {
            // Percentage of Basic (already prorated basic? No, usually % of full basic, then prorated, OR % of prorated basic)
            // Safer to calculate Annual/Monthly full amount then prorate.
            const fullBasic = salaryStructure.basicSalary || 0;
            amount = (fullBasic * e.percentage) / 100;
        }
        return {
            name: e.name,
            amount: prorate(amount)
        };
    });

    const totalEarnings = basic + earnings.reduce((sum, e) => sum + e.amount, 0);

    return {
        basic,
        earnings, // Array of broken down earnings
        totalEarnings
    };
};
