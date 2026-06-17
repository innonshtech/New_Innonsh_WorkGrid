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

        let config = await prisma.payrollConfig.findFirst({
            where: { companyId: orgId }
        });
        
        if (!config) {
            config = await prisma.payrollConfig.create({
                data: { companyId: orgId, configData: {} }
            });
        }
        
        // Remap to match mongoose legacy response format
        return NextResponse.json({ ...config.configData, _id: config.id, companyId: config.companyId });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();
        let { company, companyId, ...restData } = body;
        
        let targetOrgId = company || companyId;

        // SaaS PROTECTION: Admin must use their assigned organizationId
        if (authUser.role === "admin") {
            targetOrgId = authUser.organizationId;
        }

        if (!targetOrgId) {
             return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
        }

        const existing = await prisma.payrollConfig.findFirst({
            where: { companyId: targetOrgId }
        });

        let config;
        if (existing) {
            config = await prisma.payrollConfig.update({
                where: { id: existing.id },
                data: { configData: { ...existing.configData, ...restData } }
            });
        } else {
            config = await prisma.payrollConfig.create({
                data: { companyId: targetOrgId, configData: restData }
            });
        }

        return NextResponse.json({ ...config.configData, _id: config.id, companyId: config.companyId });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
