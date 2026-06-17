import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";

const isValidUUID = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// GET appraisals
export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get("employeeId");
        const status = searchParams.get("status");

        let filter = {};

        // SaaS PROTECTION: Restrict by organization
        if (authUser.role === "admin" || authUser.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId },
                select: { id: true, mongoId: true }
            });
            const allowedIds = orgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
            filter.employeeId = { in: allowedIds };
        } else if (authUser.role === "employee") {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
            });
            if (emp) filter.employeeId = emp.id;
            else filter.employeeId = 'none';
        }

        if (employeeId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true }
            });
            if (emp) {
                // Ensure the requested employee is within allowed bounds
                if (filter.employeeId && filter.employeeId.in) {
                    if (filter.employeeId.in.includes(emp.id)) {
                        filter.employeeId = emp.id;
                    } else {
                        filter.employeeId = 'none';
                    }
                } else {
                    filter.employeeId = emp.id;
                }
            } else {
                filter.employeeId = 'none';
            }
        }

        if (status) filter.status = status;

        const appraisalsList = await prisma.appraisal.findMany({
            where: filter,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Collect all employee and manager IDs to resolve their names in batch
        const empIds = [...new Set(appraisalsList.map(a => a.employeeId).filter(Boolean))];
        const managerIds = [...new Set(appraisalsList.map(a => a.managerId).filter(Boolean))];

        const validEmpUUIDs = empIds.filter(isValidUUID);
        const employees = await prisma.employee.findMany({
            where: { 
                OR: [
                    ...(validEmpUUIDs.length > 0 ? [{ id: { in: validEmpUUIDs } }] : []),
                    { mongoId: { in: empIds } }
                ] 
            },
            select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true }
        });

        const validManagerUUIDs = managerIds.filter(isValidUUID);
        const managers = await prisma.employee.findMany({
            where: { 
                OR: [
                    ...(validManagerUUIDs.length > 0 ? [{ id: { in: validManagerUUIDs } }] : []),
                    { mongoId: { in: managerIds } }
                ] 
            },
            select: { id: true, mongoId: true, firstName: true, lastName: true, email: true }
        });

        // Build mapping dictionaries
        const empMap = {};
        employees.forEach(e => {
            const data = {
                _id: e.id,
                id: e.id,
                employeeId: e.employeeId,
                personalDetails: {
                    firstName: e.firstName,
                    lastName: e.lastName,
                    email: e.email,
                    phone: e.phone
                }
            };
            empMap[e.id] = data;
            if (e.mongoId) empMap[e.mongoId] = data;
        });

        const managerMap = {};
        managers.forEach(m => {
            const data = {
                _id: m.id,
                id: m.id,
                name: `${m.firstName} ${m.lastName}`,
                email: m.email
            };
            managerMap[m.id] = data;
            if (m.mongoId) managerMap[m.mongoId] = data;
        });

        // Map and flatten response structure to be compatible with MongoDB components
        const appraisals = appraisalsList.map(a => {
            const appData = a.appraisalData && typeof a.appraisalData === 'object' ? a.appraisalData : {};
            const empData = empMap[a.employeeId] || (a.employeeId ? { _id: a.employeeId, id: a.employeeId } : null);
            return {
                _id: a.id,
                id: a.id,
                employeeId: empData,
                employee: empData,
                managerId: a.managerId,
                manager: managerMap[a.managerId] || (a.managerId ? { name: "Manager" } : null),
                status: a.status,
                createdAt: a.createdAt,
                updatedAt: a.updatedAt,
                // Flatten fields inside appraisalData
                period: appData.period || "",
                startDate: appData.startDate || null,
                endDate: appData.endDate || null,
                selfRatings: appData.selfRatings || [],
                managerRatings: appData.managerRatings || [],
                peerRatings: appData.peerRatings || [],
                overallScore: appData.overallScore || 0,
                employeeStrengths: appData.employeeStrengths || [],
                improvementAreas: appData.improvementAreas || [],
                employeeComments: appData.employeeComments || "",
                managerComments: appData.managerComments || "",
                finalReviewDate: appData.finalReviewDate || null
            };
        });

        return NextResponse.json({ appraisals });
    } catch (error) {
        console.error("Error in GET /api/talent/appraisals:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// CREATE a new appraisal cycle/document
export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const {
            employeeId,
            managerId,
            period,
            startDate,
            endDate
        } = body;

        if (!employeeId || !period) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Resolve employee
        let employeeWhere = {};
        if (isValidUUID(employeeId)) {
            employeeWhere = { OR: [{ id: employeeId }, { mongoId: employeeId }] };
        } else {
            employeeWhere = { mongoId: employeeId };
        }
        const employee = await prisma.employee.findFirst({
            where: employeeWhere,
            select: { id: true, firstName: true }
        });

        if (!employee) {
            return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        // Resolve manager
        let resolvedManagerId = null;
        if (managerId) {
            let managerWhere = {};
            if (isValidUUID(managerId)) {
                managerWhere = { OR: [{ id: managerId }, { mongoId: managerId }] };
            } else {
                managerWhere = { mongoId: managerId };
            }
            const manager = await prisma.employee.findFirst({
                where: managerWhere,
                select: { id: true }
            });
            if (manager) resolvedManagerId = manager.id;
        } else {
            // Fallback manager is current logged in admin/supervisor
            resolvedManagerId = authUser.id;
        }

        const appraisal = await prisma.appraisal.create({
            data: {
                employeeId: employee.id,
                managerId: resolvedManagerId,
                status: 'Self-Appraisal',
                appraisalData: {
                    period,
                    startDate: startDate ? new Date(startDate).toISOString() : null,
                    endDate: endDate ? new Date(endDate).toISOString() : null,
                    selfRatings: [],
                    managerRatings: [],
                    peerRatings: [],
                    overallScore: 0,
                    employeeStrengths: [],
                    improvementAreas: [],
                    employeeComments: "",
                    managerComments: "",
                    finalReviewDate: null
                }
            }
        });

        // Log activity
        await logActivity({
            action: "created",
            entity: "Appraisal",
            entityId: appraisal.id,
            description: `New appraisal cycle '${period}' started for employee ${employee.firstName}`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name || "Admin"
            },
            req: request
        });

        return NextResponse.json({ ...appraisal, _id: appraisal.id }, { status: 201 });
    } catch (error) {
        console.error("Error in POST /api/talent/appraisals:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
