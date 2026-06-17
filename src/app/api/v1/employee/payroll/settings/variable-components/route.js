
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


export async function GET() {
    try {
        const rawConfigs = await prisma.variablePayConfig.findMany();
        const configs = rawConfigs.map(c => ({
            _id: c.id,
            status: c.status,
            ...(c.modelData || {})
        }));
        return NextResponse.json(configs);
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

        // Check for duplicates
        const allConfigs = await prisma.variablePayConfig.findMany();
        const existing = allConfigs.find(c => {
            const data = c.modelData || {};
            return data.code === body.code || data.name === body.name;
        });

        if (existing) {
            return NextResponse.json({ error: 'Component with this Code or Name already exists.' }, { status: 400 });
        }

        const newConfig = await prisma.variablePayConfig.create({
            data: {
                status: "Active",
                modelData: body
            }
        });
        
        return NextResponse.json({
            _id: newConfig.id,
            status: newConfig.status,
            ...(newConfig.modelData || {})
        }, { status: 201 });

    } catch (error) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Duplicate entry found.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
