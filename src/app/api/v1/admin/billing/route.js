import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';
import { RazorpayService } from '@/lib/razorpay';
import { SAAS_CONFIG } from '@/lib/saas-config';
import prisma from "@/lib/db/prisma";

export const dynamic = 'force-dynamic';

// GET current billing status
export async function GET(req) {
  try {
    const user = await getAuthUser();
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return ApiResponse.forbidden('Only admins can view billing');
    }

    if (!user.organizationId) {
      return ApiResponse.badRequest('No organization associated with this account');
    }

    let subscription = await prisma.subscription.findFirst({
      where: { organizationId: user.organizationId }
    });
    
    // If no subscription record exists, synthesize one based on the User model
    if (!subscription) {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: user.id },
            { mongoId: user.id }
          ]
        }
      });
      subscription = {
        plan: dbUser.plan || 'trial',
        status: dbUser.plan === 'trial' ? 'trialing' : 'active',
        currentPeriodEnd: dbUser.planExpiresAt,
        invoices: []
      };
    } else {
        // Convert Prisma object to plain object matching legacy logic
        subscription = {
            ...subscription,
            currentPeriodEnd: subscription.subscriptionData?.currentPeriodEnd || null,
            invoices: subscription.subscriptionData?.invoices || []
        };
    }

    const limits = SAAS_CONFIG.getPlanLimits(subscription.plan);
    
    // In a real app, query the Employee count here to return usage
    // const employeeCount = await prisma.employee.count({ where: { organizationId: user.organizationId } });

    return ApiResponse.success({ 
      subscription,
      limits
    });

  } catch (error) {
    console.error('Error fetching billing:', error);
    return ApiResponse.error(error.message);
  }
}

// POST create checkout session
export async function POST(req) {
  try {
    const user = await getAuthUser();
    
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return ApiResponse.forbidden();
    }

    const body = await req.json();
    const { planTier } = body;

    if (!['starter', 'growth', 'enterprise'].includes(planTier)) {
      return ApiResponse.badRequest('Invalid plan tier specified');
    }

    let subscription = await prisma.subscription.findFirst({
      where: { organizationId: user.organizationId }
    });
    
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: user.id },
          { mongoId: user.id }
        ]
      }
    });

    // 1. Create or get Razorpay Customer
    let customerId = subscription?.subscriptionData?.razorpayCustomerId;
    if (!customerId) {
      const customer = await RazorpayService.createCustomer(
        dbUser.companyName || dbUser.name,
        dbUser.email,
        dbUser.phone || ""
      );
      customerId = customer.id;
    }

    // 2. Create Razorpay Subscription
    const rzpaySub = await RazorpayService.createSubscription(customerId, planTier);

    // 3. Save pending subscription to DB
    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: user.organizationId,
          plan: planTier,
          status: 'pending',
          subscriptionData: {
             userId: user.id,
             razorpayCustomerId: customerId,
             razorpaySubscriptionId: rzpaySub.id
          }
        }
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: planTier,
          status: 'pending',
          subscriptionData: {
            ...(typeof subscription.subscriptionData === 'object' && subscription.subscriptionData !== null ? subscription.subscriptionData : {}),
            razorpaySubscriptionId: rzpaySub.id
          }
        }
      });
    }

    return ApiResponse.success({ 
      checkout_url: rzpaySub.short_url,
      subscription_id: rzpaySub.id 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return ApiResponse.error(error.message);
  }
}
