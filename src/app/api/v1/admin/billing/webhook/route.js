import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { RazorpayService } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // In production, MUST verify signature
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const isValid = RazorpayService.verifyWebhookSignature(bodyText, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(bodyText);

    // Handle Subscription Activated or Renewed
    if (event.event === 'subscription.charged' || event.event === 'subscription.activated') {
      const payload = event.payload.subscription.entity;
      const subId = payload.id;
      
      const subscription = await prisma.subscription.findFirst({
        where: { razorpaySubscriptionId: subId },
        select: {
          id: true, // Prisma's internal ID
          organizationId: true,
          plan: true,
          invoices: true, // Assuming invoices is a JSON array field
          currentPeriodEnd: true,
        }
      });

      if (subscription) {
        const updateData = {
          status: 'active',
          currentPeriodStart: new Date(payload.current_start * 1000),
          currentPeriodEnd: new Date(payload.current_end * 1000),
        };
        
        // Add invoice record
        if (event.payload.payment) {
          const payment = event.payload.payment.entity;
          const newInvoice = {
            razorpayInvoiceId: payment.invoice_id || payment.id,
            amount: payment.amount / 100, // Razorpay is in paise
            status: 'paid',
            paidAt: new Date(),
          };
          
          const currentInvoices = Array.isArray(subscription.invoices) ? subscription.invoices : [];
          updateData.invoices = [...currentInvoices, newInvoice];
        }
        
        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: updateData,
          select: {
            plan: true,
            currentPeriodEnd: true,
            organizationId: true,
          }
        });

        // Sync with User model for legacy/middleware compatibility
        await prisma.user.updateMany(
          { 
            where: { 
              organizationId: updatedSubscription.organizationId, 
              role: 'admin' 
            } 
          },
          { 
            data: { 
              plan: updatedSubscription.plan, 
              planExpiresAt: updatedSubscription.currentPeriodEnd,
              isActive: true,
              status: 'active'
            } 
          }
        );
      }
    }

    // Handle Subscription Cancelled
    if (event.event === 'subscription.cancelled' || event.event === 'subscription.halted') {
      const subId = event.payload.subscription.entity.id;
      await prisma.subscription.updateMany(
        { where: { razorpaySubscriptionId: subId } },
        { data: { status: 'cancelled', cancelledAt: new Date() } }
      );
    }

    return NextResponse.json({ status: 'ok' });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}