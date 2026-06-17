import { NextResponse } from "next/server";

// GET - Fetch notification settings
export async function GET(request) {
  try {
    // In a real application, these would be stored in a database
    // For now, we'll return environment variables and default values
    const settings = {
      attendanceReportEmail: process.env.ATTENDANCE_REPORT_EMAIL || '',
      attendanceThresholdEmail: process.env.ATTENDANCE_THRESHOLD_EMAIL || '',
      documentReminderEmail: process.env.DOCUMENT_REMINDER_EMAIL || '',
      cronSecret: process.env.CRON_SECRET || '',
      enableCron: process.env.ENABLE_CRON !== 'false', // Default to true
      smtpHost: process.env.SMTP_HOST || '',
      smtpPort: process.env.SMTP_PORT || '',
      smtpUser: process.env.SMTP_USER || '',
      smtpPass: process.env.SMTP_PASS || ''
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update notification settings
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      attendanceReportEmail,
      attendanceThresholdEmail,
      documentReminderEmail,
      cronSecret,
      enableCron,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass
    } = body;

    // In a real application, you would save these to a database
    // For now, we'll just validate and return success
    // The actual environment variables would need to be updated manually or through a deployment process

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (attendanceReportEmail && !emailRegex.test(attendanceReportEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid attendance report email format" },
        { status: 400 }
      );
    }

    if (attendanceThresholdEmail && !emailRegex.test(attendanceThresholdEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid threshold alert email format" },
        { status: 400 }
      );
    }

    if (documentReminderEmail && !emailRegex.test(documentReminderEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid document reminder email format" },
        { status: 400 }
      );
    }

    // In a production environment, you would:
    // 1. Save to database
    // 2. Update environment variables
    // 3. Restart services if needed

    return NextResponse.json({
      success: true,
      message: "Notification settings updated successfully. Note: Environment variables may need to be updated manually.",
      settings: {
        attendanceReportEmail,
        attendanceThresholdEmail,
        documentReminderEmail,
        cronSecret,
        enableCron,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass: smtpPass ? '***' : '' // Don't return password
      }
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
