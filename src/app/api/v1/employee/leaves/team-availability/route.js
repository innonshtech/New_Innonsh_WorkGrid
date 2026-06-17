import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ['employee', 'admin', 'hr', 'company_admin', 'super_admin']);

        // 1. Get the current employee's profile to identify their team
        let currentEmployee = await prisma.employee.findFirst({
            where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        });

        if (!currentEmployee) {
            const userRecord = await prisma.user.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
            });
            if (userRecord && userRecord.employeeId) {
                currentEmployee = await prisma.employee.findFirst({
                    where: { OR: [{ id: userRecord.employeeId }, { employeeId: userRecord.employeeId }] }
                });
            }
        }

        if (!currentEmployee) {
            return NextResponse.json({ success: true, data: [] });
        }

        const { reportingManager, teamId } = currentEmployee;

        if (!reportingManager && !teamId) {
            return NextResponse.json({ success: true, data: [], message: "No team context found" });
        }

        // 2. Find teammate IDs
        // "Team" = same reporting manager OR same project team
        const teammates = await prisma.employee.findMany({
            where: {
                id: { not: currentEmployee.id },
                OR: [
                    reportingManager ? { reportingManager } : null,
                    teamId ? { teamId } : null
                ].filter(Boolean),
                status: 'Active'
            },
            select: {
                id: true,
                mongoId: true,
                firstName: true,
                lastName: true,
                designation: true
            }
        });

        if (teammates.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        const teammateIds = teammates.map(t => t.id).concat(teammates.map(t => t.mongoId).filter(Boolean));

        // 3. Fetch approved leave applications for these teammates
        const activeLeaves = await prisma.leaveApplication.findMany({
            where: {
                employeeId: { in: teammateIds },
                status: 'Approved'
            }
        });

        // 4. Filter leaves active today or starting in next 14 days in memory
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const fourteenDaysLater = new Date();
        fourteenDaysLater.setDate(today.getDate() + 14);
        fourteenDaysLater.setHours(23, 59, 59, 999);

        const filteredLeaves = activeLeaves.filter(leave => {
            const start = leave.modelData?.startDate ? new Date(leave.modelData.startDate) : null;
            const end = leave.modelData?.endDate ? new Date(leave.modelData.endDate) : null;
            if (!start || !end) return false;
            
            const currentlyActive = start <= new Date() && end >= today;
            const startingSoon = start >= today && start <= fourteenDaysLater;
            
            return currentlyActive || startingSoon;
        });

        // Create mapping of teammate details by ID
        const teammateMap = {};
        teammates.forEach(t => {
            teammateMap[t.id] = t;
            if (t.mongoId) teammateMap[t.mongoId] = t;
        });

        // 5. Format data for the legacy dashboard structure
        const formattedData = filteredLeaves.map(leave => {
            const emp = teammateMap[leave.employeeId];
            const start = leave.modelData?.startDate;
            const end = leave.modelData?.endDate;
            return {
                _id: leave.id,
                employeeName: emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown Employee',
                designation: emp ? emp.designation : '',
                startDate: start,
                endDate: end,
                totalDays: leave.modelData?.totalDays,
                isToday: start && end ? new Date(start) <= new Date() && new Date(end) >= today : false,
                leaveType: leave.modelData?.leaveType
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error fetching team availability:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
