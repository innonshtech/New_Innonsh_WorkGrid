import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
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

        let bonus = await prisma.bonus.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });
        
        if (!bonus) {
            return NextResponse.json({ message: "Bonus not found" }, { status: 404 });
        }

        let updateData = { status: status || bonus.status };

        if (status) {
            if (status === 'Approved') {
                updateData.approvedBy = user.id;
            }
        }

        bonus = await prisma.bonus.update({
            where: { id: bonus.id },
            data: updateData
        });

        // --- Notification Logic on Status Change ---
        if (status === 'Approved' || status === 'Paid' || status === 'Rejected') {
            let targetEmployeeIds = [];

            // Since Bonus in Prisma doesn't capture targetAudience directly in the top-level schema easily without looking at bonusData or if it's there
            // Assuming we check the employeeId field or what was stored earlier
            if (bonus.employeeId) {
                targetEmployeeIds = [bonus.employeeId];
            } else {
                 // Try to see if it was stored in Mongo and we need to fetch employees from there?
                 // Or we query all employees if it was 'All'
                 // In Prisma migration, we map 'employeeId' for Individual.
                 // For now, let's assume it's attached to a single employee.
            }

            if (targetEmployeeIds.length > 0) {
                const notifications = targetEmployeeIds.map(empId => ({
                    type: 'System',
                    title: `Bonus Update: ${bonus.reason || 'Bonus'}`,
                    message: `Your bonus status has been updated to: ${status}.`,
                    employeeId: empId,
                    isRead: false
                }));

                for (const notif of notifications) {
                    await prisma.notification.create({
                        data: notif
                    });
                }
            }
        }
        // -------------------------------------------

        return NextResponse.json({ message: "Bonus updated successfully", bonus });

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
        const bonus = await prisma.bonus.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!bonus) {
            return NextResponse.json({ message: "Bonus not found" }, { status: 404 });
        }

        if (bonus.status !== 'Pending') {
            return NextResponse.json({ message: "Cannot delete processed bonus" }, { status: 400 });
        }

        await prisma.bonus.delete({
            where: { id: bonus.id }
        });

        return NextResponse.json({ message: "Bonus deleted successfully" });

    } catch (error) {
        console.error("Error deleting bonus:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
