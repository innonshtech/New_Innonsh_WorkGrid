import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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
                where: {
                    OR: [
                        ...(isValidUUID(authUser.organizationId) ? [{ organizationId: authUser.organizationId }] : []),
                        { organization: { mongoId: authUser.organizationId } }
                    ]
                },
                select: { id: true, mongoId: true }
            });
            const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            prismaFilter.employeeId = { in: empIds };
        } else if (authUser.role === "employee") {
            prismaFilter.employeeId = authUser.id;
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

        const requests = await prisma.overtimeRequest.findMany({
            where: prismaFilter,
            orderBy: { createdAt: 'desc' }
        });

        // Resolve relations manually for legacy support
        const config = await prisma.payrollConfig.findFirst({
            where: isValidUUID(authUser.organizationId)
                ? { OR: [{ companyId: authUser.organizationId }, { mongoId: authUser.organizationId }] }
                : { mongoId: authUser.organizationId }
        });

        const enrichedRequests = await Promise.all(requests.map(async req => {
            const emp = await prisma.employee.findFirst({
                where: isValidUUID(req.employeeId)
                    ? { OR: [{ id: req.employeeId }, { mongoId: req.employeeId }] }
                    : { mongoId: req.employeeId }
            });

            let earnedAmount = 0;
            const hours = req.modelData?.hours || 0;
            
            if (config && emp) {
                let rate = 0;
                if (config.overtimeCalculationType === 'Fixed') {
                    rate = config.overtimeRate || 0;
                } else {
                    const basic = emp.payslipStructure?.basicSalary || 0;
                    const days = config.workingDaysPerMonth || 26;
                    const hrs = emp.workingHr || 9;
                    rate = (basic / days / hrs) * (config.overtimeRate || 1.5);
                }
                earnedAmount = Math.round(hours * rate);
            }

            const employeeMapped = emp ? {
                _id: emp.id,
                id: emp.id,
                mongoId: emp.mongoId,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone
                },
                jobDetails: {
                    department: emp.department,
                    designation: emp.designation,
                    organizationId: emp.organizationId
                }
            } : null;

            return {
                _id: req.id,
                employee: employeeMapped,
                date: req.modelData?.date,
                hours: hours,
                reason: req.modelData?.reason,
                status: req.status,
                earnedAmount
            };
        }));

        return NextResponse.json({ success: true, requests: enrichedRequests });
    } catch (error) {
        console.error("GET Overtime error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        const body = await request.json();
        const { employee, date, hours, reason } = body;

        if (!employee || !date || !hours || !reason) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (hours <= 0 || hours > 24) {
            return NextResponse.json({ success: false, error: "Hours must be between 1 and 24" }, { status: 400 });
        }

        const targetEmployee = await prisma.employee.findFirst({
            where: isValidUUID(employee)
                ? { OR: [{ id: employee }, { mongoId: employee }] }
                : { mongoId: employee }
        });

        if (!targetEmployee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        if (authUser.role === "admin" || authUser.role === "supervisor") {
            if (authUser.role === "admin" && targetEmployee.organizationId !== authUser.organizationId) {
                return NextResponse.json({ success: false, error: "Forbidden: Employee not in your organization" }, { status: 403 });
            }
        }

        const newRequest = await prisma.overtimeRequest.create({
            data: {
                employeeId: targetEmployee.id,
                organizationId: targetEmployee.organizationId,
                status: 'Pending',
                modelData: {
                    date,
                    hours,
                    reason
                }
            }
        });

        const formatted = {
            _id: newRequest.id,
            employee: newRequest.employeeId,
            date: newRequest.modelData.date,
            hours: newRequest.modelData.hours,
            reason: newRequest.modelData.reason,
            status: newRequest.status
        };

        return NextResponse.json({ success: true, request: formatted }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
