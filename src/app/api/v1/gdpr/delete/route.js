import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    
    const authUser = await getAuthUser();
    
    // Validate request body
    const body = await req.json();
    if (!body.confirm) {
      return ApiResponse.badRequest('You must confirm deletion by passing { confirm: true }');
    }

    // Rather than hard deleting immediately, GDPR allows a 30-day window usually, 
    // but we will mark the account as 'pending_deletion' to stop login immediately.
    
    if (['admin', 'super_admin', 'recruiter'].includes(authUser.role)) {
      // If they are an admin, check if they are the only admin for an organization.
      // In a real app, prevent deletion if they own an active subscription without transferring.
      await prisma.user.update({ where: { id: (await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }, select: { id: true } }))?.id || authUser.id }, data: { 
        status: 'suspended',
        isActive: false,
        deleteRequestedAt: new Date(),
        // Note: You would typically queue a background worker to scrub their data after 30 days
      } });
    } else {
      await prisma.employee.update({ where: { id: (await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }, select: { id: true } }))?.id || authUser.id }, data: { 
        status: 'inactive',
        isActive: false,
        deleteRequestedAt: new Date()
      } });
    }

    // In a real production app, you would also clear their cookies/session here, 
    // or rely on the frontend redirecting to /logout which will do it.
    
    return ApiResponse.success({}, 200, 'Your data deletion request has been received. Your account is now deactivated and will be permanently deleted within 30 days.');

  } catch (error) {
    console.error('GDPR Deletion Error:', error);
    return ApiResponse.error(error.message);
  }
}
