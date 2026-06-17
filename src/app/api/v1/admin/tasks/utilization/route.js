import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "supervisor"]);
        

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json({ success: false, error: 'startDate and endDate are required' }, { status: 400 });
        }

        // Aggregate hours by employee (In-memory grouping to support Json modelData)
        const allEntries = await prisma.timesheetEntry.findMany();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const employeeHours = {};
        allEntries.forEach(entry => {
            const data = entry.modelData || {};
            const dateVal = data.date ? new Date(data.date) : null;
            const hoursVal = parseFloat(data.hours || 0);
            const employeeId = entry.employeeId;
            
            if (dateVal && dateVal >= start && dateVal <= end && employeeId) {
                if (!employeeHours[employeeId]) {
                    employeeHours[employeeId] = 0;
                }
                employeeHours[employeeId] += hoursVal;
            }
        });

        const utilizationData = Object.keys(employeeHours).map(empId => ({
            employeeId: empId,
            _sum: {
                hours: employeeHours[empId]
            }
        }));

        // Get all employees of the organization to include those with 0 hours
        const employees = await prisma.employee.findMany({
            where: {
                status: 'Active'
            },
            select: {
                id: true,
                mongoId: true,
                employeeId: true,
                firstName: true,
                lastName: true
            }
        });

        const report = employees.map(emp => {
            const utilization = utilizationData.find(u => u.employeeId === emp.id || u.employeeId === emp.mongoId);
            const totalHours = utilization && utilization._sum && utilization._sum.hours ? utilization._sum.hours : 0;
            const daysCount = 0; // Prisma groupBy doesn't support addToSet equivalent easily, mock for now
            
            // Standard week is 40 hours. Adjust as needed.
            // Calculation: (totalHours / (expectedHours for the range)) * 100
            // For simplicity, let's assume a 8hr workday.
            const dateDiff = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
            const expectedHours = dateDiff * 8; 
            
            return {
                employeeId: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeId,
                empCode: emp.employeeId,
                totalHours,
                utilizationPercentage: expectedHours > 0 ? Math.round((totalHours / expectedHours) * 100) : 0,
                daysWorked: daysCount
            };
        });

        // Sort by utilization (high to low)
        report.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

        return NextResponse.json({ 
            success: true, 
            report,
            summary: {
                totalEmployees: employees.length,
                averageUtilization: report.length > 0 ? Math.round(report.reduce((acc, curr) => acc + curr.utilizationPercentage, 0) / report.length) : 0
            }
        });

    } catch (error) {
        console.error('Utilization API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
