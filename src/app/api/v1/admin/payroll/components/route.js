import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        
        const { searchParams } = new URL(request.url);
        let orgId = searchParams.get('organizationId');

        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            orgId = authUser.organizationId;
        }

        const query = {};
        if (orgId) {
            query.OR = [
                { organizationId: orgId },
                { isSystemDefault: true },
                { organizationId: null }
            ];
        }

        const components = await prisma.salaryComponent.findMany({ where: query });
        return NextResponse.json(components);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        
        const body = await request.json();

        // SaaS PROTECTION: Admin must use their assigned organizationId
        if (authUser.role === "admin") {
            body.organizationId = authUser.organizationId;
        }

        const component = await prisma.salaryComponent.create({ data: body });

        await logActivity({
            action: "created",
            entity: "SalaryComponent",
            entityId: component.name,
            description: `Created salary component: ${component.name}`,
            performedBy: { userId: authUser.id, name: authUser.name },
            req: request
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
