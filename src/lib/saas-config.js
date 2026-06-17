// src/lib/saas-config.js

export const SAAS_CONFIG = {
  // Plan Definitions
  PLANS: {
    TRIAL: 'trial',
    STARTER: 'starter',
    GROWTH: 'growth',
    ENTERPRISE: 'enterprise',
  },

  // Trial Defaults
  TRIAL_DURATION_DAYS: parseInt(process.env.DEMO_TRIAL_DURATION_DAYS || '14', 10),

  // Plan Limits
  LIMITS: {
    trial: {
      maxEmployees: 25,
      features: ['payroll', 'attendance', 'leaves', 'recruitment', 'finance', 'staffing', 'tasks'],
    },
    starter: {
      maxEmployees: 50,
      features: ['payroll', 'attendance', 'leaves'],
    },
    growth: {
      maxEmployees: 200,
      features: ['payroll', 'attendance', 'leaves', 'recruitment', 'finance'],
    },
    enterprise: {
      maxEmployees: 999999, // Unlimited
      features: ['payroll', 'attendance', 'leaves', 'recruitment', 'finance', 'staffing', 'tasks', 'api_access'],
    },
  },

  // Feature Toggles (Global)
  FEATURES: {
    ENABLE_AI_MATCHING: process.env.ENABLE_AI_MATCHING === 'true',
    ENABLE_WEBHOOKS: process.env.ENABLE_WEBHOOKS === 'true',
  },

  // Helper Functions
  getPlanLimits(plan) {
    return this.LIMITS[plan] || this.LIMITS.trial;
  },

  hasFeature(plan, featureSlug) {
    const limits = this.getPlanLimits(plan);
    return limits.features.includes(featureSlug) || limits.features.includes('*');
  },
};
