// src/lib/auth-util.js
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Verifies the JWT from cookies and returns the user payload.
 * Throws an error if unauthorized.
 */
export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("authToken")?.value || cookieStore.get("employee_token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Fetch latest fields from database
    let latestOrgId = payload.organizationId;
    let latestRole = payload.role;
    let latestDept = payload.department;

    if (payload.role === 'employee' || payload.role === 'supervisor') {
      const emp = await prisma.employee.findFirst({
        where: { OR: [{ id: payload.id }, { mongoId: payload.id }] }
      });
      if (emp) {
        latestOrgId = emp.organizationId;
        latestRole = emp.role || latestRole;
        latestDept = emp.department || latestDept;
      }
    } else {
      const user = await prisma.user.findFirst({
        where: { OR: [{ id: payload.id }, { mongoId: payload.id }] }
      });
      if (user) {
        latestOrgId = user.organizationId;
        latestRole = user.role || latestRole;
        latestDept = user.department || latestDept;
      }
    }

    if (!latestOrgId) {
      const defaultOrg = await prisma.organization.findFirst();
      if (defaultOrg) {
        latestOrgId = defaultOrg.id;
      }
    }

    return {
      ...payload,
      organizationId: latestOrgId,
      role: latestRole,
      department: latestDept
    };
  } catch (error) {
    throw new Error("Unauthorized: Invalid token");
  }
}

/**
 * Checks if the user has the required roles.
 */
export function authorize(user, allowedRoles = []) {
  if (allowedRoles.length === 0) return true;
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Role ${user.role} does not have access`);
  }
  return true;
}
