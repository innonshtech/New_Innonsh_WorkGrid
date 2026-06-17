import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";

export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, effectiveDate, reason, comments, updatedBy, ...details } = body;

        if (!action || !effectiveDate) {
            return NextResponse.json(
                { error: "Action and Effective Date are required" },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const previousDetails = {
            designation: employee.designation,
            departmentId: employee.departmentId,
            businessUnitId: employee.businessUnitId,
            reportingManager: employee.reportingManager,
            salary: (employee.payslipStructure || {}).grossSalary,
        };

        let prismaUpdateData = {};
        let statusUpdate = employee.status;

        switch (action) {
            case "Promotion":
                if (details.designation) prismaUpdateData.designation = details.designation;
                if (details.grossSalary) {
                    const existingPayslip = employee.payslipStructure || {};
                    prismaUpdateData.payslipStructure = {
                        ...existingPayslip,
                        grossSalary: details.grossSalary
                    };
                }
                break;

            case "Transfer":
                if (details.departmentId) prismaUpdateData.departmentId = details.departmentId;
                if (details.businessUnitId) prismaUpdateData.businessUnitId = details.businessUnitId;
                if (details.teamId) prismaUpdateData.teamId = details.teamId;
                if (details.workLocation) prismaUpdateData.workLocation = details.workLocation;
                if (details.reportingManager) prismaUpdateData.reportingManager = details.reportingManager;
                break;

            case "Exit":
                statusUpdate = "Terminated"; // or Inactive
                break;

            default:
                return NextResponse.json({ error: "Invalid lifecycle action" }, { status: 400 });
        }

        // Update Employee
        const updatedEmployee = await prisma.employee.update({
            where: { id: employee.id },
            data: {
                ...prismaUpdateData,
                status: statusUpdate,
                updatedById: updatedBy || null,
                updatedAt: new Date()
            }
        });

        const newDetails = {
            designation: updatedEmployee.designation,
            departmentId: updatedEmployee.departmentId,
            businessUnitId: updatedEmployee.businessUnitId,
            reportingManager: updatedEmployee.reportingManager,
            salary: (updatedEmployee.payslipStructure || {}).grossSalary,
        };

        // Create History Record in Prisma
        const history = await prisma.employmentHistory.create({
            data: {
                employeeId: employee.id,
                organizationId: employee.organizationId,
                status: "Active",
                modelData: {
                    action,
                    effectiveDate: new Date(effectiveDate),
                    previousDetails,
                    newDetails,
                    reason,
                    comments,
                    updatedBy: updatedBy || null
                }
            }
        });

        await logActivity({
            action: "lifecycle_event",
            entity: "Employee",
            entityId: employee.employeeId,
            description: `${action} processed for employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
            performedBy: { userId: updatedBy },
            details: { action, historyId: history.id },
            req: request
        });

        return NextResponse.json({
            message: `${action} processed successfully`,
            employee: updatedEmployee,
            history: {
                id: history.id,
                employeeId: history.employeeId,
                createdAt: history.createdAt,
                updatedAt: history.updatedAt,
                ...(history.modelData || {})
            }
        });

    } catch (error) {
        console.error("Lifecycle POST error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET history for an employee
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: id }, { mongoId: id }] }
        });

        if (!employee) {
            return NextResponse.json([]);
        }

        const history = await prisma.employmentHistory.findMany({
            where: { employeeId: employee.id }
        });

        const flattenedHistory = history.map(h => ({
            id: h.id,
            employeeId: h.employeeId,
            createdAt: h.createdAt,
            updatedAt: h.updatedAt,
            ...(h.modelData || {})
        }));

        return NextResponse.json(flattenedHistory);
    } catch (error) {
        console.error("Lifecycle GET error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
