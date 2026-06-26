import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        let orgId = searchParams.get('orgId');

        if (authUser.role === "admin" || authUser.role === "supervisor") {
            orgId = authUser.organizationId;
        }

        if (!orgId) {
            if (authUser.role === "super_admin") {
                const firstOrg = await prisma.organization.findFirst();
                if (!firstOrg) return NextResponse.json({ error: "No organizations found" }, { status: 404 });
                orgId = firstOrg.id;
            } else {
                return NextResponse.json({ error: "Organization ID required" }, { status: 400 });
            }
        }

        // 1. Fetch PF Config
        let pfConfig = await prisma.payrollPFConfig.findFirst({
            where: { organizationId: orgId, isActive: true },
            orderBy: { effectiveFrom: 'desc' }
        });
        if (!pfConfig) {
            // Check for default config
            pfConfig = await prisma.payrollPFConfig.findFirst({
                where: { organizationId: null, isActive: true },
                orderBy: { effectiveFrom: 'desc' }
            });
        }

        // 2. Fetch ESI Config
        let esiConfig = await prisma.payrollESIConfig.findFirst({
            where: { organizationId: orgId, isActive: true },
            orderBy: { effectiveFrom: 'desc' }
        });
        if (!esiConfig) {
            // Check for default config
            esiConfig = await prisma.payrollESIConfig.findFirst({
                where: { organizationId: null, isActive: true },
                orderBy: { effectiveFrom: 'desc' }
            });
        }

        // 3. Fetch Tax Slabs (For active/recent financial years)
        const taxSlabs = await prisma.payrollTaxSlabConfig.findMany({
            where: {
                isActive: true,
                OR: [
                    { organizationId: orgId },
                    { organizationId: null }
                ]
            },
            orderBy: [
                { financialYear: 'desc' },
                { slabFrom: 'asc' }
            ]
        });

        // 4. Fetch Tax Sections (80C, 80D, standard deduction, etc.)
        const taxSections = await prisma.payrollTaxSectionConfig.findMany({
            where: {
                isActive: true,
                OR: [
                    { organizationId: orgId },
                    { organizationId: null }
                ]
            },
            orderBy: { sectionCode: 'asc' }
        });

        return NextResponse.json({
            pfConfig: pfConfig || {
                pfWageComponents: ['BASIC', 'DA'],
                pfCeiling: 15000,
                employeePFRate: 12,
                employerPFRate: 12,
                epsRate: 8.33,
                adminChargeRate: 0.5,
                edliRate: 0.5,
                restrictToCeiling: true
            },
            esiConfig: esiConfig || {
                grossThreshold: 21000,
                employeeRate: 0.75,
                employerRate: 3.25
            },
            taxSlabs,
            taxSections
        });

    } catch (error) {
        console.error('Error fetching statutory rules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const body = await request.json();
        let { orgId, pfConfig, esiConfig, taxSlabs, taxSections, targetFinancialYear } = body;

        if (authUser.role === "admin" || authUser.role === "supervisor") {
            orgId = authUser.organizationId;
        }

        if (!orgId) {
            return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
        }

        // Use a Prisma transaction to save configurations atomically
        await prisma.$transaction(async (tx) => {
            
            // 1. Save PF Config
            if (pfConfig) {
                const existingPF = await tx.payrollPFConfig.findFirst({
                    where: { organizationId: orgId, isActive: true }
                });

                if (existingPF) {
                    await tx.payrollPFConfig.update({
                        where: { id: existingPF.id },
                        data: {
                            pfWageComponents: pfConfig.pfWageComponents || ['BASIC', 'DA'],
                            pfCeiling: Number(pfConfig.pfCeiling),
                            employeePFRate: Number(pfConfig.employeePFRate),
                            employerPFRate: Number(pfConfig.employerPFRate),
                            epsRate: Number(pfConfig.epsRate),
                            adminChargeRate: Number(pfConfig.adminChargeRate),
                            edliRate: Number(pfConfig.edliRate),
                            restrictToCeiling: pfConfig.restrictToCeiling !== false
                        }
                    });
                } else {
                    await tx.payrollPFConfig.create({
                        data: {
                            organizationId: orgId,
                            pfWageComponents: pfConfig.pfWageComponents || ['BASIC', 'DA'],
                            pfCeiling: Number(pfConfig.pfCeiling),
                            employeePFRate: Number(pfConfig.employeePFRate),
                            employerPFRate: Number(pfConfig.employerPFRate),
                            epsRate: Number(pfConfig.epsRate),
                            adminChargeRate: Number(pfConfig.adminChargeRate),
                            edliRate: Number(pfConfig.edliRate),
                            restrictToCeiling: pfConfig.restrictToCeiling !== false,
                            isActive: true
                        }
                    });
                }
            }

            // 2. Save ESI Config
            if (esiConfig) {
                const existingESI = await tx.payrollESIConfig.findFirst({
                    where: { organizationId: orgId, isActive: true }
                });

                if (existingESI) {
                    await tx.payrollESIConfig.update({
                        where: { id: existingESI.id },
                        data: {
                            grossThreshold: Number(esiConfig.grossThreshold),
                            employeeRate: Number(esiConfig.employeeRate),
                            employerRate: Number(esiConfig.employerRate)
                        }
                    });
                } else {
                    await tx.payrollESIConfig.create({
                        data: {
                            organizationId: orgId,
                            grossThreshold: Number(esiConfig.grossThreshold),
                            employeeRate: Number(esiConfig.employeeRate),
                            employerRate: Number(esiConfig.employerRate),
                            isActive: true
                        }
                    });
                }
            }

            // 3. Save Tax Slabs
            if (taxSlabs && Array.isArray(taxSlabs) && targetFinancialYear) {
                // Delete existing custom slabs for this organization & financial year
                await tx.payrollTaxSlabConfig.deleteMany({
                    where: {
                        organizationId: orgId,
                        financialYear: targetFinancialYear
                    }
                });

                // Create new slabs
                for (const slab of taxSlabs) {
                    await tx.payrollTaxSlabConfig.create({
                        data: {
                            organizationId: orgId,
                            regime: slab.regime.toUpperCase(),
                            financialYear: targetFinancialYear,
                            slabFrom: Number(slab.slabFrom),
                            slabTo: Number(slab.slabTo),
                            rate: Number(slab.rate),
                            surchargeThreshold: slab.surchargeThreshold ? Number(slab.surchargeThreshold) : null,
                            surchargeRate: slab.surchargeRate ? Number(slab.surchargeRate) : 0,
                            cessRate: slab.cessRate ? Number(slab.cessRate) : 4,
                            isActive: true
                        }
                    });
                }
            }

            // 4. Save Tax Sections (80C, Standard Deduction etc.)
            if (taxSections && Array.isArray(taxSections)) {
                for (const section of taxSections) {
                    const existingSection = await tx.payrollTaxSectionConfig.findFirst({
                        where: {
                            organizationId: orgId,
                            sectionCode: section.sectionCode
                        }
                    });

                    if (existingSection) {
                        await tx.payrollTaxSectionConfig.update({
                            where: { id: existingSection.id },
                            data: {
                                maxLimit: Number(section.maxLimit),
                                applicableRegime: section.applicableRegime || 'BOTH',
                                name: section.name
                            }
                        });
                    } else {
                        await tx.payrollTaxSectionConfig.create({
                            data: {
                                organizationId: orgId,
                                sectionCode: section.sectionCode,
                                name: section.name,
                                maxLimit: Number(section.maxLimit),
                                applicableRegime: section.applicableRegime || 'BOTH',
                                isActive: true
                            }
                        });
                    }
                }
            }
        });

        return NextResponse.json({ success: true, message: "Statutory rules saved successfully" });

    } catch (error) {
        console.error('Error saving statutory rules:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
