import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const financialYear = searchParams.get('financialYear') || "2025-26";
        const organizationId = searchParams.get('organizationId');

        let prismaFilter = {};

        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({ 
                where: { organizationId: authUser.organizationId },
                select: { id: true }
            });
            const orgEmployeeIds = orgEmployees.map(e => e.id);
            prismaFilter.employeeId = { in: orgEmployeeIds };
        } else if (authUser.role === "employee") {
            prismaFilter.employeeId = authUser.id;
        } else if (authUser.role === "super_admin" && organizationId) {
            const orgEmployees = await prisma.employee.findMany({ 
                where: { organizationId: organizationId },
                select: { id: true }
            });
            const orgEmployeeIds = orgEmployees.map(e => e.id);
            prismaFilter.employeeId = { in: orgEmployeeIds };
        }

        if (employeeId) {
             const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(employeeId);
             if (prismaFilter.employeeId && prismaFilter.employeeId.in) {
                 const isAllowed = prismaFilter.employeeId.in.includes(employeeId);
                 if (!isAllowed) prismaFilter.employeeId = { in: [] };
                 else prismaFilter.employeeId = employeeId;
             } else {
                 prismaFilter.employeeId = isUuid ? employeeId : 'non-existent-uuid';
             }
        }

        if (!employeeId && authUser.role !== "super_admin" && !authUser.organizationId) {
             return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!employeeId && (authUser.role === "admin" || authUser.role === "super_admin")) {
            // Admin view: Fetch all declarations (within filtered org)
            const rawDeclarations = await prisma.investmentDeclaration.findMany({
                where: prismaFilter,
                orderBy: { createdAt: 'desc' }
            });

            // Filter by financialYear in JSON & enrich
            const filtered = rawDeclarations.filter(decl => {
                const data = decl.modelData && typeof decl.modelData === 'object' ? decl.modelData : {};
                return data.financialYear === financialYear;
            });

            const empIds = [...new Set(filtered.map(d => d.employeeId).filter(Boolean))];
            const employees = empIds.length > 0 ? await prisma.employee.findMany({
                where: { id: { in: empIds } },
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true }
            }) : [];

            const empMap = new Map();
            employees.forEach(emp => {
                empMap.set(emp.id, {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    personalDetails: {
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email,
                        phone: emp.phone
                    }
                });
            });

            const enriched = filtered.map(decl => {
                const data = decl.modelData && typeof decl.modelData === 'object' ? decl.modelData : {};
                const empObj = empMap.get(decl.employeeId) || null;
                return {
                    _id: decl.id,
                    id: decl.id,
                    employeeId: empObj,
                    status: decl.status,
                    createdAt: decl.createdAt,
                    updatedAt: decl.updatedAt,
                    ...data
                };
            });

            return NextResponse.json(enriched);
        }

        // Single employee view
        let declaration = await prisma.investmentDeclaration.findFirst({
            where: prismaFilter
        });

        // Filter in memory for specific financialYear
        let declarationData = null;
        if (declaration) {
            const data = declaration.modelData && typeof declaration.modelData === 'object' ? declaration.modelData : {};
            if (data.financialYear === financialYear) {
                declarationData = declaration;
            }
        }

        // Fetch employee details including taxRegime
        let emp = null;
        const targetEmpId = employeeId || (prismaFilter.employeeId && typeof prismaFilter.employeeId === 'string' ? prismaFilter.employeeId : null);
        if (targetEmpId) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetEmpId);
            if (isUuid) {
                emp = await prisma.employee.findUnique({
                    where: { id: targetEmpId },
                    select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true, taxRegime: true }
                });
            }
        }

        if (!declarationData && employeeId) {
            // Create a default empty declaration if not found
            const emptyObj = {
                _id: 'default-draft',
                id: 'default-draft',
                employeeId,
                financialYear,
                status: 'Draft',
                taxRegime: emp?.taxRegime || 'new',
                sections: {
                    section80C: { ppf: 0, elss: 0, lic: 0, nsc: 0, others: 0, total: 0 },
                    section80D: { mediclaimSelf: 0, mediclaimParents: 0, total: 0 },
                    hra: { annualRent: 0, landlordPan: '', city: 'Non-Metro' },
                    otherDeductions: { standardDeduction: 50000, professionalTax: 0, others: 0 }
                }
            };
            return NextResponse.json(emptyObj);
        }

        if (declarationData) {
            const data = declarationData.modelData && typeof declarationData.modelData === 'object' ? declarationData.modelData : {};
            if (!emp) {
                emp = await prisma.employee.findUnique({
                    where: { id: declarationData.employeeId },
                    select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true, taxRegime: true }
                });
            }
            const empObj = emp ? {
                _id: emp.id,
                id: emp.id,
                employeeId: emp.employeeId,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone
                }
            } : null;

            return NextResponse.json({
                _id: declarationData.id,
                id: declarationData.id,
                employeeId: empObj,
                status: declarationData.status,
                createdAt: declarationData.createdAt,
                updatedAt: declarationData.updatedAt,
                taxRegime: emp?.taxRegime || 'new',
                ...data
            });
        }

        return NextResponse.json(null);
    } catch (error) {
        console.error("❌ GET Investments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        
        const body = await request.json();
        const { employeeId, financialYear, sections, actualSubmissions, status, remark, regime, taxRegime, proofs } = body;
        const selectedRegime = regime || taxRegime;

        if (!employeeId || !financialYear) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(employeeId);
        const employee = await prisma.employee.findFirst({
            where: isUuid ? { OR: [{ id: employeeId }, { mongoId: employeeId }] } : { mongoId: employeeId }
        });

        if (!employee) {
             return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        if (authUser.role === "admin" && employee.organizationId !== authUser.organizationId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        } else if (authUser.role === "employee" && authUser.id !== employee.id.toString()) {
            return NextResponse.json({ error: "Forbidden: You can only submit your own declaration" }, { status: 403 });
        }

        if (selectedRegime) {
            await prisma.employee.update({
                where: { id: employee.id },
                data: { taxRegime: selectedRegime.toLowerCase() }
            });
        }

        // Calculate totals for 80C and 80D only if sub-fields exist, otherwise trust the total
        if (sections) {
            if (sections.section80C) {
                const s = sections.section80C;
                if (s.ppf !== undefined || s.elss !== undefined || s.lic !== undefined) {
                    sections.section80C.total = (s.ppf || 0) + (s.elss || 0) + (s.lic || 0) + (s.nsc || 0) + (s.others || 0);
                }
            }
            if (sections.section80D) {
                const s = sections.section80D;
                if (s.mediclaimSelf !== undefined || s.mediclaimParents !== undefined) {
                    sections.section80D.total = (s.mediclaimSelf || 0) + (s.mediclaimParents || 0);
                }
            }
        }

        const existingDeclaration = await prisma.investmentDeclaration.findFirst({
            where: { employeeId: employee.id }
        });

        let existingData = {};
        if (existingDeclaration && existingDeclaration.modelData && typeof existingDeclaration.modelData === 'object') {
            existingData = existingDeclaration.modelData;
        }

        const updatedModelData = {
            ...existingData,
            financialYear,
            sections: sections || existingData.sections,
            actualSubmissions: actualSubmissions || existingData.actualSubmissions,
            remark: remark || existingData.remark,
            proofs: proofs !== undefined ? proofs : existingData.proofs
        };

        const targetStatus = body.submit ? 'Pending' : (status || existingDeclaration?.status || 'Draft');

        let declaration;
        if (existingDeclaration) {
            declaration = await prisma.investmentDeclaration.update({
                where: { id: existingDeclaration.id },
                data: {
                    status: targetStatus,
                    modelData: updatedModelData
                }
            });
        } else {
            declaration = await prisma.investmentDeclaration.create({
                data: {
                    employeeId: employee.id,
                    organizationId: employee.organizationId,
                    status: targetStatus,
                    modelData: updatedModelData
                }
            });
        }

        await logActivity({
            action: body.submit ? "submitted" : "saved_draft",
            entity: "InvestmentDeclaration",
            entityId: declaration.id,
            description: `${body.submit ? 'Submitted' : 'Saved draft'} investment declaration for FY ${financialYear}`,
            performedBy: { userId: authUser.id, name: authUser.name },
            req: request
        });

        // Enrich and return flattened representation
        const empObj = {
            _id: employee.id,
            id: employee.id,
            employeeId: employee.employeeId,
            personalDetails: {
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                phone: employee.phone
            }
        };

        return NextResponse.json({
            _id: declaration.id,
            id: declaration.id,
            employeeId: empObj,
            status: declaration.status,
            createdAt: declaration.createdAt,
            updatedAt: declaration.updatedAt,
            ...updatedModelData
        }, { status: 201 });
    } catch (error) {
        console.error("❌ POST Investments Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
