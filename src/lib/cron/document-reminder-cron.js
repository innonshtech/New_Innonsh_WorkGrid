// src/lib/cron/document-reminder-cron.js
import cron from 'node-cron';
import fetch from 'node-fetch';

let documentReminderCronJob = null;

// Function to trigger document reminder processing
async function triggerDocumentReminders() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';

    console.log('📋 Triggering document reminder check...');

    const response = await fetch(`${baseUrl}/api/cron/document-reminders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Document reminder check completed:', result);

  } catch (error) {
    console.error('❌ Error triggering document reminders:', error);
  }
}

// Start the document reminder cron job
export function startDocumentReminderCron() {
  // Run every day at 9 AM
  const cronSchedule = '0 9 * * *';

  console.log('📅 Scheduling document reminder cron job:', cronSchedule);

  documentReminderCronJob = cron.schedule(cronSchedule, triggerDocumentReminders, {
    scheduled: false, // Don't start immediately
  });

  documentReminderCronJob.start();
  console.log('✅ Document reminder cron job started');
}

// Stop the document reminder cron job
export function stopDocumentReminderCron() {
  if (documentReminderCronJob) {
    documentReminderCronJob.stop();
    documentReminderCronJob = null;
    console.log('🛑 Document reminder cron job stopped');
  }
}

// Manual trigger for testing
export async function manualTriggerDocumentReminders() {
  console.log('🔧 Manual trigger for document reminders');
  await triggerDocumentReminders();
}