// src/lib/cron/init.js
import { startAttendanceCron } from './attendance-cron';
import { startDocumentReminderCron } from './document-reminder-cron';

let initialized = false;

export function initializeCronJobs() {
  // Prevent multiple initializations
  if (initialized) {
    console.log('⚠️  Cron jobs already initialized');
    return;
  }

  // Only run in production or when explicitly enabled
  const shouldRunCron = process.env.NODE_ENV === 'production' || 
                        process.env.ENABLE_CRON === 'true';

  if (!shouldRunCron) {
    console.log('ℹ️  Cron jobs disabled (not in production mode)');
    console.log('ℹ️  Set ENABLE_CRON=true in .env.local to enable in development');
    return;
  }

  console.log('🔄 Initializing cron jobs...');
  
  try {
    // Start attendance report cron
    startAttendanceCron();
    
    // Start document reminder cron
    startDocumentReminderCron();
    
    initialized = true;
    console.log('✅ All cron jobs initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize cron jobs:', error);
  }
}

// Cleanup function for graceful shutdown
export function shutdownCronJobs() {
  const { stopAttendanceCron } = require('./attendance-cron');
  const { stopDocumentReminderCron } = require('./document-reminder-cron');
  
  console.log('🛑 Shutting down cron jobs...');
  stopAttendanceCron();
  stopDocumentReminderCron();
  initialized = false;
  console.log('✅ Cron jobs shutdown complete');
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownCronJobs);
  process.on('SIGINT', shutdownCronJobs);
}