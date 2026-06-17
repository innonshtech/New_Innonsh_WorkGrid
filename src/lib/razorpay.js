// src/lib/razorpay.js
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay only if keys are present
const razorpay = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) 
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * Maps our plan tiers to Razorpay Plan IDs.
 * In a real production app, you would create these plans in the Razorpay dashboard
 * and map the returned IDs here.
 */
export const RAZORPAY_PLAN_MAP = {
  starter: process.env.RAZORPAY_PLAN_STARTER || 'plan_placeholder_starter',
  growth: process.env.RAZORPAY_PLAN_GROWTH || 'plan_placeholder_growth',
  enterprise: process.env.RAZORPAY_PLAN_ENTERPRISE || 'plan_placeholder_enterprise',
};

export const RazorpayService = {
  isConfigured() {
    return !!razorpay;
  },

  async createCustomer(name, email, contact) {
    if (!this.isConfigured()) return { id: `cust_mock_${Date.now()}` };
    return await razorpay.customers.create({ name, email, contact });
  },

  async createSubscription(customerId, planTier, totalCount = 12) {
    const planId = RAZORPAY_PLAN_MAP[planTier];
    if (!this.isConfigured()) {
      return { 
        id: `sub_mock_${Date.now()}`, 
        short_url: `https://mock.razorpay.com/checkout`,
        status: 'created'
      };
    }
    
    return await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      total_count: totalCount, // Number of billing cycles (e.g. 12 months)
      customer_notify: 1, // Razorpay sends emails
    });
  },

  async cancelSubscription(subscriptionId) {
    if (!this.isConfigured() || subscriptionId.startsWith('sub_mock_')) {
      return { id: subscriptionId, status: 'cancelled' };
    }
    return await razorpay.subscriptions.cancel(subscriptionId);
  },

  verifyWebhookSignature(body, signature) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');
      
    return expectedSignature === signature;
  }
};
