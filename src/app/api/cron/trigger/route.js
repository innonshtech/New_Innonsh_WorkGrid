// src/app/api/cron/trigger/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

// POST - Manually trigger attendance report
export async function POST(request) {
  try {
    console.log("🔧 Manual trigger for attendance report");

    // Import the trigger function
    const { triggerAttendanceReportNow } = await import('@/lib/cron/attendance-cron');
    
    await triggerAttendanceReportNow();

    return NextResponse.json({
      success: true,
      message: "Attendance report triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error triggering attendance report:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

// GET - Check cron job status
export async function GET(request) {
  try {
    const { getCronStatus } = await import('@/lib/cron/attendance-cron');
    
    const status = getCronStatus();

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting cron status:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
