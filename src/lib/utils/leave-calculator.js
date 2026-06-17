import prisma from "@/lib/db/prisma";

export async function calculateEffectiveLeaveDays(employeeId, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Normalize to UTC midnight to avoid local timezone offsets shifting dates
    const startUTC = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    if (startUTC > endUTC) {
        throw new Error("Start date must be before end date");
    }

    const employee = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
    });
    if (!employee) {
        throw new Error("Employee not found");
    }

    const orgId = employee.organizationId;
    const officeId = employee.assignedOfficeId;

    // Find shift
    const allShifts = await prisma.workingShift.findMany();
    const shift = allShifts.find(s => {
        const data = s.modelData || {};
        return (s.organizationId === orgId || data.organizationId === orgId) && (s.status === 'Active' || data.isDefault);
    });

    const workingDays = shift && shift.modelData?.workingDays && shift.modelData.workingDays.length > 0 
        ? shift.modelData.workingDays 
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    let holidayList = null;
    if (officeId) {
        // Query by officeLocationId (could be in holidayListData Json or directly in fields if available)
        holidayList = await prisma.holidayList.findFirst({
            where: {
                OR: [
                    { applicableLocations: { path: ['officeLocationId'], equals: officeId } },
                    { holidayListData: { path: ['officeLocationId'], equals: officeId } }
                ],
                status: 'Active'
            }
        });
    }
    if (!holidayList && orgId) {
        holidayList = await prisma.holidayList.findFirst({
            where: {
                organizationId: orgId,
                isDefault: true,
                status: 'Active'
            }
        });
    }

    let holidays = [];
    if (holidayList) {
        holidays = await prisma.holiday.findMany({
            where: {
                holidayListId: holidayList.id,
                status: 'Active'
            }
        });
    }
    const mandatoryHolidays = holidays.filter(h => !h.isRestricted);

    const year = startUTC.getUTCFullYear();
    const claims = await prisma.restrictedHolidayClaim.findMany({
        where: {
            employeeId: employee.id,
            year: year,
            status: "Approved"
        }
    });

    const claimHolidayIds = claims.map(c => c.holidayId).filter(Boolean);
    const claimedHolidays = claimHolidayIds.length > 0 
        ? await prisma.holiday.findMany({ where: { id: { in: claimHolidayIds } } })
        : [];

    let currentDate = new Date(startUTC);
    const details = [];
    let totalEffectiveDays = 0;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    while (currentDate <= endUTC) {
        const yyyy = currentDate.getUTCFullYear();
        const mm = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const dayOfWeekName = dayNames[currentDate.getUTCDay()];
        
        let isDeductable = true;
        let reason = "Working Day";

        if (!workingDays.includes(dayOfWeekName)) {
            isDeductable = false;
            reason = "Weekend / Weekly Off";
        } else {
            const mandatoryMatch = mandatoryHolidays.find(h => {
                const hDate = new Date(h.date);
                return hDate.toISOString().split("T")[0] === dateStr;
            });

            if (mandatoryMatch) {
                isDeductable = false;
                reason = `Holiday: ${mandatoryMatch.name}`;
            } else {
                const claimMatch = claimedHolidays.find(h => {
                    if (!h || !h.date) return false;
                    const hDate = new Date(h.date);
                    return hDate.toISOString().split("T")[0] === dateStr;
                });

                if (claimMatch) {
                    isDeductable = false;
                    reason = `Claimed Holiday: ${claimMatch.name}`;
                }
            }
        }

        if (isDeductable) {
            totalEffectiveDays++;
        }

        details.push({
            date: dateStr,
            dayOfWeek: dayOfWeekName,
            isDeductable,
            reason
        });

        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return {
        totalCalendarDays: details.length,
        totalEffectiveDays,
        details,
        shiftApplied: shift ? (shift.modelData?.name || "Shift") : "Default Standard Shift",
        workingDaysConfigured: workingDays
    };
}
