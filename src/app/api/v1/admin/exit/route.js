import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";
import prisma from "@/lib/db/prisma";

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employee");
        const status = searchParams.get("status");

        let query = {};
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            // Future-proofing for SaaS scope
        }
        if (employeeId) {
            query.OR = [
                { employeeId: employeeId },
                { mongoId: employeeId }
            ];
        }
        if (status) query.status = status;

        const requestsDocs = await prisma.exitRequest.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });

        // Manually populate employee
        const employeeIds = [...new Set(requestsDocs.map(r => r.employeeId).filter(Boolean))];
        const validUUIDEmployeeIds = employeeIds.filter(isValidUUID);
        const employees = await prisma.employee.findMany({
            where: { OR: [{ id: { in: validUUIDEmployeeIds } }, { mongoId: { in: employeeIds } }] },
            select: { id: true, mongoId: true, firstName: true, lastName: true, email: true, department: true, designation: true }
        });

        const employeeMap = {};
        employees.forEach(emp => {
            const empData = {
                _id: emp.id,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email
                },
                jobDetails: {
                    department: emp.department,
                    designation: emp.designation
                }
            };
            employeeMap[emp.id] = empData;
            if (emp.mongoId) employeeMap[emp.mongoId] = empData;
        });

        const requests = requestsDocs.map(req => ({
            _id: req.id,
            id: req.id,
            employee: employeeMap[req.employeeId] || null,
            status: req.status,
            resignationDate: req.resignationDate,
            lastWorkingDate: req.lastWorkingDate,
            reason: req.reason,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            ...(typeof req.exitData === 'object' && req.exitData !== null ? req.exitData : {})
        }));

        return NextResponse.json(requests);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const body = await request.json();

        if (!body.employee || !body.resignationDate || !body.lastWorkingDate || !body.reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if pending request exists
        const existing = await prisma.exitRequest.findFirst({
            where: {
                employeeId: body.employee,
                status: { in: ["Pending", "Manager_Approved", "HR_Approved"] }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "A pending resignation request already exists for this employee." }, { status: 400 });
        }

        const { _id, employee, resignationDate, lastWorkingDate, reason, status, ...exitData } = body;

        const exitRequest = await prisma.exitRequest.create({
            data: {
                employeeId: employee,
                resignationDate: new Date(resignationDate),
                lastWorkingDate: new Date(lastWorkingDate),
                reason: reason,
                status: status || "Pending",
                exitData: exitData
            }
        });

        return NextResponse.json({
            ...exitRequest,
            _id: exitRequest.id
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
