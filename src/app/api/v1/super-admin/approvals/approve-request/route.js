// src/app/api/super-admin/approve-request/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';
import { sendEmail } from '@/lib/email/service';

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const token = req.cookies.get('authToken')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'super_admin') {
      return NextResponse.json({ message: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { userId, action } = await req.json(); // action: 'approve' or 'reject'
    if (!userId || !action) {
      return NextResponse.json({ message: 'User ID and action are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { mongoId: userId }] } });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (action === 'reject') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'rejected',
          isActive: false
        }
      });
      return NextResponse.json({ success: true, message: 'Request rejected' });
    }

    if (action === 'approve') {
      // 1. Generate orgId
      const lastOrg = await prisma.organization.findFirst({
        orderBy: { orgId: 'desc' }
      });
      let newOrgId = "ORG001";
      if (lastOrg && lastOrg.orgId) {
        const lastNum = parseInt(lastOrg.orgId.replace(/\D/g, "")) || 0;
        newOrgId = `ORG${String(lastNum + 1).padStart(3, "0")}`;
      }

      // 2. Create Organization
      const organization = await prisma.organization.create({ 
        data: {
          orgId: newOrgId,
          name: user.companyName || "Organization",
          email: user.email,
          phone: user.phone || "",
          status: "Active",
          createdById: user.id
        } 
      });

      // 3. Activate User
      await prisma.user.update({
        where: { id: user.id },
        data: {
          organizationId: organization.id,
          isActive: true,
          status: 'active',
          isEmailVerified: true
        }
      });

      // 4. Send Approval Email
      const loginUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/login` : 'http://localhost:3000/login';
      await sendEmail({
        to: user.email,
        subject: "Welcome to WorkGrid - Registration Approved!",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <div style="border-bottom: 3px solid #10b981; padding-bottom: 12px; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 22px;">Registration Approved</h1>
            </div>
            <p>Hi <strong>${user.name || 'Admin'}</strong>,</p>
            <p style="line-height: 1.6;">Great news! Your registration for <strong>${user.companyName || 'your organization'}</strong> has been verified and approved.</p>
            <p style="line-height: 1.6;">Your workspace is now fully active. You can log in immediately to start setting up your environment.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Log In to WorkGrid</a>
            </div>
            <p>Best regards,<br/><strong>Team WorkGrid</strong></p>
        </div>
        `
      });

      await logActivity({
        action: "approved_registration",
        entity: "User",
        entityId: user.id,
        description: `Super Admin approved registration for ${user.name} (${user.companyName})`,
        performedBy: {
          userId: decoded.id,
          name: "Super Admin",
          role: 'super_admin'
        },
        req
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Request approved and Organization created!',
        organization: {
          id: organization.id,
          orgId: organization.orgId,
          name: organization.name
        }
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Approve request error:', error);
    return NextResponse.json({ message: 'Server error: ' + error.message }, { status: 500 });
  }
}
