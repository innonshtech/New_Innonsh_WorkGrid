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
        
        // SaaS PROTECTION: Admin restricted to their org
        if (authUser.role === "admin") {
            filter.organizationId = authUser.organizationId;
        } else if (orgId) {
            filter.organizationId = orgId;
        }
        
        const rawRuns = await prisma.payrollRun.findMany({
            where: filter
        });

        // Map runs to spread runData for frontend compatibility
        let runs = rawRuns.map(r => ({
            _id: r.id,
            status: r.status,
            month: r.month,
            year: r.year,
            ...(r.runData && typeof r.runData === 'object' ? r.runData : {}),
            organizationId: r.organizationId
        }));

        if (year) {
            const yr = parseInt(year);
            runs = runs.filter(r => r.year === yr);
        }

        runs.sort((a, b) => {
            if (a.year !== b.year) return (b.year || 0) - (a.year || 0);
            return (b.month || 0) - (a.month || 0);
        });

        // Resolve generatedBy logic here
        const enrichedRuns = await Promise.all(runs.map(async r => {
            let genBy = null;
            if (r.generatedBy) {
                const u = await prisma.user.findFirst({
                    where: { OR: [{ id: r.generatedBy }, { mongoId: r.generatedBy }] },
                    select: { name: true }
                });
                genBy = u;
            }
            return { ...r, generatedBy: genBy };
        }));

        return NextResponse.json(enrichedRuns);
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

        // Check for existing run using top-level month/year fields
        const existingRun = await prisma.payrollRun.findFirst({
            where: { organizationId: orgId, month, year }
        });

        if (existingRun) {
            return NextResponse.json({ error: `Payroll run for ${month}/${year} already exists.` }, { status: 400 });
        }

        const runIdStr = `PRUN-${year}${String(month).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const periodStart = new Date(year, month - 1, 1).toISOString();
        const periodEnd = new Date(year, month, 0).toISOString();

        const run = await prisma.payrollRun.create({
            data: {
                month,
                year,
                organizationId: orgId,
                processedBy: generatedBy,
                status: 'Draft',
                runData: {
                    runId: runIdStr,
                    generatedBy,
                    periodStart,
                    periodEnd
                }
            }
        });

        await logActivity({
            action: "initialized",
            entity: "PayrollRun",
            entityId: runIdStr,
            description: `Initialized payroll run for ${month}/${year}`,
            performedBy: { userId: generatedBy },
            req: request
        });

        const formatted = {
            _id: run.id,
            status: run.status,
            month: run.month,
            year: run.year,
            ...(run.runData && typeof run.runData === 'object' ? run.runData : {})
        };

        return NextResponse.json(formatted, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
