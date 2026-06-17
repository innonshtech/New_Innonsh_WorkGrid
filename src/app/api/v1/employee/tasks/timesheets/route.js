import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        let employeeId = searchParams.get('employeeId');
        const weekStartDate = searchParams.get('weekStartDate');
        const status = searchParams.get('status');

        // Enforcement: Employees can only see their own timesheets
        if (authUser.role === "employee") {
            employeeId = authUser.id;
        }

        // Robust Organization ID resolution
        let orgId = authUser.organizationId;
        if (!orgId) {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id || authUser._id }, { mongoId: authUser.id || authUser._id }] } });
            if (emp && emp.organizationId) {
                orgId = emp.organizationId.toString();
            }
        }

        const allTimesheets = await prisma.timesheet.findMany();
        
        const timesheets = allTimesheets.filter(t => {
            const data = t.timesheetData || {};
            
            if (orgId) {
                const tOrgId = data.organizationId || t.organizationId;
                if (tOrgId !== orgId) return false;
            }
            
            if (employeeId) {
                const tEmpId = t.employeeId || data.employee;
                if (tEmpId !== employeeId && tEmpId !== authUser.mongoId && tEmpId !== authUser._id) return false;
            }
            
            if (weekStartDate) {
                const effectiveDate = data.weekStartDate || t.date;
                const tWeekStart = effectiveDate ? new Date(effectiveDate).toISOString().split('T')[0] : null;
                const searchWeekStart = new Date(weekStartDate).toISOString().split('T')[0];
                if (tWeekStart !== searchWeekStart) return false;
            }
            
            if (status) {
                const tStatus = t.status || data.status;
                if (tStatus !== status) return false;
            }
            
            return true;
        }).map(t => ({
            _id: t.id,
            ...t,
            ...(t.timesheetData || {})
        }));

        // If fetching for a specific week and employee, include entries
        if (employeeId && weekStartDate && timesheets.length > 0) {
            const targetTimesheet = timesheets[0];
            const allEntries = await prisma.timesheetEntry.findMany();
            
            const entries = allEntries.filter(entry => {
                const mData = entry.modelData || {};
                return mData.timesheet === targetTimesheet._id || mData.timesheet === targetTimesheet.id || mData.timesheet === targetTimesheet.mongoId;
            }).map(entry => ({
                _id: entry.id,
                ...entry,
                ...(entry.modelData || {})
            }));

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
        const authUser = await getAuthUser();
        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await request.json();
        const { employee, weekStartDate, entries, status = 'Draft', submittedTo } = body;

        // Security Validation
        if (authUser.role === 'employee' && employee !== authUser.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Cannot log hours for other employees' }, { status: 403 });
        }

        if (!employee || !weekStartDate) {
            return NextResponse.json({ success: false, error: 'Employee and weekStartDate are required' }, { status: 400 });
        }

        // Robust Organization ID resolution
        let orgId = authUser.organizationId;
        if (!orgId) {
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id || authUser._id }, { mongoId: authUser.id || authUser._id }] } });
            if (emp && emp.organizationId) {
                orgId = emp.organizationId.toString();
            }
        }

        // 1. Find or Create Timesheet
        const allTimesheets = await prisma.timesheet.findMany({
            where: {
                employeeId: employee
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
                submittedTo: submittedTo || null,
                totalHours: 0,
                submittedAt: status === 'Submitted' ? new Date() : null
            };
            
            timesheet = await prisma.timesheet.create({
                data: {
                    employeeId: employee,
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
                submittedTo: submittedTo || (timesheet.timesheetData || {}).submittedTo || null,
                organizationId: orgId || (timesheet.timesheetData || {}).organizationId,
                submittedAt: status === 'Submitted' ? new Date() : (timesheet.timesheetData || {}).submittedAt
            };
            
            timesheet = await prisma.timesheet.update({
                where: { id: timesheet.id },
                data: {
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
            const entriesToDelete = await prisma.timesheetEntry.findMany();
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
                    employee
                };
                if (!modelData.task || modelData.task === '') {
                    delete modelData.task;
                }

                await prisma.timesheetEntry.create({
                    data: {
                        employeeId: employee,
                        organizationId: orgId,
                        modelData
                    }
                });
            }
        }

        // Create notifications on submission
        if (status === 'Submitted') {
            const formattedDate = new Date(weekStartDate).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const employeeDetails = await prisma.employee.findFirst({ where: { OR: [{ id: employee }, { mongoId: employee }] } });
            const employeeName = employeeDetails 
                ? `${employeeDetails.personalDetails?.firstName || employeeDetails.firstName} ${employeeDetails.personalDetails?.lastName || employeeDetails.lastName}`
                : authUser.name || 'An employee';

            // 1. Notify the selected manager (individual notification)
            if (submittedTo) {
                try {
                    await prisma.notificationConfig.create({
                        data: {
                            employeeId: submittedTo,
                            configData: {
                                type: 'system',
                                title: 'Timesheet Submitted for Approval',
                                message: `${employeeName} has submitted their timesheet for the week of ${formattedDate} for your approval.`,
                                priority: 'medium',
                                audienceType: 'individual',
                                employee: submittedTo,
                                organization: authUser.organizationId,
                                details: {
                                    timesheetId: updatedTimesheet.id,
                                    employeeId: employee,
                                    weekStartDate: weekStartDate
                                }
                            }
                        }
                    });
                } catch (notiError) {
                    console.error('Failed to save manager timesheet notification:', notiError);
                }
            }

            // 2. Notify the organization admins (organization audience)
            try {
                await prisma.notificationConfig.create({
                    data: {
                        employeeId: null,
                        configData: {
                            type: 'system',
                            title: 'New Timesheet Submission',
                            message: `${employeeName} has submitted their timesheet for the week of ${formattedDate}.`,
                            priority: 'medium',
                            audienceType: 'organization',
                            organization: authUser.organizationId,
                            details: {
                                timesheetId: updatedTimesheet.id,
                                employeeId: employee,
                                weekStartDate: weekStartDate
                            }
                        }
                    }
                });
            } catch (notiError) {
                console.error('Failed to save admin timesheet notification:', notiError);
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
