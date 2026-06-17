import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';
import { unstable_cache } from 'next/cache';

const getCachedStats = unstable_cache(
    async (organizationId) => {
        // Resolve Project IDs and Employee IDs belonging to this organization
        const [projects, activeEmployees] = await Promise.all([
            prisma.project.findMany({ where: { organizationId }, select: { id: true, mongoId: true, status: true, projectData: true } }),
            prisma.employee.findMany({ where: { organizationId }, select: { id: true, mongoId: true, firstName: true, lastName: true, employeeId: true } })
        ]);
        const projectIds = projects.flatMap(p => [p.id, p.mongoId]).filter(Boolean);
        const employeeIds = activeEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);

        const [
            totalTasks,
            completedTasks,
            totalEmployees,
            pendingTimesheets,
            tasksRaw
        ] = await Promise.all([
            prisma.task.count({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ] } }),
            prisma.task.count({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ], status: 'Completed' } }),
            prisma.employee.count({ where: { organizationId, status: 'Active' } }),
            prisma.timesheet.count({ where: { employeeId: { in: employeeIds }, status: 'Submitted' } }),
            prisma.task.findMany({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ] } })
        ]);

        const averageProgress = tasksRaw.length > 0 
            ? Math.round(tasksRaw.reduce((acc, t) => {
                const td = typeof t.taskData === 'object' && t.taskData !== null ? t.taskData : {};
                return acc + (td.progress || t.progress || 0);
            }, 0) / tasksRaw.length)
            : 0;

        // Fetch Detailed Project Data (limit to top 5 non-completed projects)
        const topProjects = projects.filter(p => p.status !== 'Completed').slice(0, 5);

        const projectDetails = await Promise.all(topProjects.map(async (p) => {
            const projectTasks = await prisma.task.findMany({ where: { OR: [{ projectId: p.id }, { projectId: p.mongoId || '' }] } });
            
            const progress = projectTasks.length > 0
                ? Math.round(projectTasks.reduce((acc, t) => {
                    const td = typeof t.taskData === 'object' && t.taskData !== null ? t.taskData : {};
                    return acc + (td.progress || t.progress || 0);
                }, 0) / projectTasks.length)
                : 0;
            
            let pmData = null;
            const pmId = p.projectData?.projectManager;
            if (pmId) {
                pmData = await prisma.employee.findFirst({
                    where: { OR: [{ id: pmId }, { mongoId: pmId }] },
                    select: { firstName: true, lastName: true }
                });
            }

            const pmName = pmData 
                ? `${pmData.firstName || ''} ${pmData.lastName || ''}`.trim()
                : null;

            return {
                _id: p.id,
                ...p.projectData,
                projectManager: pmName ? { personalDetails: { firstName: pmName.split(' ')[0], lastName: pmName.split(' ')[1] || '' } } : null,
                status: p.status,
                progress,
                taskCount: projectTasks.length
            };
        }));

        // Fetch Top Contributors (Past 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch timesheet entries created or dated in past 30 days
        const recentEntries = await prisma.timesheetEntry.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        const hoursMap = {};
        recentEntries.forEach(entry => {
            const data = entry.modelData || {};
            const dateVal = data.date ? new Date(data.date) : null;
            if (dateVal && dateVal >= thirtyDaysAgo) {
                const empId = entry.employeeId || data.employee;
                if (empId && employeeIds.includes(empId)) {
                    hoursMap[empId] = (hoursMap[empId] || 0) + (parseFloat(data.hours) || 0);
                }
            }
        });

        const sortedContributors = Object.keys(hoursMap)
            .map(k => ({ employeeId: k, totalHours: hoursMap[k] }))
            .sort((a, b) => b.totalHours - a.totalHours)
            .slice(0, 5);

        const empMap = {};
        activeEmployees.forEach(e => {
            empMap[e.id] = e;
            if (e.mongoId) empMap[e.mongoId] = e;
        });

        const populatedContributors = sortedContributors.map(c => {
            const emp = empMap[c.employeeId];
            const name = emp
                ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
                : 'Unknown';
            return {
                name,
                hours: c.totalHours
            };
        });

        // Recent Activity
        const recentActivityDocs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const recentActivity = recentActivityDocs.map(a => {
            const ld = typeof a.logData === 'object' && a.logData !== null ? a.logData : {};
            return {
                _id: a.id,
                action: a.action,
                entity: a.module,
                description: ld.description || '',
                performedBy: ld.performedBy || null,
                details: ld.details || null,
                status: ld.status || 'success',
                createdAt: a.createdAt
            };
        });

        return {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status !== 'Completed').length,
            totalTasks,
            completedTasks,
            totalEmployees,
            pendingTimesheets,
            averageProgress,
            topProjects: projectDetails,
            topContributors: populatedContributors,
            recentActivity
        };
    },
    ['admin-dashboard-stats-v1'],
    { revalidate: 60, tags: ['dashboard-stats'] }
);

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const organizationId = authUser.organizationId;
        
        // Use the unstable_cache wrapper to execute or fetch the cached response
        const stats = await getCachedStats(organizationId);

        return NextResponse.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
