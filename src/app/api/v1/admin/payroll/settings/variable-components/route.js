import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
    try {
        const configs = await prisma.variablePayConfig.findMany();
        const enriched = configs.map(c => ({
            id: c.id,
            mongoId: c.mongoId,
            organizationId: c.organizationId,
            employeeId: c.employeeId,
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            ...(c.modelData || {})
        }));
        return NextResponse.json(enriched);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.name || !body.code || !body.frequency) {
            return NextResponse.json({ error: 'Name, Code, and Frequency are required.' }, { status: 400 });
        }

        // Check for duplicates in memory/JSON
        const configs = await prisma.variablePayConfig.findMany();
        const codeUpper = body.code.toUpperCase();
        const nameLower = body.name.toLowerCase();

        const existing = configs.find(c => {
            const data = c.modelData || {};
            return (data.code && data.code.toUpperCase() === codeUpper) || (data.name && data.name.toLowerCase() === nameLower);
        });

        if (existing) {
            return NextResponse.json({ error: 'Component with this Code or Name already exists.' }, { status: 400 });
        }

        const modelData = {
            name: body.name,
            code: codeUpper,
            frequency: body.frequency,
            description: body.description || '',
            isActive: body.isActive !== undefined ? body.isActive : true,
            taxability: body.taxability !== undefined ? body.taxability : true
        };

        const newConfig = await prisma.variablePayConfig.create({
            data: {
                status: body.isActive !== false ? 'Active' : 'Inactive',
                modelData
            }
        });

        const result = {
            id: newConfig.id,
            mongoId: newConfig.mongoId,
            organizationId: newConfig.organizationId,
            employeeId: newConfig.employeeId,
            status: newConfig.status,
            createdAt: newConfig.createdAt,
            updatedAt: newConfig.updatedAt,
            ...(newConfig.modelData || {})
        };

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
