import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser } from "@/lib/auth-util";

const isUUID = (val) => typeof val === 'string' && val.length === 36 && val.includes('-');

// GET single performance goal
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const whereClause = isUUID(id)
            ? { OR: [{ id: id }, { mongoId: id }] }
            : { mongoId: id };

        const goal = await prisma.performanceGoal.findFirst({
            where: whereClause
        });

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        let employee = null;
        if (goal.employeeId) {
            employee = await prisma.employee.findFirst({
                where: { OR: [{ id: goal.employeeId }, { mongoId: goal.employeeId }] },
                select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true }
            });
        }

        const gData = goal.goalData && typeof goal.goalData === 'object' ? goal.goalData : {};

        const responseObj = {
            _id: goal.id,
            id: goal.id,
            employeeId: goal.employeeId,
            employee: employee ? {
                _id: employee.id,
                id: employee.id,
                employeeId: employee.employeeId,
                personalDetails: {
                    firstName: employee.firstName,
                    lastName: employee.lastName
                }
            } : null,
            title: goal.title,
            status: goal.status,
            progress: goal.progress,
            createdAt: goal.createdAt,
            updatedAt: goal.updatedAt,
            // Flatten goalData dynamic attributes
            description: gData.description || "",
            category: gData.category || "General",
            startDate: gData.startDate || null,
            endDate: gData.endDate || null,
            priority: gData.priority || "Medium",
            keyResults: gData.keyResults || [],
            feedback: gData.feedback || []
        };

        return NextResponse.json(responseObj);
    } catch (error) {
        console.error("Error in GET /api/talent/goals/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE performance goal (Progress, Status, Key Results, Feedback)
export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        const { id } = await params;
        const body = await request.json();

        const whereClause = isUUID(id)
            ? { OR: [{ id: id }, { mongoId: id }] }
            : { mongoId: id };

        const currentGoal = await prisma.performanceGoal.findFirst({
            where: whereClause
        });

        if (!currentGoal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        let employee = null;
        if (currentGoal.employeeId) {
            employee = await prisma.employee.findFirst({
                where: { OR: [{ id: currentGoal.employeeId }, { mongoId: currentGoal.employeeId }] },
                select: { id: true, firstName: true, lastName: true }
            });
        }

        const existingData = currentGoal.goalData && typeof currentGoal.goalData === 'object' ? currentGoal.goalData : {};

        // Prepare updates
        const updateData = {};
        if (body.status !== undefined) updateData.status = body.status;
        if (body.progress !== undefined) updateData.progress = Number(body.progress);

        // Update keyResults & feedback inside JSON object
        const newGoalData = {
            ...existingData,
            description: body.description !== undefined ? body.description : existingData.description || "",
            category: body.category !== undefined ? body.category : existingData.category || "Development",
            startDate: body.startDate !== undefined ? new Date(body.startDate).toISOString() : existingData.startDate,
            endDate: body.endDate !== undefined ? new Date(body.endDate).toISOString() : existingData.endDate,
            priority: body.priority !== undefined ? body.priority : existingData.priority || "Medium",
            keyResults: body.keyResults !== undefined ? body.keyResults : existingData.keyResults || []
        };

        if (body.feedback !== undefined) {
            const existingFeedback = Array.isArray(existingData.feedback) ? existingData.feedback : [];
            newGoalData.feedback = [...existingFeedback, body.feedback];
        }

        updateData.goalData = newGoalData;

        const updatedGoal = await prisma.performanceGoal.update({
            where: { id: currentGoal.id },
            data: updateData
        });

        // Log activity
        await logActivity({
            action: "updated",
            entity: "PerformanceGoal",
            entityId: updatedGoal.id,
            description: `Performance goal '${updatedGoal.title}' updated for ${employee ? employee.firstName : "employee"} (${updatedGoal.progress}%)`,
            performedBy: {
                userId: body.performedBy || authUser.id,
                name: authUser.name || "Sync System"
            },
            req: request
        });

        const finalData = updatedGoal.goalData && typeof updatedGoal.goalData === 'object' ? updatedGoal.goalData : {};
        const responseObj = {
            _id: updatedGoal.id,
            id: updatedGoal.id,
            employeeId: updatedGoal.employeeId,
            employee: employee ? {
                _id: employee.id,
                id: employee.id,
                personalDetails: {
                    firstName: employee.firstName,
                    lastName: employee.lastName
                }
            } : null,
            title: updatedGoal.title,
            status: updatedGoal.status,
            progress: updatedGoal.progress,
            createdAt: updatedGoal.createdAt,
            updatedAt: updatedGoal.updatedAt,
            // Flatten goalData dynamic attributes
            description: finalData.description || "",
            category: finalData.category || "General",
            startDate: finalData.startDate || null,
            endDate: finalData.endDate || null,
            priority: finalData.priority || "Medium",
            keyResults: finalData.keyResults || [],
            feedback: finalData.feedback || []
        };

        return NextResponse.json(responseObj);
    } catch (error) {
        console.error("Error in PUT /api/talent/goals/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE a performance goal
export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const whereClause = isUUID(id)
            ? { OR: [{ id: id }, { mongoId: id }] }
            : { mongoId: id };

        const goal = await prisma.performanceGoal.findFirst({
            where: whereClause,
            select: { id: true }
        });

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        await prisma.performanceGoal.delete({
            where: { id: goal.id }
        });

        return NextResponse.json({ message: "Goal deleted successfully" });
    } catch (error) {
        console.error("Error in DELETE /api/talent/goals/[id]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}