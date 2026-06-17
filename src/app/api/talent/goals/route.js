import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";

const isUUID = (val) => typeof val === 'string' && val.length === 36 && val.includes('-');

// GET performance goals
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");

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

        if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true }
            });
            if (emp) {
                // Ensure requested employee is within allowed bounds
                if (filter.employeeId && filter.employeeId.in) {
                    if (filter.employeeId.in.includes(emp.id)) {
                        filter.employeeId = emp.id;
                    } else {
                        filter.employeeId = 'none';
                    }
                } else {
                    filter.employeeId = emp.id;
                }
            } else {
                filter.employeeId = 'none';
            }
        }

        if (status) filter.status = status;

        const goalsList = await prisma.performanceGoal.findMany({
            where: filter,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Resolve employees
        const empIds = [...new Set(goalsList.map(g => g.employeeId).filter(Boolean))];
        const employees = await prisma.employee.findMany({
            where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
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
                }
            };
            empMap[e.id] = data;
            if (e.mongoId) empMap[e.mongoId] = data;
        });

        // Shape goals output
        const goals = goalsList.map(g => {
            const gData = g.goalData && typeof g.goalData === 'object' ? g.goalData : {};
            return {
                _id: g.id,
                id: g.id,
                employeeId: g.employeeId,
                employee: empMap[g.employeeId] || (g.employeeId ? { _id: g.employeeId } : null),
                title: g.title,
                status: g.status,
                progress: g.progress,
                createdAt: g.createdAt,
                updatedAt: g.updatedAt,
                // Flatten goalData dynamic attributes
                description: gData.description || "",
                category: gData.category || "General",
                startDate: gData.startDate || null,
                endDate: gData.endDate || null,
                priority: gData.priority || "Medium",
                keyResults: gData.keyResults || [],
                feedback: gData.feedback || []
            };
        });

        return NextResponse.json({ goals });
    } catch (error) {
        console.error("Error in GET /api/talent/goals:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// CREATE a new performance goal
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const {
            employeeId,
            title,
            description,
            category,
            startDate,
            endDate,
            priority,
            keyResults,
            performedBy
        } = body;

        if (!employeeId || !title || !startDate || !endDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const existingEmployee = await prisma.employee.findFirst({
            where: {
                OR: [{ id: employeeId }, { mongoId: employeeId }]
            },
            select: { id: true, firstName: true }
        });

        if (!existingEmployee) {
            return NextResponse.json(
                { error: "Employee not found" },
                { status: 404 }
            );
        }

        const goal = await prisma.performanceGoal.create({
            data: {
                employeeId: existingEmployee.id,
                title,
                status: "Not Started",
                progress: 0,
                goalData: {
                    description: description || "",
                    category: category || "Development",
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                    priority: priority || "Medium",
                    keyResults: keyResults || [],
                    feedback: []
                }
            }
        });

        // Log activity
        await logActivity({
            action: "created",
            entity: "PerformanceGoal",
            entityId: goal.id,
            description: `New performance goal '${title}' set for ${existingEmployee?.firstName}`,
            performedBy: {
                userId: performedBy || authUser.id,
                name: authUser.name || "Sync System"
            },
            req: request
        });

        return NextResponse.json({ ...goal, _id: goal.id }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/talent/goals:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
