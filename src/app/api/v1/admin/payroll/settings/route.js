import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        let orgId = searchParams.get('orgId');

        // SaaS PROTECTION: Admin restricted to their org
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            orgId = authUser.organizationId;
        }

        if (!orgId) {
            // If super_admin and no orgId, default to first org or return error
            if (authUser.role === "super_admin") {
                const firstOrg = await prisma.organization.findFirst();
                if (!firstOrg) return NextResponse.json({ error: "No organizations found" }, { status: 404 });
                orgId = firstOrg.id;
            } else {
                return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
            }
        }

        let config = await prisma.payrollConfig.findFirst({ where: { companyId: orgId } });
        if (!config) {
            config = await prisma.payrollConfig.create({ data: { companyId: orgId, configData: {} } });
        }
        
        // Flatten configData
        const responseData = {
            _id: config.id,
            id: config.id,
            company: config.companyId,
            companyId: config.companyId,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            ...(config.configData && typeof config.configData === 'object' ? config.configData : {})
        };
        return NextResponse.json(responseData);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();
        let { company, ...rest } = body;

        console.log("💾 [PayrollConfig] Received Save Request:", { 
            company,
            receivedFields: Object.keys(body),
            quota: body.annualPaidLeaveQuota 
        });

        // SaaS PROTECTION: Admin must use their assigned organizationId
        if (authUser.role === "admin") {
            company = authUser.organizationId;
        }

        if (!company) {
             console.error("❌ [PayrollConfig] Missing Company ID");
             return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
        }

        try {
            const existingConfig = await prisma.payrollConfig.findFirst({
                where: { companyId: company }
            });
            let config;
            if (existingConfig) {
                config = await prisma.payrollConfig.update({
                    where: { id: existingConfig.id },
                    data: {
                        configData: rest
                    }
                });
            } else {
                config = await prisma.payrollConfig.create({
                    data: {
                        companyId: company,
                        configData: rest
                    }
                });
            }
            console.log("✅ [PayrollConfig] Saved Successfully:", config.id);
            
            // Return flattened config
            const responseData = {
                _id: config.id,
                id: config.id,
                company: config.companyId,
                companyId: config.companyId,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
                ...(config.configData && typeof config.configData === 'object' ? config.configData : {})
            };
            return NextResponse.json(responseData);
        } catch (dbError) {
            console.error("❌ [PayrollConfig] DB Sync Error:", dbError.message);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }
    } catch (error) {
        console.error("❌ [PayrollConfig] API Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
