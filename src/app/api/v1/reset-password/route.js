// src/app/api/v1/reset-password/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db/prisma';

export async function POST(request) {
  try {
    const { token, newPassword, role = 'admin' } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Hash the incoming raw token to compare with stored hashed token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user/employee with matching token that hasn't expired
    let targetEntity = null;
    const now = new Date();

    if (role === 'employee') {
      targetEntity = await prisma.employee.findFirst({
        where: {
          forgotPasswordToken: hashedToken,
          forgotPasswordExpires: { gt: now }
        }
      });
    } else {
      targetEntity = await prisma.user.findFirst({
        where: {
          forgotPasswordToken: hashedToken,
          forgotPasswordExpires: { gt: now }
        }
      });
    }

    if (!targetEntity) {
      return NextResponse.json({
        error: 'Password reset link is invalid or has expired. Please request a new one.',
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save the new password and clear token
    if (role === 'employee') {
      await prisma.employee.update({
        where: { id: targetEntity.id },
        data: {
          password: hashedPassword,
          forgotPasswordToken: null,
          forgotPasswordExpires: null,
          sessionToken: null
        }
      });
    } else {
      await prisma.user.update({
        where: { id: targetEntity.id },
        data: {
          password: hashedPassword,
          forgotPasswordToken: null,
          forgotPasswordExpires: null,
          sessionToken: null
        }
      });
    }

    return NextResponse.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
