import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");

        let prismaFilter = {};
        
        // SaaS PROTECTION
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

        const requests = await prisma.compOffRequest.findMany({
            where: prismaFilter,
            orderBy: { createdAt: 'desc' }
        });

        // Map for legacy
        const enrichedRequests = await Promise.all(requests.map(async req => {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: req.employeeId }, { mongoId: req.employeeId }] }
            });
            
            return {
                _id: req.id,
                employee: emp ? { ...emp, _id: emp.id } : null,
                date: req.modelData?.date,
                type: req.modelData?.type,
                days: req.modelData?.days,
                reason: req.modelData?.reason,
                status: req.status
            };
        }));

        return NextResponse.json({ success: true, requests: enrichedRequests });
    } catch (error) {
        console.error("GET Comp-Off error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const { employee, date, type, days, reason } = body;

        if (!employee || !date || !type || !days || !reason) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const targetEmployee = await prisma.employee.findFirst({
            where: { OR: [{ id: employee }, { mongoId: employee }] }
        });

        if (!targetEmployee) {
             return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // For "Use" request, check balance
        if (type === 'Use') {
            const balance = targetEmployee.modelData?.compOffBalance || 0;
            if (balance < days) {
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
                    days,
                    reason
                }
            }
        });

        const formatted = {
            _id: newRequest.id,
            employee: newRequest.employeeId,
            date: newRequest.modelData.date,
            type: newRequest.modelData.type,
            days: newRequest.modelData.days,
            reason: newRequest.modelData.reason,
            status: newRequest.status
        };

        return NextResponse.json({ success: true, request: formatted }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
