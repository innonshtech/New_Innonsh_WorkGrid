import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { resolveOrgIds } from "@/lib/utils/flatten-model";

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get("organizationId");
        const employeeId = searchParams.get("employeeId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const filter = {};
        
        // SaaS PROTECTION: Restrict by organization
        let targetOrgId = null;
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            targetOrgId = authUser.organizationId;
        } else if (authUser.role === "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }, { employeeId: authUser.employeeId }] },
                select: { id: true, mongoId: true }
            });
            if (emp) {
                filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            } else {
                filter.employeeId = authUser.id;
            }
        } else if (authUser.role === "super_admin" && organizationId) {
            targetOrgId = organizationId;
        }

        if (targetOrgId) {
            const orgIds = await resolveOrgIds(targetOrgId);
            filter.OR = orgIds.map(id => ({
                shiftData: {
                    path: ['organizationId'],
                    equals: id
                }
            }));
        }

        if (employeeId && authUser.role !== "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true, mongoId: true }
            });
            if (emp) {
                filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            } else {
                filter.employeeId = employeeId;
            }
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.gte = new Date(startDate);
            if (endDate) filter.date.lte = new Date(endDate);
        }

        const roster = await prisma.shiftRoster.findMany({ where: filter });

        const flattenedRoster = roster.map(r => {
            const { shiftData, ...rest } = r;
            return {
                id: r.id,
                _id: r.id,
                mongoId: r.mongoId,
                employeeId: r.employeeId,
                date: r.date,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                ...(shiftData || {})
            };
        });

        return NextResponse.json({ success: true, roster: flattenedRoster });
    } catch (error) {
        console.error("GET Roster Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await req.json();
        const { assignments, assignedBy } = body;

        if (!assignments || !Array.isArray(assignments)) {
            return NextResponse.json({ success: false, error: "Assignments array is required" }, { status: 400 });
        }

        const results = [];
        for (const assignment of assignments) {
            const { employeeId, date, shiftId } = assignment;

            // Security check: Ensure employee exists and get organizationId
            const employee = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }] } });
            if (!employee) continue;

            const employeeOrgId = employee.organizationId;
            if (!employeeOrgId) continue;

            // SaaS PROTECTION: Admin can only assign shifts to employees within their own organization
            if (authUser.role === "admin" && employeeOrgId.toString() !== authUser.organizationId) {
                continue; // Skip unauthorized assignments
            }

            const assignmentDate = new Date(date);
            const existingRoster = await prisma.shiftRoster.findFirst({
                where: {
                    employeeId,
                    date: assignmentDate
                }
            });

            const shiftData = {
                shiftId,
                organizationId: employeeOrgId,
                assignedBy: assignedBy || authUser.id,
                status: "Published"
            };

            let updated;
            if (existingRoster) {
                updated = await prisma.shiftRoster.update({
                    where: { id: existingRoster.id },
                    data: {
                        shiftData
                    }
                });
            } else {
                updated = await prisma.shiftRoster.create({
                    data: {
                        employeeId,
                        date: assignmentDate,
                        shiftData
                    }
                });
            }
            
            const { shiftData: sd, ...rest } = updated;
            results.push({
                ...rest,
                ...sd
            });
        }

        return NextResponse.json({ success: true, count: results.length, roster: results });
    } catch (error) {
        console.error("POST Roster Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const employeeId = searchParams.get("employeeId");
        const date = searchParams.get("date");

        if (id) {
            const existing = await prisma.shiftRoster.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
            if (existing) {
                const organizationIdInRoster = existing.shiftData?.organizationId;
                if (authUser.role === "admin" && organizationIdInRoster && organizationIdInRoster !== authUser.organizationId) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
                await prisma.shiftRoster.delete({ where: { id: existing.id } });
            }
        } else if (employeeId && date) {
            const assignmentDate = new Date(date);
            const existing = await prisma.shiftRoster.findFirst({
                where: {
                    employeeId,
                    date: assignmentDate
                }
            });

            if (existing) {
                const organizationIdInRoster = existing.shiftData?.organizationId;
                if (authUser.role === "admin" && organizationIdInRoster && organizationIdInRoster !== authUser.organizationId) {
                    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
                }
                await prisma.shiftRoster.delete({
                    where: { id: existing.id }
                });
            }
        } else {
            return NextResponse.json({ success: false, error: "ID or EmployeeId & Date required" }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: "Assignment removed" });
    } catch (error) {
        console.error("DELETE Roster Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
