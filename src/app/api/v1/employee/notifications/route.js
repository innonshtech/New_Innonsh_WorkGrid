import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-util";
import prisma from "@/lib/db/prisma";

function isValidUUID(str) {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// GET - Fetch user notifications
export async function GET(req) {
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        let employeeData = null;
        if (isValidUUID(user.id)) {
            employeeData = await prisma.employee.findUnique({
                where: { id: user.id }
            });
        }
        if (!employeeData) {
            employeeData = await prisma.employee.findFirst({
                where: { mongoId: user.id }
            });
        }

        const actualEmployeeId = employeeData?.id || user.id;

        // Fetch notifications assigned to this employee (directly or via MongoDB legacy mapping)
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { employeeId: actualEmployeeId },
                    { mongoId: user.id } // Fallback for legacy employee matches
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const formattedNotifications = notifications.map(notification => ({
            _id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: "normal", // mapped from standard data
            read: notification.isRead,
            createdAt: notification.createdAt,
            organization: employeeData?.organizationId || null,
            details: {}
        }));

        return NextResponse.json({
            success: true,
            notifications: formattedNotifications
        });

    } catch (error) {
        console.error("Error fetching employee notifications:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// PUT - Mark as read
export async function PUT(req) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { notificationId } = await req.json();

        // Check if the notification exists
        let notification = null;
        if (isValidUUID(notificationId)) {
            notification = await prisma.notification.findUnique({
                where: { id: notificationId }
            });
        }

        // Fallback for mongoId lookup
        let targetId = null;
        if (notification) {
            targetId = notification.id;
        } else {
            const legacyNotification = await prisma.notification.findFirst({
                where: { mongoId: notificationId }
            });
            if (legacyNotification) {
                targetId = legacyNotification.id;
            } else {
                return NextResponse.json({ message: "Notification not found" }, { status: 404 });
            }
        }

        // Update the notification to read
        await prisma.notification.update({
            where: { id: targetId },
            data: { isRead: true }
        });

        return NextResponse.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error("Error updating notification:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
