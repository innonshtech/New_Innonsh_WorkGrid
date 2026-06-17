import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * EMERGENCY INITIALIZATION: Creates the very first Super Admin.
 * INSTRUCTIONS: Delete this file or remove this route after use in production!
 */
export async function GET() {
  try {
    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: 'super_admin' } });
    if (existingSuperAdmin) {
      return NextResponse.json({ message: 'Super Admin already exists' }, { status: 400 });
    }

    // Default credentials for the first super admin
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Platform Owner',
        email: 'owner@bizmate.com',
        password: 'SuperSecurePassword123!', // This would typically be hashed before saving in a real app, perhaps in a service layer or via a middleware.
        role: 'super_admin',
        isActive: true,
        status: 'active'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Super Admin created successfully!',
      credentials: {
        email: 'owner@bizmate.com',
        password: 'SuperSecurePassword123!'
      }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error: ' + error.message }, { status: 500 });
  }
}

// Also support POST for Postman convenience
export async function POST() {
  return GET();
}
