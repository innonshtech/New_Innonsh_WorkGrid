import prisma from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["employee"]);

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where = { employeeId: authUser.id };
        if (status) where.status = status;

        const requests = await prisma.exitRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const emp = await prisma.employee.findFirst({
            where: isValidUUID(authUser.id)
                ? { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
                : { mongoId: authUser.id },
            select: { id: true, mongoId: true, firstName: true, lastName: true, email: true, department: true, designation: true }
        });

        const employeeData = emp ? {
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
        } : null;

        const populatedRequests = requests.map(req => ({
            _id: req.id,
            id: req.id,
            employee: employeeData,
            status: req.status,
            resignationDate: req.resignationDate,
            lastWorkingDate: req.lastWorkingDate,
            reason: req.reason,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            ...(typeof req.exitData === 'object' && req.exitData !== null ? req.exitData : {})
        }));

        return NextResponse.json(populatedRequests);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["employee"]);

        const body = await request.json();

        // Always force the employee ID to be the logged-in user
        const employeeId = authUser.id;

        if (!body.resignationDate || !body.lastWorkingDate || !body.reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if pending request exists
        const existing = await prisma.exitRequest.findFirst({
            where: {
                employeeId: employeeId,
                status: { in: ["Pending", "Manager_Approved", "HR_Approved"] }
            }
        });

        if (existing) {
            return NextResponse.json({ error: "A pending resignation request already exists for this employee." }, { status: 400 });
        }

        const exitRequest = await prisma.exitRequest.create({
            data: {
                employeeId: employeeId,
                resignationDate: new Date(body.resignationDate),
                lastWorkingDate: new Date(body.lastWorkingDate),
                reason: body.reason,
                status: "Pending",
                exitData: body // Store any additional fields dynamically
            }
        });
        return NextResponse.json(exitRequest, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
