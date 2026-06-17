import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const memberId = searchParams.get('memberId');

        // SaaS PROTECTION: Restrict by organization
        let query = {};
        if (authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        }

        // Employee-specific filtering: We need to filter in JS since members is inside projectData
        let employeeMemberId = null;
        let employeeMongoId = null;
        if (authUser.role === "employee") {
            employeeMemberId = authUser.id;
            const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
            if (emp) {
                employeeMongoId = emp.mongoId;
            }
        }
        if (status) query.status = status;
        // memberId from query params overrides
        if (memberId) employeeMemberId = memberId;

        const allProjects = await prisma.project.findMany({ where: query });
        
        const projects = allProjects.filter(p => {
            if (!employeeMemberId) return true;
            const data = p.projectData || {};
            const members = data.members || [];
            return members.includes(employeeMemberId) || members.includes(employeeMongoId);
        });

        return NextResponse.json({ success: true, projects });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await request.json();

        // Auto-assign organizationId from the authenticated user
        if (authUser.role === "admin" && authUser.organizationId) {
            body.organizationId = authUser.organizationId;
        }

        const project = await prisma.project.create({ data: body });

        await logActivity({
            action: "created",
            entity: "Project",
            entityId: project._id,
            description: `Created project: ${project.name}`,
            details: project,
            req: request
        });

        return NextResponse.json({ success: true, project }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
