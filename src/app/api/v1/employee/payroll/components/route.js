import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const rawComponents = await prisma.salaryComponent.findMany({
            orderBy: { displayOrder: 'asc' }
        });

        const components = rawComponents.map(c => ({
            _id: c.id,
            name: c.name,
            type: c.type,
            calculationType: c.calculationType,
            percentageOf: c.percentageOf,
            defaultValue: c.defaultValue,
            category: c.category,
            isTaxable: c.isTaxable,
            isStatutory: c.isStatutory,
            enabled: c.enabled,
            description: c.description,
            displayOrder: c.displayOrder
        }));

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

        const compRecord = await prisma.salaryComponent.create({
            data: {
                name: body.name,
                type: body.type || 'Earnings',
                calculationType: body.calculationType || 'Flat',
                percentageOf: body.percentageOf || 'Basic',
                defaultValue: body.defaultValue || 0,
                category: body.category || 'Standard',
                isTaxable: body.isTaxable !== undefined ? body.isTaxable : true,
                isStatutory: body.isStatutory !== undefined ? body.isStatutory : false,
                enabled: body.enabled !== undefined ? body.enabled : true,
                description: body.description || null,
                displayOrder: body.displayOrder || 0
            }
        });

        const component = {
            _id: compRecord.id,
            ...compRecord
        };

        await logActivity({
            action: "created",
            entity: "SalaryComponent",
            entityId: compRecord.id,
            description: `Created salary component: ${body.name}`,
            performedBy: { userId: authUser.id, name: "Admin" },
            req: request
        });

        return NextResponse.json(component, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
