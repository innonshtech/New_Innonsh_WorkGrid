import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh_fallback`;
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(req) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error: JWT_SECRET missing' }, { status: 500 });
    }

    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token not found' }, { status: 401 });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    } catch (err) {
      console.error('Invalid refresh token:', err.message);
      return NextResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    if (!decoded.isRefresh || !decoded.id) {
      return NextResponse.json({ message: 'Invalid token payload' }, { status: 401 });
    }

    // Check against database to ensure it hasn't been revoked
    let dbUser;
    if (decoded.role === 'admin' || decoded.role === 'super_admin' || (decoded.department && decoded.department.toLowerCase() === 'admin')) {
        dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    } else {
        dbUser = await prisma.employee.findUnique({ where: { id: decoded.id } });
    }

    if (!dbUser || dbUser.sessionToken !== refreshToken) {
      console.warn(`Refresh token mismatch or user not found for ID: ${decoded.id}`);
      return NextResponse.json({ message: 'Session revoked or invalid' }, { status: 401 });
    }

    // Generate new Access and Refresh tokens
    const payload = {
      id: decoded.id,
      role: decoded.role,
      department: decoded.department,
      organizationId: decoded.organizationId,
      designation: decoded.designation
    };

    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_MAX_AGE });
    const newRefreshToken = jwt.sign({ ...payload, isRefresh: true }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_MAX_AGE });

    // Update database with new refresh token
    if (decoded.role === 'admin' || decoded.role === 'super_admin' || (decoded.department && decoded.department.toLowerCase() === 'admin')) {
        await prisma.user.update({
            where: { id: dbUser.id },
            data: { sessionToken: newRefreshToken }
        });
    } else {
        await prisma.employee.update({
            where: { id: dbUser.id },
            data: { sessionToken: newRefreshToken }
        });
    }

    const res = NextResponse.json({ success: true, message: 'Tokens refreshed successfully' });

    res.cookies.set('authToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE
    });

    res.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE
    });

    return res;

  } catch (err) {
    console.error('Refresh token error:', err);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}
