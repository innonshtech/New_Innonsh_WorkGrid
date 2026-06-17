import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from "@/lib/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET;

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    // Get the authToken or employee_token cookie
    const token = req.cookies.get('authToken')?.value || req.cookies.get('employee_token')?.value;
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!token) {
      return NextResponse.json({ user: null, message: 'No active session found' }, { status: 200 });
    }

    // Verify and decode the JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ user: null, message: 'Invalid or expired session' }, { status: 200 });
    }

    const { id, role } = decoded;

    // 1. Check User Collection (Admins, Super Admins, etc.)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
        sessionToken: { in: [token, refreshToken].filter(Boolean) }
      }
    });

    if (user) {
      const isSuperAdmin = user.role === 'super_admin';
      const isAdmin = user.role === 'admin' || user.department?.toLowerCase() === 'admin';

      // Ensure permissions is an array. Depending on how it's mapped, we assume it's parsed from JSON or an empty array
      let permissions = Array.isArray(user.permissions) ? user.permissions : [];
      let roleSlug = user.role;
      
      // Fetch permissions from Role model if assigned
      if (user.roleId) {
        try {
          const roleData = await prisma.role.findFirst({
            where: { OR: [{ id: user.roleId }, { mongoId: user.roleId }] }
          });
          if (roleData) {
            roleSlug = roleData.slug || user.role;
            const rolePerms = roleData.permissions;
            if (Array.isArray(rolePerms)) {
              permissions = [...new Set([...permissions, ...rolePerms])];
            }
          }
        } catch (roleError) {
          console.error("Error fetching user role permissions:", roleError);
        }
      }

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          role: isSuperAdmin ? 'super_admin' : (isAdmin ? 'admin' : roleSlug),
          email: user.email,
          department: user.department || 'admin',
          organizationId: user.organizationId,
          companyName: user.companyName,
          employeeId: user.employeeId,
          permissions: permissions,
          roleId: user.roleId
        },
      });
    }

    // 2. Check Employee Collection (Employees, Supervisors)
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
        sessionToken: { in: [token, refreshToken].filter(Boolean) }
      }
    });

    if (employee) {
      // Fetch department permissions
      let permissions = [];
      const empDeptName = employee.department?.trim() || '';
      if (empDeptName) {
        try {
          const departmentData = await prisma.department.findFirst({
            where: { name: { equals: empDeptName, mode: 'insensitive' } } // Fallback for regex search
          });
          
          if (departmentData && Array.isArray(departmentData.departmentData?.permissions)) {
            permissions = departmentData.departmentData.permissions;
          }
        } catch (deptError) {
          console.error("Error fetching department permissions:", deptError);
        }
      }

      // Fetch role permissions if assigned
      if (employee.roleId) {
        try {
          const roleData = await prisma.role.findFirst({
            where: { OR: [{ id: employee.roleId }, { mongoId: employee.roleId }] }
          });
          if (roleData && Array.isArray(roleData.permissions)) {
             permissions = [...new Set([...permissions, ...roleData.permissions])];
          }
        } catch (roleError) {
          console.error("Error fetching employee role permissions:", roleError);
        }
      }

      return NextResponse.json({
        user: {
          id: employee.id,
          email: employee.email,
          name: `${employee.firstName} ${employee.lastName}`,
          role: employee.role || 'employee',
          department: employee.department,
          designation: employee.designation,
          organizationId: employee.organizationId,
          permissions: permissions,
          roleId: employee.roleId,
          personalDetails: {} // Stub to prevent frontend crashes on legacy fields
        },
      });
    }

    return NextResponse.json({ user: null, message: 'Session data not found' }, { status: 200 });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
