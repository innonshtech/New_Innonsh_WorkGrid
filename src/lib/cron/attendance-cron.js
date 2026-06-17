// src/lib/cron/attendance-cron.js
import cron from 'node-cron';

let cronJob = null;

// Function to send attendance report
async function sendAttendanceReport() {
  try {
    console.log('⏰ Running scheduled attendance report at', new Date().toISOString());

    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/cron/attendance-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'internal-cron'}`,
      },
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Attendance report sent successfully');
      console.log('📊 Summary:', data.data?.reportData?.summary);
    } else {
      console.error('❌ Failed to send attendance report:', data.error);
    }
  } catch (error) {
    console.error('❌ Error in scheduled attendance report:', error.message);
  }
}

// Initialize cron job
export function startAttendanceCron() {
  // Prevent multiple instances
  if (cronJob) {
    console.log('⚠️  Cron job already running, skipping initialization');
    return;
  }

  // Schedule: Run at 2:00 PM every day
  // Cron format: second minute hour day month weekday
  // '0 14 * * *' = At 14:00 (2 PM) every day
  cronJob = cron.schedule('5 17 * * *', sendAttendanceReport, {
    scheduled: true,
    timezone: process.env.TIMEZONE || "Asia/Kolkata", // Set your timezone
  });

  console.log('🚀 Attendance report cron job started');
  console.log('⏰ Scheduled to run daily at 2:00 PM');
  console.log('🌍 Timezone:', process.env.TIMEZONE || "Asia/Kolkata");
}

// Stop cron job (useful for cleanup)
export function stopAttendanceCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Attendance report cron job stopped');
  }
}

// Manual trigger for testing
export async function triggerAttendanceReportNow() {
  console.log('🔧 Manual trigger initiated');
  await sendAttendanceReport();
}

// Export cron job instance for monitoring
export function getCronStatus() {
  return {
    isRunning: cronJob ? true : false,
    nextRun: cronJob ? 'Daily at 2:00 PM' : 'Not scheduled',
    timezone: process.env.TIMEZONE || "Asia/Kolkata",
  };
}