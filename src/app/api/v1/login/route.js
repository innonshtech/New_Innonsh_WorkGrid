import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';
import { sanitizeString } from '@/lib/sanitize';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || `${JWT_SECRET}_refresh_fallback`;
const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function checkDobMatch(rawDob, inputPassword) {
  if (!rawDob || !inputPassword) return false;
  const dobDate = new Date(rawDob);
  if (isNaN(dobDate.getTime())) return false;

  const dobStringUTC = dobDate.toISOString().split('T')[0];
  const y = dobDate.getFullYear();
  const m = String(dobDate.getMonth() + 1).padStart(2, '0');
  const d = String(dobDate.getDate()).padStart(2, '0');
  const dobStringLocal = `${y}-${m}-${d}`;

  const checkVariations = (dateStr) => {
    const [yy, mm, dd] = dateStr.split('-');
    return [
      dateStr,
      `${dd}-${mm}-${yy}`,
      `${dd}/${mm}/${yy}`
    ];
  };

  const allValidVariations = [
    ...checkVariations(dobStringUTC),
    ...checkVariations(dobStringLocal)
  ];

  return allValidVariations.includes(inputPassword.trim());
}

export async function POST(req) {
  try {
    const startTime = Date.now();
    console.log(`--- Login API Hit [${new Date().toISOString()}] ---`);

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ message: 'Server configuration error: JWT_SECRET missing' }, { status: 500 });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const username = sanitizeString((body.username || '').toString().trim());
    const password = sanitizeString((body.password || '').toString().trim());
    const role = sanitizeString((body.role || '').toString().trim().toLowerCase());

    console.log('Login attempt details:', { username, role, time: new Date().toISOString() });

    if (!username || !password || !role) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // --- ADMIN / SUPER ADMIN LOGIN ---
    if (role === 'admin') {
      const emailOrUsername = username.toLowerCase();

      // Check both email and employeeId (username) for admin
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: emailOrUsername, mode: 'insensitive' } },
            { employeeId: { equals: emailOrUsername, mode: 'insensitive' } }
          ]
        }
      });

      if (!user) {
        console.log('Admin user not found:', emailOrUsername);
        return NextResponse.json({ message: 'User not registered' }, { status: 401 });
      }

      console.log('Admin user found:', user.email, 'Role:', user.role);

      // Allow both admin and super_admin to login via the admin form
      const isAllowedRole = user.role === 'admin' || user.role === 'super_admin' ||
        (user.department && user.department.toLowerCase() === 'admin');

      if (!isAllowedRole) {
        console.log('User found but not admin/super_admin:', emailOrUsername, 'Role:', user.role);
        return NextResponse.json({ message: 'Unauthorized as admin' }, { status: 403 });
      }

      if (!user.password) {
        console.error('Admin user has no password set:', emailOrUsername);
        return NextResponse.json({ message: 'Account has no password set' }, { status: 500 });
      }

      // SaaS: Check if email is verified (unless super_admin)
      if (user.role !== 'super_admin' && user.isEmailVerified === false) {
        return NextResponse.json({ message: 'Please verify your email address before logging in.' }, { status: 403 });
      }

      // SaaS: Check trial expiration
      if (user.role !== 'super_admin' && user.plan === 'trial' && user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
        if (user.isActive !== false || user.status !== 'suspended') {
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: false, status: 'suspended' }
          });
        }
        console.log('Trial expired for user:', emailOrUsername);
        return NextResponse.json({ message: 'Your trial period has expired. Please contact support or upgrade.' }, { status: 403 });
      }

      // SaaS: Check if account is active/approved
      if (user.isActive === false) {
        if (user.status === 'pending') {
          return NextResponse.json({ message: 'Your account is pending approval. We will contact you soon.' }, { status: 403 });
        }
        if (user.status === 'rejected') {
          return NextResponse.json({ message: 'Your registration was not approved.' }, { status: 403 });
        }
        return NextResponse.json({ message: 'Your account is currently inactive. Please contact support.' }, { status: 403 });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Admin password mismatch for:', emailOrUsername);
        return NextResponse.json({ message: 'Password does not match' }, { status: 401 });
      }
      console.log('Admin password matched');

      // Use the ACTUAL role from DB (admin or super_admin)
      const actualRole = user.role || 'admin';

      const payload = {
        id: user.id, 
        role: actualRole, 
        department: user.department || 'admin',
        organizationId: user.organizationId
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_MAX_AGE });
      const refreshToken = jwt.sign({ ...payload, isRefresh: true }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_MAX_AGE });

      await prisma.user.update({
        where: { id: user.id },
        data: { sessionToken: refreshToken }
      });

      const res = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: actualRole,
          department: user.department || 'admin',
          organizationId: user.organizationId,
          companyName: user.companyName
        }
      });

      res.cookies.set('authToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE
      });

      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_MAX_AGE
      });

      console.log(`${actualRole} login success:`, user.email);

      await logActivity({
        action: 'login',
        entity: 'User',
        description: `User logged in via admin portal`,
        entityId: user.id,
        performedBy: { userId: user.id, name: user.name || user.email, role: actualRole, email: user.email },
        req
      });

      return res;
    }

    // --- EMPLOYEE LOGIN (using Employee ID + Password/DOB) ---
    if (role === 'employee') {
      console.log('Employee lookup for ID/Email:', username);
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { employeeId: { equals: username, mode: 'insensitive' } },
            { email: { equals: username, mode: 'insensitive' } }
          ]
        }
      });

      if (!employee) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
      }

      let isMatch = false;

      // 1. Try password match (if password exists)
      if (employee.password) {
        isMatch = await bcrypt.compare(password, employee.password);
        if (isMatch) console.log('Employee matched via hashed password');
      }

      // 2. Try DOB match only if password didn't match
      if (!isMatch) {
        // Fallback or read from Prisma schema
        const rawDob = employee.dateOfBirth; 
        if (rawDob && checkDobMatch(rawDob, password)) {
          isMatch = true;
          console.log('Employee matched via DOB');
        }
      }

      if (!isMatch) {
        console.log('Employee credentials invalid (tried password and DOB)');
        return NextResponse.json({ message: 'Credentials do not match' }, { status: 401 });
      }

      const tokenRole = employee.role || 'employee';

      const payload = {
        id: employee.id,
        role: tokenRole,
        organizationId: employee.organizationId,
        designation: employee.designation,
        department: employee.department
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_MAX_AGE });
      const refreshToken = jwt.sign({ ...payload, isRefresh: true }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_MAX_AGE });

      // Update employee with sessionToken
      await prisma.employee.update({
        where: { id: employee.id },
        data: { sessionToken: refreshToken }
      });

      const res = NextResponse.json({
        user: {
          id: employee.id,
          email: employee.email,
          role: tokenRole,
          designation: employee.designation,
          department: employee.department,
          personalDetails: {
            firstName: employee.firstName,
            lastName: employee.lastName
          }
        }
      });

      res.cookies.set('authToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE
      });

      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_MAX_AGE
      });

      console.log('Employee login success:', username);

      await logActivity({
        action: 'login',
        entity: 'Employee',
        description: `Employee logged in`,
        entityId: employee.id,
        performedBy: { userId: employee.id, name: employee.firstName + ' ' + employee.lastName, role: tokenRole, email: employee.email },
        req
      });
      return res;
    }

    // --- ATTENDANCE-ONLY LOGIN (using Employee ID + Password) ---
    if (role === 'attendance_only') {
      const employee = await prisma.employee.findFirst({
        where: {
          employeeId: { equals: username, mode: 'insensitive' },
          role: 'attendance_only'
        }
      });

      if (!employee) {
        return NextResponse.json({ message: 'Invalid Employee ID or Password' }, { status: 401 });
      }

      if (!employee.password) {
        return NextResponse.json({ message: 'Password not set. Contact admin.' }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password, employee.password);
      if (!isPasswordValid) {
        return NextResponse.json({ message: 'Invalid Employee ID or Password' }, { status: 401 });
      }

      const payload = {
        id: employee.id,
        role: 'attendance_only',
        organizationId: employee.organizationId,
        department: employee.department || 'N/A'
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_MAX_AGE });
      const refreshToken = jwt.sign({ ...payload, isRefresh: true }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_MAX_AGE });

      await prisma.employee.update({
        where: { id: employee.id },
        data: { sessionToken: refreshToken }
      });

      const res = NextResponse.json({
        user: {
          id: employee.id,
          employeeId: employee.employeeId,
          role: 'attendance_only',
          permissions: ['attendance']
        }
      });

      res.cookies.set('authToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_MAX_AGE
      });

      res.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: REFRESH_TOKEN_MAX_AGE
      });

      console.log('Attendance-only login success:', username);

      await logActivity({
        action: 'login',
        entity: 'Employee',
        description: `Attendance-only user logged in`,
        entityId: employee.id,
        performedBy: { userId: employee.id, name: employee.firstName + ' ' + employee.lastName, role: 'attendance_only', email: employee.email },
        req
      });
      return res;
    }

    return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Server error: ' + err.message }, { status: 500 });
  }
}
