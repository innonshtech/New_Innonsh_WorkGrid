// src/lib/plan-gate.js
import prisma from '@/lib/db/prisma';
import { SAAS_CONFIG } from '@/lib/saas-config';
import { ApiResponse } from '@/lib/api-response';

/**
 * Checks if the user's organization has access to a specific feature module based on their current plan.
 * @param {string} planTier - e.g. 'starter', 'growth', 'enterprise'
 * @param {string} featureSlug - e.g. 'payroll', 'recruitment', 'finance'
 * @returns {boolean}
 */
export function canAccessFeature(planTier, featureSlug) {
  if (!planTier) planTier = 'trial';
  return SAAS_CONFIG.hasFeature(planTier, featureSlug);
}

/**
 * Validates if the organization can add another employee based on their plan limit.
 * Used before creating a new employee.
 * @param {string} organizationId 
 * @param {string} planTier 
 * @returns {Promise<{ allowed: boolean, currentCount: number, limit: number }>}
 */
export async function checkEmployeeLimit(organizationId, planTier) {
  const limits = SAAS_CONFIG.getPlanLimits(planTier || 'trial');
  
  if (limits.maxEmployees >= 999999) {
    return { allowed: true, currentCount: -1, limit: limits.maxEmployees };
  }

  // Find organization in Prisma
  const org = await prisma.organization.findFirst({
    where: { OR: [{ id: organizationId }, { mongoId: organizationId }] }
  });

  const currentCount = await prisma.employee.count({ 
    where: {
      organizationId: org ? org.id : organizationId
    }
  });

  return {
    allowed: currentCount < limits.maxEmployees,
    currentCount,
    limit: limits.maxEmployees
  };
}

/**
 * API Route middleware wrapper to enforce feature gating
 * @param {Function} handler - The route handler
 * @param {string} featureSlug - The required feature module
 */
export function requireFeature(handler, featureSlug) {
  return async (req, ...args) => {
    // In a full implementation, we'd fetch the user's org plan from DB or Token.
    // Assuming we append it to headers during main middleware for performance:
    const planTier = req.headers.get('x-org-plan') || 'trial';
    
    if (!canAccessFeature(planTier, featureSlug)) {
      return ApiResponse.forbidden(`The '${featureSlug}' module is not available on your current plan. Please upgrade to access this feature.`);
    }

    return handler(req, ...args);
  };
}
