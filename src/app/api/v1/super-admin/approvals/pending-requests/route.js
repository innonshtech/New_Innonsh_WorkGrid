// src/app/api/super-admin/pending-requests/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(req) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ['super_admin']);

    

    const users = await prisma.user.findMany({ where: { status: 'pending' } });
    const pendingUsers = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json({ success: true, count: pendingUsers.length, requests: pendingUsers });
  } catch (error) {
    console.error('Pending requests fetch error:', error);
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
