import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";

const isValidUUID = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// GET single appraisal
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const whereClause = isValidUUID(id)
            ? { OR: [{ id: id }, { mongoId: id }] }
            : { mongoId: id };

        const appraisal = await prisma.appraisal.findFirst({
            where: whereClause
        });

        if (!appraisal) {
            return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
        }

        // Fetch employee
        let employee = null;
        if (appraisal.employeeId) {
            const empWhere = isValidUUID(appraisal.employeeId)
                ? { OR: [{ id: appraisal.employeeId }, { mongoId: appraisal.employeeId }] }
                : { mongoId: appraisal.employeeId };
            employee = await prisma.employee.findFirst({
                where: empWhere,
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true }
            });
        }

        // Fetch manager
        let manager = null;
        if (appraisal.managerId) {
            const mgrWhere = isValidUUID(appraisal.managerId)
                ? { OR: [{ id: appraisal.managerId }, { mongoId: appraisal.managerId }] }
                : { mongoId: appraisal.managerId };
            manager = await prisma.employee.findFirst({
                where: mgrWhere,
                select: { id: true, mongoId: true, firstName: true, lastName: true, email: true }
            });
        }

        const appData = appraisal.appraisalData && typeof appraisal.appraisalData === 'object' ? appraisal.appraisalData : {};

        const empData = employee ? {
                _id: employee.id,
                id: employee.id,
                employeeId: employee.employeeId,
                personalDetails: {
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                    email: employee.email,
                    phone: employee.phone
                }
            } : null;

        const responseObj = {
            _id: appraisal.id,
            id: appraisal.id,
            employeeId: empData,
            employee: empData,
            managerId: appraisal.managerId,
            manager: manager ? {
                _id: manager.id,
                id: manager.id,
                name: `${manager.firstName} ${manager.lastName}`,
                email: manager.email
            } : null,
            status: appraisal.status,
            createdAt: appraisal.createdAt,
            updatedAt: appraisal.updatedAt,
            // Flatten fields from appraisalData
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

        return NextResponse.json(responseObj);
    } catch (error) {
        console.error("Error in GET /api/talent/appraisals/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE appraisal (Ratings, Comments, Status)
export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        const { id } = await params;
        const body = await request.json();

        const whereClause = isValidUUID(id)
            ? { OR: [{ id: id }, { mongoId: id }] }
            : { mongoId: id };

        const existingAppraisal = await prisma.appraisal.findFirst({
            where: whereClause
        });

        if (!existingAppraisal) {
            return NextResponse.json({ error: "Appraisal not found" }, { status: 404 });
        }

        // Fetch employee to get personalDetails for logging
        let employee = null;
        if (existingAppraisal.employeeId) {
            const empWhere = isValidUUID(existingAppraisal.employeeId)
                ? { OR: [{ id: existingAppraisal.employeeId }, { mongoId: existingAppraisal.employeeId }] }
                : { mongoId: existingAppraisal.employeeId };
            employee = await prisma.employee.findFirst({
                where: empWhere,
                select: { id: true, firstName: true, lastName: true, employeeId: true }
            });
        }

        const existingData = existingAppraisal.appraisalData && typeof existingAppraisal.appraisalData === 'object' ? existingAppraisal.appraisalData : {};

        // Merge existing JSON data with incoming updates
        const newAppraisalData = {
            ...existingData,
            period: body.period !== undefined ? body.period : existingData.period,
            startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate).toISOString() : null) : existingData.startDate,
            endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate).toISOString() : null) : existingData.endDate,
            selfRatings: body.selfRatings !== undefined ? body.selfRatings : existingData.selfRatings || [],
            managerRatings: body.managerRatings !== undefined ? body.managerRatings : existingData.managerRatings || [],
            peerRatings: body.peerRatings !== undefined ? body.peerRatings : existingData.peerRatings || [],
            overallScore: body.overallScore !== undefined ? Number(body.overallScore) : existingData.overallScore || 0,
            employeeStrengths: body.employeeStrengths !== undefined ? body.employeeStrengths : existingData.employeeStrengths || [],
            improvementAreas: body.improvementAreas !== undefined ? body.improvementAreas : existingData.improvementAreas || [],
            employeeComments: body.employeeComments !== undefined ? body.employeeComments : existingData.employeeComments || "",
            managerComments: body.managerComments !== undefined ? body.managerComments : existingData.managerComments || "",
            finalReviewDate: body.finalReviewDate !== undefined ? (body.finalReviewDate ? new Date(body.finalReviewDate).toISOString() : null) : existingData.finalReviewDate
        };

        const updateData = {
            appraisalData: newAppraisalData
        };

        if (body.status !== undefined) {
            updateData.status = body.status;
        }

        if (body.managerId !== undefined) {
            let resolvedManagerId = null;
            if (body.managerId) {
                const mgrWhere = isValidUUID(body.managerId)
                    ? { OR: [{ id: body.managerId }, { mongoId: body.managerId }] }
                    : { mongoId: body.managerId };
                const manager = await prisma.employee.findFirst({
                    where: mgrWhere,
                    select: { id: true }
                });
                if (manager) resolvedManagerId = manager.id;
            }
            updateData.managerId = resolvedManagerId;
        }

        const updatedAppraisal = await prisma.appraisal.update({
            where: { id: existingAppraisal.id },
            data: updateData
        });

        // Log activity
        await logActivity({
            action: "updated",
            entity: "Appraisal",
            entityId: updatedAppraisal.id,
            description: `Appraisal for ${employee ? employee.firstName : "employee"} updated to ${updatedAppraisal.status}`,
            performedBy: {
                userId: authUser.id,
                name: authUser.name || "Sync System"
            },
            req: request
        });

        // Construct final shaped response
        const finalAppData = updatedAppraisal.appraisalData && typeof updatedAppraisal.appraisalData === 'object' ? updatedAppraisal.appraisalData : {};
        const empData = employee ? {
                _id: employee.id,
                id: employee.id,
                employeeId: employee.employeeId,
                personalDetails: {
                    firstName: employee.firstName,
                    lastName: employee.lastName
                }
            } : null;

        const responseObj = {
            _id: updatedAppraisal.id,
            id: updatedAppraisal.id,
            employeeId: empData,
            employee: empData,
            managerId: updatedAppraisal.managerId,
            status: updatedAppraisal.status,
            createdAt: updatedAppraisal.createdAt,
            updatedAt: updatedAppraisal.updatedAt,
            // Flatten fields from appraisalData
            period: finalAppData.period || "",
            startDate: finalAppData.startDate || null,
            endDate: finalAppData.endDate || null,
            selfRatings: finalAppData.selfRatings || [],
            managerRatings: finalAppData.managerRatings || [],
            peerRatings: finalAppData.peerRatings || [],
            overallScore: finalAppData.overallScore || 0,
            employeeStrengths: finalAppData.employeeStrengths || [],
            improvementAreas: finalAppData.improvementAreas || [],
            employeeComments: finalAppData.employeeComments || "",
            managerComments: finalAppData.managerComments || "",
            finalReviewDate: finalAppData.finalReviewDate || null
        };

        return NextResponse.json(responseObj);
    } catch (error) {
        console.error("Error in PUT /api/talent/appraisals/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}