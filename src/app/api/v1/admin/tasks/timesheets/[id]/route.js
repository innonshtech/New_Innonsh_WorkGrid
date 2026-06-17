import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';



import { logActivity } from '@/lib/logger';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const authUser = await getAuthUser();

        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const timesheet = await prisma.timesheet.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });

        if (!timesheet) return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });

        // Retrieve employee to verify organizationId
        const timesheetData = timesheet.timesheetData || {};
        const empId = timesheet.employeeId || timesheetData.employee;
        
        let timesheetOrgId = timesheetData.organizationId;
        if (!timesheetOrgId && empId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: empId }, { mongoId: empId }] }
            });
            if (emp) {
                timesheetOrgId = emp.organizationId;
            }
        }

        // Verify organization match
        let authOrgId = authUser.organizationId;
        if (!authOrgId) {
            const authEmp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }, { email: authUser.email }] }
            });
            if (authEmp) {
                authOrgId = authEmp.organizationId;
            }
        }

        if (authOrgId && timesheetOrgId && authOrgId !== timesheetOrgId) {
            const org = await prisma.organization.findUnique({ where: { id: authOrgId } });
            if (!org || (timesheetOrgId !== org.id && timesheetOrgId !== org.mongoId)) {
                return NextResponse.json({ success: false, error: 'Forbidden: Organization mismatch' }, { status: 403 });
            }
        }

        // Populate employee
        let employeeObj = null;
        if (empId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: empId }, { mongoId: empId }] }
            });
            if (emp) {
                employeeObj = {
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
            }
        }

        const formattedTimesheet = {
            id: timesheet.id,
            _id: timesheet.id,
            ...timesheet,
            ...timesheetData,
            weekStartDate: timesheet.date || timesheetData.weekStartDate || null,
            employee: employeeObj
        };

        return NextResponse.json({ success: true, timesheet: formattedTimesheet });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const authUser = await getAuthUser();

        if (!authUser) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, adminNotes, approvedBy, rejectionReason } = body;

        const timesheet = await prisma.timesheet.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });
        if (!timesheet) return NextResponse.json({ success: false, error: 'Timesheet not found' }, { status: 404 });

        // Retrieve employee to verify organizationId
        const existingTimesheetData = (timesheet.timesheetData && typeof timesheet.timesheetData === 'object') ? timesheet.timesheetData : {};
        const empId = timesheet.employeeId || existingTimesheetData.employee;
        
        let timesheetOrgId = existingTimesheetData.organizationId;
        if (!timesheetOrgId && empId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: empId }, { mongoId: empId }] }
            });
            if (emp) {
                timesheetOrgId = emp.organizationId;
            }
        }

        // Verify organization match
        let authOrgId = authUser.organizationId;
        if (!authOrgId) {
            const authEmp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }, { email: authUser.email }] }
            });
            if (authEmp) {
                authOrgId = authEmp.organizationId;
            }
        }

        if (authOrgId && timesheetOrgId && authOrgId !== timesheetOrgId) {
            const org = await prisma.organization.findUnique({ where: { id: authOrgId } });
            if (!org || (timesheetOrgId !== org.id && timesheetOrgId !== org.mongoId)) {
                return NextResponse.json({ success: false, error: 'Forbidden: Organization mismatch' }, { status: 403 });
            }
        }

        // Merge fields into timesheetData Json
        const timesheetData = {
            ...existingTimesheetData
        };

        if (status) timesheetData.status = status;
        if (adminNotes !== undefined) timesheetData.adminNotes = adminNotes;
        if (rejectionReason !== undefined) timesheetData.rejectionReason = rejectionReason;

        if (status === 'Approved') {
            timesheetData.approvedBy = approvedBy || authUser.id;
            timesheetData.approvedAt = new Date();
        }

        const updatedTimesheet = await prisma.timesheet.update({
            where: { id: timesheet.id },
            data: {
                status: status || timesheet.status,
                timesheetData
            }
        });

        // Send a notification to the employee
        try {
            const formattedDate = new Date(timesheet.weekStartDate || timesheet.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            const statusText = status === 'Approved' ? 'Approved' : 'Rejected';

            const notification = await prisma.notification.create({
                data: {
                    type: 'system',
                    title: `Timesheet ${statusText}`,
                    message: `Your timesheet for the week of ${formattedDate} has been ${statusText.toLowerCase()}${status === 'Rejected' && rejectionReason ? `: "${rejectionReason}"` : '.'}`,
                    priority: status === 'Approved' ? 'medium' : 'high',
                    audienceType: 'individual',
                    employeeId: empId,
                    organizationId: timesheetOrgId,
                    details: {
                        timesheetId: updatedTimesheet.id,
                        status: status,
                        weekStartDate: timesheet.weekStartDate || timesheet.date,
                        rejectionReason: rejectionReason || ''
                    }
                }
            });
        } catch (notiError) {
            console.error('Failed to send timesheet status update notification:', notiError);
        }

        await logActivity({
            action: status.toLowerCase(),
            entity: "Timesheet",
            entityId: updatedTimesheet.id,
            description: `${status} timesheet for week starting ${timesheet.weekStartDate || timesheet.date}`,
            req: request
        });

        return NextResponse.json({ success: true, timesheet: {
            id: updatedTimesheet.id,
            _id: updatedTimesheet.id,
            ...updatedTimesheet,
            ...timesheetData,
            weekStartDate: updatedTimesheet.date || timesheetData.weekStartDate || null
        }});
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
