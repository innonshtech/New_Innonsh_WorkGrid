import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { sendDocumentReminderNotification } from "@/utils/notifications";

// Function to process document reminders
async function processDocumentReminders() {
  try {
    console.log("🔄 Processing document reminders...");

    const now = new Date();

    // Find reminders that are due
    const dueReminders = await prisma.documentReminder.findMany({
      where: {
        status: 'pending',
        missingDocuments: {
          some: {
            nextReminderDate: { lte: now },
            reminderSent: false,
          },
        },
      },
      include: {
        employee: { // Assuming 'employeeId' in Mongoose maps to an 'employee' relation in Prisma
          select: {
            id: true, // Prisma's primary ID
            mongoId: true, // Include mongoId if it's potentially needed elsewhere or for legacy identification
            employeeId: true, // The string identifier like "EMP001"
            personalDetails: true,
            jobDetails: true,
          },
        },
      },
    });

    console.log(`📋 Found ${dueReminders.length} due reminders`);

    for (const reminder of dueReminders) {
      const employee = reminder.employee;
      if (!employee) {
        console.log(`⚠️ Employee not found for reminder ${reminder.id}`);
        continue;
      }

      // Get unsent reminders
      const unsentReminders = reminder.missingDocuments.filter(doc => !doc.reminderSent);

      if (unsentReminders.length === 0) {
        // Mark reminder as completed if all documents have been reminded
        await prisma.documentReminder.update({
          where: {
            id: reminder.id, // Using Prisma's primary ID which is reliable from findMany result
          },
          data: { status: 'completed' },
        });
        continue;
      }

      // Send reminder notification
      try {
        await sendDocumentReminderNotification({
          employee,
          missingDocuments: unsentReminders,
          reminderDays: 7 // Default, could be configurable
        });

        // Update reminder status
        // Prisma does not have direct Mongoose-like array positional operators (`$[]`).
        // Instead, we fetch the array, modify it in-memory, and then update the entire array.
        const nextReminderDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now

        const updatedMissingDocuments = reminder.missingDocuments.map(doc => ({
          ...doc,
          reminderSent: true,
          reminderDate: now,
          nextReminderDate: nextReminderDate,
        }));

        await prisma.documentReminder.update({
          where: {
            id: reminder.id, // Using Prisma's primary ID
          },
          data: {
            missingDocuments: updatedMissingDocuments,
          },
        });

        console.log(`✅ Reminder sent for employee ${employee.employeeId}`);

      } catch (error) {
        console.error(`❌ Failed to send reminder for employee ${employee.employeeId}:`, error);
      }
    }

    return { processed: dueReminders.length };

  } catch (error) {
    console.error("❌ Error processing document reminders:", error);
    throw error;
  }
}

// POST - Manual trigger (for testing)
export async function POST(request) {
  try {
    console.log("🚀 Manual document reminder trigger");

    const result = await processDocumentReminders();

    return NextResponse.json({
      success: true,
      message: `Document reminders processed: ${result.processed} reminders sent`,
      data: result,
    });
  } catch (error) {
    console.error("Error in POST /api/cron/document-reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

// GET - Scheduled cron job endpoint
export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("⏰ Scheduled document reminder trigger at", new Date().toISOString());

    const result = await processDocumentReminders();

    return NextResponse.json({
      success: true,
      message: `Document reminders processed: ${result.processed} reminders sent`,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/document-reminders:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
