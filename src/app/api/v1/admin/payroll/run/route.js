import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const year = searchParams.get('year');

        let filter = {};
        
        // SaaS PROTECTION: Allow explicitly passed orgId or fallback to admin's own org
        if (orgId) {
            filter.organizationId = orgId;
        } else if (authUser.role === "admin") {
            filter.organizationId = authUser.organizationId;
        }
        
        if (year) filter.year = parseInt(year);

        const runs = await prisma.payrollRun.findMany({ where: filter, orderBy: { createdAt: 'desc' } });

        // Spread runData for frontend compatibility
        const formattedRuns = runs.map(r => ({
            _id: r.id,
            id: r.id,
            status: r.status,
            month: r.month,
            year: r.year,
            organizationId: r.organizationId,
            processedBy: r.processedBy,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            ...(r.runData && typeof r.runData === 'object' ? r.runData : {})
        }));

        return NextResponse.json(formattedRuns);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        
        const body = await request.json();
        let { month, year, orgId, generatedBy } = body;

        // SaaS PROTECTION: Admin must use their org
        if (authUser.role === "admin") {
            orgId = authUser.organizationId;
            generatedBy = authUser.id;
        }

        if (!month || !year || !orgId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check for existing run
        const existingRun = await prisma.payrollRun.findFirst({ where: { month, year, organizationId: orgId } });
        if (existingRun) {
            return NextResponse.json({ error: `Payroll run for ${month}/${year} already exists.` }, { status: 400 });
        }

        const runId = `PRUN-${year}${String(month).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const run = await prisma.payrollRun.create({ data: {
            month,
            year,
            organizationId: orgId,
            processedBy: generatedBy,
            status: 'Draft',
            runData: {
                runId,
                generatedBy,
                periodStart: new Date(year, month - 1, 1).toISOString(),
                periodEnd: new Date(year, month, 0).toISOString()
            }
        } });

        await logActivity({
            action: "initialized",
            entity: "PayrollRun",
            entityId: run.runData?.runId || run.id,
            description: `Initialized payroll run for ${month}/${year}`,
            performedBy: { userId: generatedBy },
            req: request
        });

        return NextResponse.json(run, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
