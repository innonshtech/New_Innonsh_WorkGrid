import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-util";

const careerPathSchema = z.object({
    employeeId: z.string(),
    currentDesignation: z.string(),
    targetDesignation: z.string(),
    milestones: z.array(z.object({
        title: z.string(),
        status: z.enum(['Planned', 'In Progress', 'Achieved']),
        date: z.string().optional().nullable(),
    })),
});

const isUUID = (val) => typeof val === 'string' && val.length === 36 && val.includes('-');

// Helper to format career path output
function formatCareerPath(cp, empMap) {
    if (!cp) return null;
    const mData = cp.modelData && typeof cp.modelData === 'object' ? cp.modelData : {};
    return {
        _id: cp.id,
        id: cp.id,
        employeeId: cp.employeeId,
        organizationId: cp.organizationId,
        status: cp.status || "Active",
        createdAt: cp.createdAt,
        updatedAt: cp.updatedAt,
        employee: empMap[cp.employeeId] || (cp.employeeId ? { _id: cp.employeeId, id: cp.employeeId } : null),
        // Flatten modelData
        currentDesignation: mData.currentDesignation || "",
        targetDesignation: mData.targetDesignation || "",
        milestones: mData.milestones || []
    };
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeIdParam = searchParams.get('employeeId');

        let filter = {};

        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const allowedIds = orgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
            filter.employeeId = { in: allowedIds };
        } else if (authUser.role === "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
            });
            if (emp) filter.employeeId = emp.id;
            else filter.employeeId = 'none';
        }

        if (!employeeIdParam) {
            const careerPathsList = await prisma.careerPath.findMany({
                where: filter
            });

            // Resolve employees in batch
            const empIds = [...new Set(careerPathsList.map(cp => cp.employeeId).filter(Boolean))];
            const employees = await prisma.employee.findMany({
                where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, designation: true }
            });

            const empMap = {};
            employees.forEach(e => {
                const data = {
                    _id: e.id,
                    id: e.id,
                    employeeId: e.employeeId,
                    personalDetails: {
                        firstName: e.firstName,
                        lastName: e.lastName
                    },
                    jobDetails: {
                        designation: e.designation
                    }
                };
                empMap[e.id] = data;
                if (e.mongoId) empMap[e.mongoId] = data;
            });

            const careerPaths = careerPathsList.map(cp => formatCareerPath(cp, empMap));

            return NextResponse.json({ careerPaths });
        }

        // Resolve single employee
        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeIdParam }, { mongoId: employeeIdParam }] },
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, designation: true, organizationId: true }
        });

        if (!employee) {
            return NextResponse.json({ careerPath: null });
        }

        // Check bounds
        if (filter.employeeId && filter.employeeId.in) {
            if (!filter.employeeId.in.includes(employee.id)) {
                return NextResponse.json({ careerPath: null });
            }
        } else if (filter.employeeId && filter.employeeId !== employee.id) {
            return NextResponse.json({ careerPath: null });
        }

        const cpRecord = await prisma.careerPath.findFirst({
            where: { employeeId: employee.id },
        });

        const empMap = {};
        const empData = {
            _id: employee.id,
            id: employee.id,
            employeeId: employee.employeeId,
            personalDetails: {
                firstName: employee.firstName,
                lastName: employee.lastName
            },
            jobDetails: {
                designation: employee.designation
            }
        };
        empMap[employee.id] = empData;
        if (employee.mongoId) empMap[employee.mongoId] = empData;

        const careerPath = formatCareerPath(cpRecord, empMap);

        return NextResponse.json({ careerPath });
    } catch (error) {
        console.error("Error in GET /api/talent/career-path:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const validatedData = careerPathSchema.parse(body);

        // Resolve employee
        const employee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: validatedData.employeeId }, { mongoId: validatedData.employeeId }],
            },
            select: { id: true, organizationId: true },
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found." }, { status: 404 });
        }

        // Find existing career path for employee manually to avoid non-unique column crashes in upsert
        const existing = await prisma.careerPath.findFirst({
            where: { employeeId: employee.id }
        });

        const careerPathData = {
            currentDesignation: validatedData.currentDesignation,
            targetDesignation: validatedData.targetDesignation,
            milestones: validatedData.milestones,
        };

        let resultRecord;

        if (existing) {
            resultRecord = await prisma.careerPath.update({
                where: { id: existing.id },
                data: {
                    modelData: careerPathData
                }
            });
        } else {
            resultRecord = await prisma.careerPath.create({
                data: {
                    employeeId: employee.id,
                    organizationId: employee.organizationId || null,
                    status: "Active",
                    modelData: careerPathData
                }
            });
        }

        // Format and return
        const responseData = {
            _id: resultRecord.id,
            id: resultRecord.id,
            employeeId: resultRecord.employeeId,
            organizationId: resultRecord.organizationId,
            status: resultRecord.status,
            createdAt: resultRecord.createdAt,
            updatedAt: resultRecord.updatedAt,
            // Flatten values
            currentDesignation: careerPathData.currentDesignation,
            targetDesignation: careerPathData.targetDesignation,
            milestones: careerPathData.milestones
        };

        return NextResponse.json({ careerPath: responseData, message: "Career path updated successfully" });
    } catch (error) {
        console.error("Error in POST /api/talent/career-path:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
