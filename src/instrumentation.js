// src/instrumentation.js
// This file runs once when the server starts (Next.js 15+)

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeCronJobs } = await import('./lib/cron/init');
    initializeCronJobs();
  }
}