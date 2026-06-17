import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  
  try {
    // Check database connection using prisma query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    console.error('Health check DB error:', error);
    dbStatus = 'error';
  }

  const responseTime = Date.now() - startTime;
  const isHealthy = dbStatus === 'connected';
  const status = isHealthy ? 200 : 503;

  return ApiResponse.success({
    status: isHealthy ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    responseTime: `${responseTime}ms`,
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV,
  }, status);
}
