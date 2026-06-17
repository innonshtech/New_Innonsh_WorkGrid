import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function POST(request) {
    try {
        const body = await request.json();

        if (!body.departmentId || !body.name) {
            return NextResponse.json(
                { success: false, error: "Department ID and Team name are required" },
                { status: 400 }
            );
        }

        const department = await prisma.department.findFirst({
            where: {
                OR: [{ id: body.departmentId }, { mongoId: body.departmentId }],
            },
        });
        if (!department) {
            return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
        }

        const existingTeam = await prisma.team.findFirst({
            where: {
                name: body.name.trim(),
                departmentId: body.departmentId,
            },
        });

        if (existingTeam) {
            return NextResponse.json(
                { success: false, error: "Team name already exists in this department" },
                { status: 400 }
            );
        }

        const team = await prisma.team.create({
            data: {
                organizationId: body.organizationId || null,
                departmentId: body.departmentId,
                teamName: body.name.trim(),
                name: body.name.trim(),
                teamLeadId: body.teamLeadId || null,
                createdBy: body.createdBy || null,
                updatedBy: body.updatedBy || null,
            },
        });

        const dep = team.departmentId ? await prisma.department.findFirst({
            where: { OR: [{ id: team.departmentId }, { mongoId: team.departmentId }] },
            select: { id: true, departmentName: true }
        }) : null;
        
        const lead = team.teamLeadId ? await prisma.employee.findFirst({
            where: { OR: [{ id: team.teamLeadId }, { mongoId: team.teamLeadId }] },
            select: { id: true, mongoId: true, firstName: true, lastName: true }
        }) : null;

        const creator = team.createdBy ? await prisma.user.findFirst({
            where: { OR: [{ id: team.createdBy }, { mongoId: team.createdBy }] },
            select: { id: true, name: true, email: true, role: true }
        }) : null;

        const populatedTeam = {
            ...team,
            _id: team.id,
            departmentId: dep ? { _id: dep.id, departmentName: dep.departmentName } : null,
            teamLead: lead ? { id: lead.id, mongoId: lead.mongoId, personalDetails: { firstName: lead.firstName, lastName: lead.lastName } } : null,
            createdByUser: creator
        };

        await logActivity({
            action: "created",
            entity: "Team",
            entityId: team.id,
            description: `Created team: ${team.name} in ${populatedTeam.department?.departmentName}`,
            performedBy: {
                userId: populatedTeam.createdByUser?.id,
                name: populatedTeam.createdByUser?.name || "Admin/User",
                email: populatedTeam.createdByUser?.email,
                role: populatedTeam.createdByUser?.role
            },
            req: request
        });

        return NextResponse.json(
            { success: true, message: "Team created successfully", team: populatedTeam },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create Team error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const search = searchParams.get("search") || "";
        const departmentId = searchParams.get("departmentId");
        const organizationId = searchParams.get("organizationId");
        
        const authUser = await getAuthUser();

        let query = {};
        if (search) {
            query.name = { contains: search, mode: 'insensitive' };
        }
        if (departmentId) {
            const dep = await prisma.department.findFirst({
                where: { OR: [{ id: departmentId }, { mongoId: departmentId }] }
            });
            const depIds = dep ? [dep.id, dep.mongoId].filter(Boolean) : [departmentId];
            query.departmentId = { in: depIds };
        }
        
        const targetOrgId = (authUser.role !== "super_admin" && authUser.organizationId) ? authUser.organizationId : organizationId;
        if (targetOrgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: targetOrgId }, { mongoId: targetOrgId }] }
            });
            const orgIds = org ? [org.id, org.mongoId].filter(Boolean) : [targetOrgId];
            query.OR = [
                { organizationId: { in: orgIds } },
                { organizationId: null }
            ];
        }

        const teamsRaw = await prisma.team.findMany({
            where: query,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        const depIds = [...new Set(teamsRaw.map(t => t.departmentId).filter(Boolean))];
        const leadIds = [...new Set(teamsRaw.map(t => t.teamLeadId).filter(Boolean))];

        const [departments, employees] = await Promise.all([
            prisma.department.findMany({
                where: { OR: [{ id: { in: depIds } }, { mongoId: { in: depIds } }] },
                select: { id: true, mongoId: true, departmentName: true }
            }),
            prisma.employee.findMany({
                where: { OR: [{ id: { in: leadIds } }, { mongoId: { in: leadIds } }] },
                select: { id: true, mongoId: true, firstName: true, lastName: true }
            })
        ]);

        const depMap = new Map();
        departments.forEach(d => {
            depMap.set(d.id, d);
            if (d.mongoId) depMap.set(d.mongoId, d);
        });

        const empMap = new Map();
        employees.forEach(e => {
            empMap.set(e.id, e);
            if (e.mongoId) empMap.set(e.mongoId, e);
        });

        const teams = teamsRaw.map(t => {
            const dep = t.departmentId ? depMap.get(t.departmentId) : null;
            const lead = t.teamLeadId ? empMap.get(t.teamLeadId) : null;
            return {
                ...t,
                _id: t.id,
                name: t.name || t.teamName,
                departmentId: dep ? { _id: dep.id, departmentName: dep.departmentName } : null,
                teamLead: lead ? { personalDetails: { firstName: lead.firstName, lastName: lead.lastName } } : null
            };
        });

        const total = await prisma.team.count({
            where: query,
        });

        return NextResponse.json({
            success: true,
            data: teams,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Get Teams error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Team ID is required" }, { status: 400 });
        }

        const body = await request.json();
        const existingTeam = await prisma.team.findFirst({
            where: {
                OR: [{ id: id }, { mongoId: id }],
            },
        });
        if (!existingTeam) {
            return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
        }

        if (body.name) {
            const duplicateTeam = await prisma.team.findFirst({
                where: {
                    name: body.name.trim(),
                    departmentId: body.departmentId || existingTeam.departmentId,
                    NOT: {
                        OR: [{ id: id }, { mongoId: id }],
                    },
                },
            });
            if (duplicateTeam) {
                return NextResponse.json(
                    { success: false, error: "Team name already exists in this department" },
                    { status: 400 }
                );
            }
        }

        const targetTeam = await prisma.team.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        const updatedTeamRaw = await prisma.team.update({
            where: { id: targetTeam.id },
            data: {
                organizationId: body.organizationId !== undefined ? body.organizationId : existingTeam.organizationId,
                departmentId: body.departmentId !== undefined ? body.departmentId : existingTeam.departmentId,
                teamName: body.name !== undefined ? body.name.trim() : existingTeam.teamName,
                name: body.name !== undefined ? body.name.trim() : existingTeam.name,
                teamLeadId: body.teamLeadId !== undefined ? body.teamLeadId : existingTeam.teamLeadId,
                status: body.status !== undefined ? body.status : existingTeam.status,
                updatedBy: body.updatedBy || null,
                updatedAt: new Date(),
            },
        });

        const dep = updatedTeamRaw.departmentId ? await prisma.department.findFirst({
            where: { OR: [{ id: updatedTeamRaw.departmentId }, { mongoId: updatedTeamRaw.departmentId }] },
            select: { id: true, departmentName: true }
        }) : null;

        const lead = updatedTeamRaw.teamLeadId ? await prisma.employee.findFirst({
            where: { OR: [{ id: updatedTeamRaw.teamLeadId }, { mongoId: updatedTeamRaw.teamLeadId }] },
            select: { id: true, mongoId: true, firstName: true, lastName: true }
        }) : null;

        const updater = updatedTeamRaw.updatedBy ? await prisma.user.findFirst({
            where: { OR: [{ id: updatedTeamRaw.updatedBy }, { mongoId: updatedTeamRaw.updatedBy }] },
            select: { id: true, name: true, email: true, role: true }
        }) : null;

        const updatedTeam = {
            ...updatedTeamRaw,
            _id: updatedTeamRaw.id,
            department: dep,
            teamLead: lead ? { id: lead.id, mongoId: lead.mongoId, personalDetails: { firstName: lead.firstName, lastName: lead.lastName } } : null,
            updatedByUser: updater
        };

        await logActivity({
            action: "updated",
            entity: "Team",
            entityId: id,
            description: `Updated team: ${updatedTeam.name}`,
            performedBy: {
                userId: updatedTeam.updatedByUser?.id,
                name: updatedTeam.updatedByUser?.name || "Admin/User",
                email: updatedTeam.updatedByUser?.email,
                role: updatedTeam.updatedByUser?.role
            },
            req: request
        });

        return NextResponse.json({ success: true, message: "Team updated successfully", team: updatedTeam });
    } catch (error) {
        console.error("Update Team error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Team ID is required" }, { status: 400 });
        }

        const team = await prisma.team.findFirst({
            where: {
                OR: [{ id: id }, { mongoId: id }],
            },
        });
        if (!team) {
            return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
        }

        await prisma.team.delete({
            where: { id: team.id },
        });
        await logActivity({
            action: "deleted",
            entity: "Team",
            entityId: id,
            description: `Deleted team: ${team.name}`,
            req: request
        });

        return NextResponse.json({ success: true, message: "Team deleted successfully" });
    } catch (error) {
        console.error("Delete Team error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}