import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser } from '@/lib/auth-util';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const weekStartDate = searchParams.get('weekStartDate');
        const status = searchParams.get('status');
        const submittedTo = searchParams.get('submittedTo');

        // Robust Organization ID resolution
        let orgId = authUser.organizationId;
        if (!orgId) {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id || authUser._id }, { mongoId: authUser.id || authUser._id }] } });
            if (emp && emp.organizationId) {
                orgId = emp.organizationId.toString();
            }
        }

        let orgMongoId = null;
        if (orgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                orgMongoId = org.mongoId;
                orgId = org.id; // Ensure it is the UUID primary key
            }
        }

        // Resolve employee ID to support both UUID and MongoID matching
        let resolvedEmployeeId = employeeId;
        let employeeMongoId = null;
        if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true, mongoId: true }
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
                employeeMongoId = emp.mongoId;
            }
        }

        // Fetch all timesheets and filter in memory since organizationId, weekStartDate, etc are nested in Json timesheetData
        const allTimesheets = await prisma.timesheet.findMany();
        
        const filteredTimesheets = allTimesheets.filter(t => {
            const data = t.timesheetData || {};
            
            if (orgId) {
                const tOrgId = data.organizationId || t.organizationId;
                if (tOrgId !== orgId && tOrgId !== orgMongoId) return false;
            }
            
            if (employeeId) {
                const tEmpId = t.employeeId || data.employee;
                if (tEmpId !== resolvedEmployeeId && tEmpId !== employeeMongoId && tEmpId !== employeeId) return false;
            }
            
            if (weekStartDate) {
                const actualWeekStart = t.date || data.weekStartDate;
                if (!actualWeekStart) return false;
                
                // Compare using timestamp difference to avoid off-by-one timezone issues (allow 24 hour tolerance)
                const diffMs = Math.abs(new Date(actualWeekStart).getTime() - new Date(weekStartDate).getTime());
                if (diffMs > 24 * 60 * 60 * 1000) return false;
            }
            
            if (status) {
                const tStatus = t.status || data.status;
                if (tStatus !== status) return false;
            }
            
            if (submittedTo) {
                if (submittedTo === 'null') {
                    if (data.submittedTo !== null && data.submittedTo !== undefined) return false;
                } else {
                    if (data.submittedTo !== submittedTo) return false;
                }
            }
            
            return true;
        });

        // Fetch all employees in organization to map them quickly
        const employees = await prisma.employee.findMany({
            where: { organizationId: orgId }
        });

        const employeeMap = {};
        employees.forEach(emp => {
            const empData = {
                id: emp.id,
                _id: emp.id,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone
                },
                jobDetails: {
                    designation: emp.designation,
                    department: emp.department
                }
            };
            employeeMap[emp.id] = empData;
            if (emp.mongoId) {
                employeeMap[emp.mongoId] = empData;
            }
        });

        const timesheets = filteredTimesheets.map(t => {
            const data = t.timesheetData || {};
            const empId = t.employeeId || data.employee;
            const employee = employeeMap[empId] || null;

            const submittedToId = data.submittedTo;
            const submittedTo = employeeMap[submittedToId] || null;

            const weekStartDate = t.date || data.weekStartDate || null;

            return {
                id: t.id,
                _id: t.id,
                ...t,
                ...data,
                totalHours: t.hours || data.totalHours || 0,
                weekStartDate,
                employee,
                submittedTo
            };
        });

        // If fetching for a specific week and employee, include entries
        if (employeeId && weekStartDate && timesheets.length > 0) {
            const targetTimesheet = timesheets[0];
            const allEntries = await prisma.timesheetEntry.findMany();
            
            // Fetch projects to map project names
            const projects = await prisma.project.findMany({
                where: { organizationId: orgId }
            });
            const projectMap = {};
            projects.forEach(proj => {
                projectMap[proj.id] = proj;
                if (proj.mongoId) {
                    projectMap[proj.mongoId] = proj;
                }
            });

            const entries = allEntries.filter(entry => {
                const mData = entry.modelData || {};
                return mData.timesheet === targetTimesheet.id || mData.timesheet === targetTimesheet.mongoId || mData.timesheet === targetTimesheet._id;
            }).map(entry => {
                const mData = entry.modelData || {};
                const projId = mData.project;
                const proj = projectMap[projId] || null;
                
                return {
                    id: entry.id,
                    _id: entry.id,
                    ...entry,
                    ...mData,
                    project: proj ? {
                        id: proj.id,
                        _id: proj.id,
                        name: proj.name
                    } : projId
                };
            });

            return NextResponse.json({
                success: true,
                timesheet: targetTimesheet,
                entries
            }, {
                headers: {
                    'Cache-Control': 'no-store, max-age=0, must-revalidate'
                }
            });
        }

        return NextResponse.json({ success: true, timesheets }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate'
            }
        });
    } catch (error) {
        console.error("Error in GET /api/v1/admin/tasks/timesheets:", error);
        return NextResponse.json({ success: false, error: error.message }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate'
            }
        });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { employee, weekStartDate, entries, status = 'Draft' } = body;

        if (!employee || !weekStartDate) {
            return NextResponse.json({ success: false, error: 'Employee and weekStartDate are required' }, { status: 400 });
        }

        // Resolve Employee UUID
        const dbEmployee = await prisma.employee.findFirst({
            where: { OR: [{ id: employee }, { mongoId: employee }] }
        });
        if (!dbEmployee) {
            return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
        }
        const resolvedEmployeeId = dbEmployee.id;

        // Robust Organization ID resolution
        let orgId = authUser.organizationId;
        if (!orgId) {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id || authUser._id }, { mongoId: authUser.id || authUser._id }] } });
            if (emp && emp.organizationId) {
                orgId = emp.organizationId.toString();
            }
        }

        // 1. Find or Create Timesheet using resolved ID and mongoId check
        const allTimesheets = await prisma.timesheet.findMany({
            where: {
                employeeId: { in: [resolvedEmployeeId, dbEmployee.mongoId].filter(Boolean) }
            }
        });
        
        let timesheet = allTimesheets.find(t => {
            const data = t.timesheetData || {};
            const tDate = data.weekStartDate ? new Date(data.weekStartDate).toISOString().split('T')[0] : null;
            const searchDate = new Date(weekStartDate).toISOString().split('T')[0];
            return tDate === searchDate;
        });

        let updatedTimesheet;

        if (!timesheet) {
            const timesheetData = {
                organizationId: orgId,
                weekStartDate: new Date(weekStartDate),
                status,
                totalHours: 0,
                submittedAt: status === 'Submitted' ? new Date() : null,
                employee: resolvedEmployeeId
            };
            
            timesheet = await prisma.timesheet.create({
                data: {
                    employeeId: resolvedEmployeeId,
                    status,
                    timesheetData
                }
            });
            updatedTimesheet = timesheet;
        } else {
            if (timesheet.status === 'Approved') {
                return NextResponse.json({ success: false, error: 'Cannot edit an approved timesheet' }, { status: 400 });
            }
            
            const timesheetData = {
                ...(timesheet.timesheetData || {}),
                status,
                organizationId: orgId || (timesheet.timesheetData || {}).organizationId,
                submittedAt: status === 'Submitted' ? new Date() : (timesheet.timesheetData || {}).submittedAt,
                employee: resolvedEmployeeId
            };
            
            timesheet = await prisma.timesheet.update({
                where: { id: timesheet.id },
                data: {
                    employeeId: resolvedEmployeeId,
                    status,
                    timesheetData
                }
            });
            updatedTimesheet = timesheet;
        }

        // 2. Handle Entries
        if (entries && Array.isArray(entries)) {
            const totalHours = entries.reduce((acc, entry) => acc + (parseFloat(entry.hours) || 0), 0);
            
            const timesheetData = {
                ...(updatedTimesheet.timesheetData || {}),
                totalHours,
                submittedAt: status === 'Submitted' ? new Date() : (updatedTimesheet.timesheetData || {}).submittedAt
            };
            
            updatedTimesheet = await prisma.timesheet.update({
                where: { id: updatedTimesheet.id },
                data: {
                    hours: totalHours,
                    timesheetData
                }
            });

            // Delete existing entries
            const entriesToDelete = await prisma.timesheetEntry.findMany({
                where: {
                    employeeId: { in: [resolvedEmployeeId, dbEmployee.mongoId].filter(Boolean) }
                }
            });
            const matchingEntryIds = entriesToDelete.filter(e => {
                const mData = e.modelData || {};
                return mData.timesheet === updatedTimesheet.id || mData.timesheet === updatedTimesheet.mongoId;
            }).map(e => e.id);

            if (matchingEntryIds.length > 0) {
                await prisma.timesheetEntry.deleteMany({
                    where: {
                        id: { in: matchingEntryIds }
                    }
                });
            }

            // Create new entries
            for (const entry of entries) {
                const projectId = entry.project && typeof entry.project === 'object'
                    ? (entry.project._id || entry.project.id || entry.project)
                    : entry.project;

                const taskId = entry.task && typeof entry.task === 'object'
                    ? (entry.task._id || entry.task.id || entry.task)
                    : entry.task;

                const modelData = {
                    ...entry,
                    project: projectId,
                    task: taskId,
                    timesheet: updatedTimesheet.id,
                    employee: resolvedEmployeeId
                };
                if (!modelData.task || modelData.task === '') {
                    delete modelData.task;
                }

                await prisma.timesheetEntry.create({
                    data: {
                        employeeId: resolvedEmployeeId,
                        organizationId: orgId,
                        modelData
                    }
                });
            }
        }

        await logActivity({
            action: status === 'Submitted' ? 'submitted' : 'saved',
            entity: "Timesheet",
            entityId: updatedTimesheet.id,
            description: `${status === 'Submitted' ? 'Submitted' : 'Saved Draft'} timesheet for week starting ${weekStartDate}`,
            req: request
        });

        return NextResponse.json({
            success: true,
            timesheet: {
                _id: updatedTimesheet.id,
                ...updatedTimesheet,
                ...(updatedTimesheet.timesheetData || {})
            }
        });
    } catch (error) {
        console.error('Timesheet POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
