const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const organizationId = "1713d3da-2293-43c2-a7f9-c15a35b9c453"; // Let's try to find an org first
        const org = await prisma.organization.findFirst();
        if (!org) {
            console.log("No organization found");
            return;
        }
        const orgId = org.id;
        console.log("Using Org ID:", orgId);

        // Resolve Project IDs and Employee IDs belonging to this organization
        const [projects, activeEmployees] = await Promise.all([
            prisma.project.findMany({ where: { organizationId: orgId }, select: { id: true, mongoId: true, status: true, projectData: true } }),
            prisma.employee.findMany({ where: { organizationId: orgId }, select: { id: true, mongoId: true, firstName: true, lastName: true, employeeId: true } })
        ]);
        const projectIds = projects.flatMap(p => [p.id, p.mongoId]).filter(Boolean);
        const employeeIds = activeEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);

        console.log(`Found ${projects.length} projects, ${activeEmployees.length} employees`);

        const [
            totalTasks,
            completedTasks,
            totalEmployees,
            pendingTimesheets,
            tasksRaw
        ] = await Promise.all([
            prisma.task.count({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ] } }),
            prisma.task.count({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ], status: 'Completed' } }),
            prisma.employee.count({ where: { organizationId: orgId, status: 'Active' } }),
            prisma.timesheet.count({ where: { employeeId: { in: employeeIds }, status: 'Submitted' } }),
            prisma.task.findMany({ where: { OR: [ { projectId: { in: projectIds } }, { employeeId: { in: employeeIds } } ] } })
        ]);

        console.log(`Counts: totalTasks=${totalTasks}, completedTasks=${completedTasks}, totalEmployees=${totalEmployees}, pendingTimesheets=${pendingTimesheets}, tasksRaw=${tasksRaw.length}`);

        const averageProgress = tasksRaw.length > 0 
            ? Math.round(tasksRaw.reduce((acc, t) => {
                const td = typeof t.taskData === 'object' && t.taskData !== null ? t.taskData : {};
                return acc + (td.progress || t.progress || 0);
            }, 0) / tasksRaw.length)
            : 0;

        console.log("Avg progress calculated:", averageProgress);

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

        console.log("Project details mapped successfully");

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentEntries = await prisma.timesheetEntry.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            }
        });

        console.log(`Found ${recentEntries.length} recent timesheet entries`);

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

        console.log("Populated contributors mapped successfully");

        const recentActivityDocs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        console.log("Activity logs retrieved successfully");

        console.log("ALL SUCCESSFUL");
    } catch (e) {
        console.error("CRASHED:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
