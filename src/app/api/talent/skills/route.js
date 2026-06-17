import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";

const isUUID = (val) => typeof val === 'string' && val.length === 36 && val.includes('-');

// GET skills
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const category = searchParams.get("category");

        let where = {};
        if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true }
            });
            if (emp) {
                where.employeeId = emp.id;
            } else {
                where.employeeId = 'none';
            }
        }
        if (category) {
            where.category = category;
        }

        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const allowedIds = orgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
            if (where.employeeId) {
                if (!allowedIds.includes(where.employeeId)) {
                    where.employeeId = 'none';
                }
            } else {
                where.employeeId = { in: allowedIds };
            }
        } else if (authUser.role === "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] },
                select: { id: true }
            });
            const empId = emp ? emp.id : 'none';
            if (where.employeeId) {
                if (where.employeeId !== empId) {
                    where.employeeId = 'none';
                }
            } else {
                where.employeeId = empId;
            }
        }

        const skillsList = await prisma.skill.findMany({
            where,
            orderBy: {
                proficiency: 'desc',
            }
        });

        // Resolve employees in batch
        const empIds = [...new Set(skillsList.map(s => s.employeeId).filter(Boolean))];
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

        const skills = skillsList.map(s => ({
            _id: s.id,
            id: s.id,
            employeeId: s.employeeId,
            employee: empMap[s.employeeId] || (s.employeeId ? { _id: s.employeeId, id: s.employeeId } : null),
            name: s.name,
            category: s.category || "Technical",
            proficiency: s.proficiency,
            lastAssessed: s.lastAssessed,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
        }));

        return NextResponse.json({ skills });
    } catch (error) {
        console.error("Error in GET /api/talent/skills:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPSERT a skill (Add or Update proficiency)
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const {
            employeeId,
            name,
            category,
            proficiency
        } = body;

        if (!employeeId || !name || proficiency === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Resolve employee
        const employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
            select: { id: true, firstName: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        const skill = await prisma.skill.upsert({
            where: {
                employeeId_name: {
                    employeeId: employee.id,
                    name: name,
                },
            },
            update: {
                category: category || "Technical",
                proficiency: Number(proficiency),
                lastAssessed: new Date(),
            },
            create: {
                employeeId: employee.id,
                name: name,
                category: category || "Technical",
                proficiency: Number(proficiency),
                lastAssessed: new Date(),
            },
        });

        // Log activity
        await logActivity({
            action: "updated",
            entity: "Skill",
            entityId: skill.id,
            description: `Skill '${name}' proficiency set to ${proficiency}/5 for employee ${employee.firstName}`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name || "Sync System"
            },
            req: request
        });

        return NextResponse.json({ ...skill, _id: skill.id });
    } catch (error) {
        console.error("Error in POST /api/talent/skills:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}