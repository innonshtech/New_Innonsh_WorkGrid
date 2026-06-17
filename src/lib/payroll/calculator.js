import prisma from '@/lib/db/prisma';

export async function calculateSalaryComponents(employeePrismaDoc, statutoryConfig = null, params = {}) {
    const now = new Date();
    const month = Number(params.month || now.getMonth() + 1);
    const year = Number(params.year || now.getFullYear());
    const workingDaysInMonth = Number(params.workingDaysInMonth || new Date(year, month, 0).getDate());

    const structure = typeof employeePrismaDoc.payslipStructure === 'object' && employeePrismaDoc.payslipStructure !== null 
        ? employeePrismaDoc.payslipStructure 
        : employeePrismaDoc.modelData?.payslipStructure;

    if (!structure) {
        throw new Error("Salary structure (payslipStructure) is missing for this employee.");
    }

    const basicSalary = Number(structure.basicSalary || 0);
    const grossSalary = Number(structure.grossSalary || basicSalary);

    // Setup dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const totalDays = new Date(year, month, 0).getDate();

    // 1. INTEGRATE LEAVES & ATTENDANCE (LOP)
    // Fetch leave record
    const leaveRecord = await prisma.leave.findFirst({
        where: {
            employeeId: employeePrismaDoc.id,
            month: month,
            year: year,
            status: { in: ["Approved", "Draft"] }
        },
        orderBy: { createdAt: 'desc' }
    });

    let explicitPaidLeaves = 0;
    let lopDays = params.lopDays || 0;
    if (leaveRecord && leaveRecord.summary) {
        const summary = typeof leaveRecord.summary === 'object' ? leaveRecord.summary : {};
        const explicitlyUnpaid = (summary.unpaidLeaves || 0) + (summary.halfDayUnpaidLeaves || 0) * 0.5;
        lopDays += explicitlyUnpaid;
        explicitPaidLeaves = (summary.paidLeaves || 0) + (summary.halfDayPaidLeaves || 0) * 0.5;
    }

    // Fetch Attendance
    const allAttendance = await prisma.attendance.findMany({
        where: {
            employeeId: employeePrismaDoc.id,
            date: { gte: startDate, lte: endDate }
        }
    });

    const absentRecords = allAttendance.filter(rec => rec.status === "Absent");

    // Holidays
    let empOrgId = employeePrismaDoc.organizationId;
    let empOfficeId = employeePrismaDoc.assignedOfficeId;
    let empHolidayListId = employeePrismaDoc.holidayListId;

    if (!empHolidayListId && empOfficeId) {
        const activeLists = await prisma.holidayList.findMany({
            where: {
                year: year,
                status: 'Active'
            }
        });
        const listForOffice = activeLists.find(list => {
            const locs = list.applicableLocations;
            if (Array.isArray(locs)) {
                return locs.includes(empOfficeId);
            }
            if (typeof locs === 'string') {
                return locs === empOfficeId;
            }
            return false;
        });
        if (listForOffice) empHolidayListId = listForOffice.id;
    }

    if (!empHolidayListId && empOrgId) {
        const defaultList = await prisma.holidayList.findFirst({
            where: {
                organizationId: empOrgId,
                year: year,
                isDefault: true,
                status: 'Active'
            }
        });
        if (defaultList) empHolidayListId = defaultList.id;
    }

    const holidays = await prisma.holiday.findMany({
        where: {
            status: "Active",
            date: { gte: startDate, lte: endDate },
            isRestricted: false,
            OR: empHolidayListId ? [{ holidayListId: empHolidayListId }] : [{ organizationId: empOrgId }]
        }
    });

    const holidayDates = new Set();
    holidays.forEach(h => {
        holidayDates.add(new Date(h.date).toDateString());
    });

    // Exclude holidays from absents
    const nonHolidayAbsents = absentRecords.filter(rec => !holidayDates.has(new Date(rec.date).toDateString()));
    lopDays += nonHolidayAbsents.length;

    // Calculate weekly offs (weekend days)
    let weeklyOffs = 0;
    let temp = new Date(startDate);
    while (temp <= endDate) {
        const day = temp.getDay();
        if (day === 0 || day === 6) { // Sunday = 0, Saturday = 6
            weeklyOffs++;
        }
        temp.setDate(temp.getDate() + 1);
    }

    // Compute working and present days
    const workingDays = totalDays - weeklyOffs;
    const presentDays = Math.max(0, workingDays - lopDays);

    // 2. OVERTIME
    let overtimeHours = 0;
    allAttendance.forEach(rec => {
        if (rec.overtimeHours) {
            overtimeHours += rec.overtimeHours;
        }
    });

    const otRate = (params.payrollConfig?.configData?.otRate) || 150;
    const overtimeAmount = overtimeHours * otRate;

    // 3. LOAN DEDUCTIONS
    const activeLoans = await prisma.loan.findMany({
        where: {
            employeeId: employeePrismaDoc.id,
            status: 'Active'
        }
    });
    let loanDeductions = 0;
    activeLoans.forEach(loan => {
        const emi = loan.emi || (loan.loanData?.emi) || 0;
        loanDeductions += emi;
    });

    // 4. RETROS
    const retroList = await prisma.retroAdjustment.findMany({
        where: {
            employeeId: employeePrismaDoc.id,
            status: 'Pending'
        }
    });
    let retroAmount = 0;
    const parsedRetroList = [];
    retroList.forEach(r => {
        const amount = r.modelData?.amount || 0;
        retroAmount += amount;
        parsedRetroList.push({
            retroId: r.id,
            amount: amount
        });
    });

    // 5. STATUTORY CONFIGS
    // PF
    let pfAmount = 0;
    if (employeePrismaDoc.pfApplicable === 'yes') {
        const pfBasis = Math.min(basicSalary, 15000);
        pfAmount = Math.round(pfBasis * 0.12);
    }
    const pfDetails = {
        employeeContribution: pfAmount,
        employerContribution: pfAmount
    };

    // ESIC
    let esicAmount = 0;
    if (employeePrismaDoc.esicApplicable === 'yes' && grossSalary <= 21000) {
        esicAmount = Math.round(grossSalary * 0.0075);
    }
    const esicDetails = {
        employeeContribution: esicAmount,
        employerContribution: Math.round(grossSalary * 0.0325)
    };

    // PT
    let professionalTax = 0;
    if (employeePrismaDoc.isTDSApplicable || employeePrismaDoc.pfApplicable === 'yes' || employeePrismaDoc.esicApplicable === 'yes') {
        if (grossSalary > 10000) {
            professionalTax = (month === 2) ? 250 : 200;
        } else if (grossSalary > 7500) {
            professionalTax = 175;
        }
    }

    // 6. TOTAL FINANCIALS
    const totalEarnings = grossSalary + overtimeAmount + retroAmount;
    
    let lopAmount = 0;
    if (lopDays > 0) {
        const perDayGross = grossSalary / workingDaysInMonth;
        lopAmount = Math.round(perDayGross * lopDays);
    }

    const totalDeductions = lopAmount + pfAmount + esicAmount + professionalTax + loanDeductions;
    const netSalary = totalEarnings - totalDeductions;

    // Build earnings array
    const earningsList = Array.isArray(structure.earnings) ? structure.earnings.map(e => ({
        name: e.name,
        calculatedAmount: e.calculationType === 'percentage' ? (basicSalary * e.percentage / 100) : e.fixedAmount,
        calculationType: e.calculationType,
        percentage: e.percentage
    })) : [];

    if (overtimeAmount > 0) {
        earningsList.push({
            name: 'Overtime Pay',
            calculatedAmount: overtimeAmount,
            calculationType: 'fixed',
            percentage: 0
        });
    }
    if (retroAmount > 0) {
        earningsList.push({
            name: 'Retro Adjustment',
            calculatedAmount: retroAmount,
            calculationType: 'fixed',
            percentage: 0
        });
    }

    // Build deductions array
    const deductionsList = Array.isArray(structure.deductions) ? structure.deductions.map(d => ({
        name: d.name,
        calculatedAmount: d.calculationType === 'percentage' ? (basicSalary * d.percentage / 100) : d.fixedAmount,
        calculationType: d.calculationType,
        percentage: d.percentage
    })) : [];

    if (lopAmount > 0) {
        deductionsList.push({
            name: 'Loss of Pay (LOP)',
            calculatedAmount: lopAmount,
            calculationType: 'fixed',
            percentage: 0
        });
    }
    if (pfAmount > 0) {
        deductionsList.push({
            name: 'Provident Fund (PF)',
            calculatedAmount: pfAmount,
            calculationType: 'fixed',
            percentage: 0
        });
    }
    if (esicAmount > 0) {
        deductionsList.push({
            name: 'ESIC',
            calculatedAmount: esicAmount,
            calculationType: 'fixed',
            percentage: 0
        });
    }
    if (professionalTax > 0) {
        deductionsList.push({
            name: 'Professional Tax (PT)',
            calculatedAmount: professionalTax,
            calculationType: 'fixed',
            percentage: 0
        });
    }
    if (loanDeductions > 0) {
        deductionsList.push({
            name: 'Loan Repayment EMI',
            calculatedAmount: loanDeductions,
            calculationType: 'fixed',
            percentage: 0
        });
    }

    return {
        basicSalary,
        grossSalary,
        totalEarnings,
        totalDeductions,
        netSalary,
        workingDays,
        presentDays,
        lopDays,
        paidLeaves: explicitPaidLeaves,
        totalDays,
        weeklyOffs,
        holidays: holidays.length,
        overtimeHours,
        overtimeAmount,
        loanDeductions,
        pfDetails,
        esicDetails,
        professionalTax,
        retroList: parsedRetroList,
        earnings: earningsList,
        deductions: deductionsList,
        salaryType: structure.salaryType || 'monthly'
    };
}
