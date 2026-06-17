import { NextResponse } from "next/server";

// PUT - Mark notification as read
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    // In a real application, you would update the notification in the database
    // For now, we'll just return success since this is a mock implementation

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notificationId: id
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}