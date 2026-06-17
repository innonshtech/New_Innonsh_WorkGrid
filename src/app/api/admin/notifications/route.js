import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        success: true,
        notifications: []
    });
}

export async function PUT() {
    return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
    });
}
