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

        // SaaS PROTECTION
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            prismaFilter.employeeId = { in: empIds };
        } else if (authUser.role === "employee") {
            const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authUser.id);
            if (isUserUuid) {
                prismaFilter.employeeId = authUser.id;
            } else {
                const emp = await prisma.employee.findFirst({ where: { mongoId: authUser.id } });
                prismaFilter.employeeId = emp ? emp.id : 'non-existent-uuid';
            }
        } else if (authUser.role === "super_admin" && organizationId) {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId },
                select: { id: true, mongoId: true }
            });
            const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
            prismaFilter.employeeId = { in: empIds };
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
            // Admin view: Fetch all declarations (we'll filter financialYear in JS for JSON compatibility)
            const allDecls = await prisma.investmentDeclaration.findMany({ where: prismaFilter });
            
            // Filter by financialYear inside modelData
            const filteredDecls = allDecls.filter(d => d.modelData?.financialYear === financialYear);
            
            // Format to match Mongoose legacy structure
            const formatted = filteredDecls.map(d => ({
                _id: d.id,
                employeeId: d.employeeId,
                status: d.status,
                financialYear: d.modelData?.financialYear,
                sections: d.modelData?.sections,
                actualSubmissions: d.modelData?.actualSubmissions,
                remark: d.modelData?.remark
            }));

            return NextResponse.json(formatted);
        }

        // Fetch single employee declaration
        const allDecls = await prisma.investmentDeclaration.findMany({ where: prismaFilter });
        const decl = allDecls.find(d => d.modelData?.financialYear === financialYear);

        let declaration = null;
        if (decl) {
            declaration = {
                _id: decl.id,
                employeeId: decl.employeeId,
                status: decl.status,
                financialYear: decl.modelData?.financialYear,
                sections: decl.modelData?.sections,
                actualSubmissions: decl.modelData?.actualSubmissions,
                remark: decl.modelData?.remark
            };
        }

        if (!declaration && employeeId) {
            declaration = {
                employeeId,
                financialYear,
                status: 'Draft',
                sections: {
                    section80C: { ppf: 0, elss: 0, lic: 0, nsc: 0, others: 0, total: 0 },
                    section80D: { mediclaimSelf: 0, mediclaimParents: 0, total: 0 },
                    hra: { annualRent: 0, landlordPan: '', city: 'Non-Metro' },
                    otherDeductions: { standardDeduction: 50000, professionalTax: 0, others: 0 }
                }
            };
        }

        return NextResponse.json(declaration || null);
    } catch (error) {
        console.error("GET Investment error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const { employeeId, financialYear, sections, actualSubmissions, status, remark } = body;

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
        } else if (authUser.role === "employee" && authUser.id !== employee.id.toString() && authUser.mongoId !== employee.id.toString()) {
            return NextResponse.json({ error: "Forbidden: You can only submit your own declaration" }, { status: 403 });
        }

        if (sections) {
            if (sections.section80C) {
                const s = sections.section80C;
                sections.section80C.total = (s.ppf || 0) + (s.elss || 0) + (s.lic || 0) + (s.nsc || 0) + (s.others || 0);
            }
            if (sections.section80D) {
                const s = sections.section80D;
                sections.section80D.total = (s.mediclaimSelf || 0) + (s.mediclaimParents || 0);
            }
        }

        const newStatus = body.submit ? 'Pending' : (status || 'Draft');

        // Find existing to upsert properly based on financialYear inside modelData
        const existingDecls = await prisma.investmentDeclaration.findMany({
            where: { employeeId: employee.id }
        });
        const existing = existingDecls.find(d => d.modelData?.financialYear === financialYear);

        const modelData = {
            financialYear,
            sections: sections || existing?.modelData?.sections,
            actualSubmissions: actualSubmissions || existing?.modelData?.actualSubmissions,
            remark: remark || existing?.modelData?.remark
        };

        let declaration;
        if (existing) {
            declaration = await prisma.investmentDeclaration.update({
                where: { id: existing.id },
                data: { status: newStatus, modelData }
            });
        } else {
            declaration = await prisma.investmentDeclaration.create({
                data: {
                    employeeId: employee.id,
                    organizationId: employee.organizationId,
                    status: newStatus,
                    modelData
                }
            });
        }

        await logActivity({
            action: body.submit ? "submitted" : "saved_draft",
            entity: "InvestmentDeclaration",
            entityId: declaration.id,
            description: `${body.submit ? 'Submitted' : 'Saved draft'} investment declaration for FY ${financialYear}`,
            performedBy: { userId: authUser.id, name: "Admin/User" },
            req: request
        });

        // Format for frontend
        const formatted = {
             _id: declaration.id,
             employeeId: declaration.employeeId,
             status: declaration.status,
             financialYear: declaration.modelData?.financialYear,
             sections: declaration.modelData?.sections,
             actualSubmissions: declaration.modelData?.actualSubmissions,
             remark: declaration.modelData?.remark
        };

        return NextResponse.json(formatted, { status: 201 });
    } catch (error) {
        console.error("POST Investment error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
