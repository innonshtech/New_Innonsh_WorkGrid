// src/lib/rbac.js
import { NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-response';

/**
 * Common Permission Slugs
 */
export const PERMISSIONS = {
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_MANAGE: 'employees.manage',
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MANAGE: 'attendance.manage',
  LEAVES_VIEW: 'leaves.view',
  LEAVES_MANAGE: 'leaves.manage',
  FINANCE_VIEW: 'finance.view',
  FINANCE_MANAGE: 'finance.manage',
  SETTINGS_MANAGE: 'settings.manage',
};

/**
 * Checks if a user object has a specific permission slug.
 * @param {Object} user - The user object from session (needs user.permissions or user.role)
 * @param {string} permissionSlug - The permission to check
 * @returns {boolean}
 */
export function hasPermission(user, permissionSlug) {
  if (!user) return false;
  
  // Super admins and admins have implicit access if they don't have granular permissions set up yet
  if (user.role === 'super_admin' || user.role === 'admin') {
    return true; 
  }

  // If user has granular permissions array
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permissionSlug) || user.permissions.includes('*');
  }

  return false;
}

/**
 * Helper to wrap API route handlers with a permission check
 * @param {Function} handler - The Next.js API route handler
 * @param {string} permissionSlug - The required permission
 * @returns {Function} - Wrapped handler
 */
export function requirePermission(handler, permissionSlug) {
  return async (req, ...args) => {
    // We expect the middleware to have injected headers
    const userRole = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id');
    
    // In a real robust implementation, we might fetch the full user + permissions here
    // or rely on a verified JWT that contains the permissions array.
    // For now, we allow super_admin and admin through everything as a fallback.
    if (userRole === 'super_admin' || userRole === 'admin') {
      return handler(req, ...args);
    }
    
    // TODO: implement robust fetching of user permissions from token or DB 
    // if we need granular API blocks for regular employees.
    
    return ApiResponse.forbidden(`You lack the required permission: ${permissionSlug}`);
  };
}
