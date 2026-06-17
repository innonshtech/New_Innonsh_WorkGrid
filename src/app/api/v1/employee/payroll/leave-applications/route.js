import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET leave applications
export async function GET(request) {
    try {
        const authUser = await getAuthUser();

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");

        let prismaFilter = {};
        
        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({ 
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            prismaFilter.employeeId = { in: empIds };
        } else if (authUser.role === "employee") {
            prismaFilter.employeeId = authUser.id; // Or mongoId
        }

        if (employeeId && authUser.role !== "employee") {
            if (prismaFilter.employeeId && prismaFilter.employeeId.in) {
                if (prismaFilter.employeeId.in.includes(employeeId)) prismaFilter.employeeId = employeeId;
                else prismaFilter.employeeId = { in: [] };
            } else {
                prismaFilter.employeeId = employeeId;
            }
        }

        if (status) prismaFilter.status = status;

        const applications = await prisma.leaveApplication.findMany({
            where: prismaFilter,
            orderBy: { createdAt: 'desc' }
        });

        // Resolve relations for legacy UI mapping
        const enrichedApplications = await Promise.all(applications.map(async app => {
            if (!app.employeeId) return null;
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: app.employeeId }, { mongoId: app.employeeId }] },
                select: { id: true, mongoId: true, firstName: true, lastName: true, email: true, employeeId: true }
            });

            let approvedByDetails = null;
            if (app.modelData?.approvedBy) {
                approvedByDetails = await prisma.user.findFirst({
                    where: { OR: [{ id: app.modelData.approvedBy }, { mongoId: app.modelData.approvedBy }] },
                    select: { name: true, email: true }
                });
            }

            return {
                _id: app.id,
                employee: emp ? {
                    id: emp.id,
                    mongoId: emp.mongoId,
                    _id: emp.id,
                    employeeId: emp.employeeId,
                    personalDetails: {
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email
                    }
                } : null,
                leaveType: app.modelData?.leaveType,
                startDate: app.modelData?.startDate,
                endDate: app.modelData?.endDate,
                totalDays: app.modelData?.totalDays,
                reason: app.modelData?.reason,
                contactNumber: app.modelData?.contactNumber,
                addressDuringLeave: app.modelData?.addressDuringLeave,
                isAdvanceLeave: app.modelData?.isAdvanceLeave,
                attachments: app.modelData?.attachments || [],
                approvedBy: approvedByDetails,
                status: app.status,
                createdAt: app.createdAt
            };
        }));

        return NextResponse.json({ applications: enrichedApplications.filter(Boolean) });
    } catch (error) {
        console.error("Error in GET /api/payroll/leave-applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// SUBMIT a new leave application
export async function POST(request) {
    try {
        const authUser = await getAuthUser();

        const body = await request.json();
        const {
            employeeId,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
            contactNumber,
            addressDuringLeave,
            isAdvanceLeave,
            attachments
        } = body;

        if (!employeeId || !leaveType || !startDate || !endDate || !totalDays || !reason) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const application = await prisma.leaveApplication.create({
            data: {
                employeeId: employee.id,
                organizationId: employee.organizationId,
                status: "Pending",
                modelData: {
                    leaveType,
                    startDate,
                    endDate,
                    totalDays,
                    reason,
                    contactNumber,
                    addressDuringLeave,
                    isAdvanceLeave,
                    attachments: attachments || []
                }
            }
        });

        // Log activity
        await logActivity({
            action: "created",
            entity: "LeaveApplication",
            entityId: application.id,
            description: `New leave application from ${employee.firstName || 'Employee'} (${totalDays} days)`,
            performedBy: {
                userId: employeeId,
                name: `${employee.firstName} ${employee.lastName}`
            },
            req: request
        });

        const formatted = {
            _id: application.id,
            employee: application.employeeId,
            leaveType: application.modelData.leaveType,
            startDate: application.modelData.startDate,
            endDate: application.modelData.endDate,
            totalDays: application.modelData.totalDays,
            reason: application.modelData.reason,
            contactNumber: application.modelData.contactNumber,
            addressDuringLeave: application.modelData.addressDuringLeave,
            isAdvanceLeave: application.modelData.isAdvanceLeave,
            attachments: application.modelData.attachments,
            status: application.status
        };

        return NextResponse.json(formatted, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/payroll/leave-applications:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
