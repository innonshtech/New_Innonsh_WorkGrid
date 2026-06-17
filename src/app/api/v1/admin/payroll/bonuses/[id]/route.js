import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';



import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

async function getUserFromRequest(req) {
    const token = req.cookies.get("authToken")?.value || req.cookies.get("employee_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function PUT(req, { params }) {
    
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        const bonus = await prisma.bonus.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!bonus) {
            return NextResponse.json({ message: "Bonus not found" }, { status: 404 });
        }

        const updateData = {};
        if (status) {
            updateData.status = status;
            if (status === 'Approved') {
                updateData.approvedBy = user.id;
            }
        }

        const updatedBonus = await prisma.bonus.update({
            where: { id: bonus.id },
            data: updateData
        });

        // --- Notification Logic on Status Change ---
        if (status === 'Approved' || status === 'Paid' || status === 'Rejected') {
            let targetEmployeeIds = [];

            const bonusData = updatedBonus.bonusData || {};

            if (bonusData.targetAudience === 'Individual') {
                targetEmployeeIds = bonusData.employees || [];
            } else if (bonusData.targetAudience === 'Department') {
                const departmentEmployees = await prisma.employee.findMany({ 
                    where: { organizationId: updatedBonus.organizationId },
                    select: { id: true }
                });
                targetEmployeeIds = departmentEmployees.map(e => e.id);
            } else if (bonusData.targetAudience === 'All') {
                const allEmployees = await prisma.employee.findMany({ 
                    where: { organizationId: updatedBonus.organizationId },
                    select: { id: true }
                });
                targetEmployeeIds = allEmployees.map(e => e.id);
            }

            if (targetEmployeeIds.length > 0) {
                await prisma.notification.createMany({
                    data: targetEmployeeIds.map(empId => ({
                        type: 'bonus',
                        title: `Bonus Update: ${bonusData.title || updatedBonus.title || 'Bonus'}`,
                        message: `Your bonus status has been updated to: ${status}.`,
                        priority: status === 'Paid' ? 'high' : 'medium',
                        employeeId: empId,
                        notificationData: {
                            bonusId: updatedBonus.id,
                            status: status,
                            actionDate: new Date()
                        }
                    }))
                });
            }
        }
        // -------------------------------------------

        return NextResponse.json({ message: "Bonus updated successfully", bonus: updatedBonus });

    } catch (error) {
        console.error("Error updating bonus:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const bonus = await prisma.bonus.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        if (!bonus) {
            return NextResponse.json({ message: "Bonus not found" }, { status: 404 });
        }

        if (bonus.status !== 'Pending') {
            return NextResponse.json({ message: "Cannot delete processed bonus" }, { status: 400 });
        }

        await prisma.bonus.delete({ where: { id: bonus.id } });

        // Optional: Notify deletion? Usually not needed if it was just Pending.

        return NextResponse.json({ message: "Bonus deleted successfully" });

    } catch (error) {
        console.error("Error deleting bonus:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
