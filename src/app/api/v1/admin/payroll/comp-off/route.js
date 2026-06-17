import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "supervisor"]);
        
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");

        let prismaFilter = {};

        // SaaS PROTECTION: Admin/Supervisor can only see their organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const orgEmpIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            prismaFilter.employeeId = { in: orgEmpIds };
        }

        if (employeeId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(employeeId);
            if (prismaFilter.employeeId && prismaFilter.employeeId.in) {
                const isAllowed = prismaFilter.employeeId.in.includes(employeeId);
                prismaFilter.employeeId = isAllowed ? employeeId : { in: [] };
            } else {
                prismaFilter.employeeId = employeeId;
            }
        }

        if (status) {
            prismaFilter.status = status;
        }

        const requests = await prisma.compOffRequest.findMany({
            where: prismaFilter,
            orderBy: { createdAt: 'desc' }
        });

        // Enrich requests with employee details and flatten modelData
        const empIds = [...new Set(requests.map(r => r.employeeId).filter(Boolean))];
        const employees = empIds.length > 0 ? await prisma.employee.findMany({
            where: { id: { in: empIds } },
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true }
        }) : [];

        const empMap = new Map();
        employees.forEach(emp => {
            empMap.set(emp.id, {
                _id: emp.id,
                id: emp.id,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone
                }
            });
        });

        const enrichedRequests = requests.map(r => {
            const data = r.modelData && typeof r.modelData === 'object' ? r.modelData : {};
            return {
                _id: r.id,
                id: r.id,
                employeeId: r.employeeId,
                organizationId: r.organizationId,
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                ...data,
                employee: empMap.get(r.employeeId) || null
            };
        });

        return NextResponse.json({ success: true, requests: enrichedRequests });
    } catch (error) {
        console.error("❌ GET Admin Comp-Off Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await request.json();
        const { employee, date, type, days, reason } = body;

        if (!employee || !date || !type || !days || !reason) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(employee);
        const targetEmployee = await prisma.employee.findFirst({
            where: isUuid ? { OR: [{ id: employee }, { mongoId: employee }] } : { mongoId: employee }
        });

        if (!targetEmployee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // SaaS PROTECTION: Admin must use their assigned organizationId
        if (authUser.role === "admin" && targetEmployee.organizationId !== authUser.organizationId) {
            return NextResponse.json({ success: false, error: "Forbidden: Employee is not in your organization" }, { status: 403 });
        }

        // For "Use" request, check balance
        if (type === 'Use') {
            if ((targetEmployee.compOffBalance || 0) < days) {
                return NextResponse.json({ success: false, error: "Insufficient C-Off balance" }, { status: 400 });
            }
        }

        const newRequest = await prisma.compOffRequest.create({
            data: {
                employeeId: targetEmployee.id,
                organizationId: targetEmployee.organizationId,
                status: 'Pending',
                modelData: {
                    date,
                    type,
                    days: parseFloat(days),
                    reason
                }
            }
        });

        const formatted = {
            _id: newRequest.id,
            id: newRequest.id,
            employeeId: newRequest.employeeId,
            status: newRequest.status,
            createdAt: newRequest.createdAt,
            updatedAt: newRequest.updatedAt,
            date,
            type,
            days: parseFloat(days),
            reason
        };

        return NextResponse.json({ success: true, request: formatted }, { status: 201 });
    } catch (error) {
        console.error("❌ POST Admin Comp-Off Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
