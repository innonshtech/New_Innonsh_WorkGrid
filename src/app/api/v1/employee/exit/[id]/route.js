import prisma from '@/lib/db/prisma';

import { NextResponse } from "next/server";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function getPopulatedEmployee(employeeId) {
    if (!employeeId) return null;
    const emp = await prisma.employee.findFirst({
        where: isValidUUID(employeeId)
            ? { OR: [{ id: employeeId }, { mongoId: employeeId }] }
            : { mongoId: employeeId },
        select: { id: true, mongoId: true, firstName: true, lastName: true, email: true, department: true, designation: true }
    });
    if (!emp) return null;
    return {
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
}

export async function GET(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["employee"]);

        
        const { id } = await params;

        const exitRequest = await prisma.exitRequest.findFirst({
            where: {
                AND: [
                    isValidUUID(id) ? { OR: [{ id: id }, { mongoId: id }] } : { mongoId: id },
                    { employeeId: authUser.id }
                ]
            }
        });

        if (!exitRequest) {
            return NextResponse.json({ error: "Exit request not found" }, { status: 404 });
        }

        const employeeData = await getPopulatedEmployee(exitRequest.employeeId);
        const exitData = exitRequest.exitData || {};
        return NextResponse.json({ ...exitRequest, ...exitData, _id: exitRequest.id, employee: employeeData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
