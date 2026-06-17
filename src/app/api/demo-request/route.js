import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { sendEmail } from "@/lib/email/service";
import { logActivity } from "@/lib/logger";
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    // 1. Establish database connection (Removed - Prisma handles connections)

    // 2. Parse request body
    const { name, email, phone, companyName, companySize } = await req.json();

    // Input validation
    if (!name || !email || !phone || !companyName || !companySize) {
      return NextResponse.json(
        { success: false, message: "All form fields are required" },
        { status: 400 }
      );
    }

    // Validate duplicate email/phone for demo requests
    const existingDemoRequest = await prisma.demoRequest.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: phone.trim() }
        ]
      }
    });

    if (existingDemoRequest) {
      return NextResponse.json(
        { success: false, message: "A demo request with this email or phone number has already been registered." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { phone: phone.trim() }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "This email or phone number is already registered in the system." },
        { status: 400 }
      );
    }

    // 3. Create initial pending DemoRequest record
    let demoRequest = await prisma.demoRequest.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone.trim(),
        companyName,
        companySize,
        status: "pending"
      }
    });

    // 4. Generate random secure password (WorkGrid@ followed by 4 random digits)
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedPassword = `WorkGrid@${randomDigits}`;

    // Get trial duration from environment variables
    const trialDays = parseInt(process.env.DEMO_TRIAL_DURATION_DAYS || "14", 10);
    const planExpiresAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    // 5. Create dedicated Sandbox Organization for isolation
    const lastOrg = await prisma.organization.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    let newOrgId = "ORG001";
    if (lastOrg && lastOrg.orgId) {
      const lastNum = parseInt(lastOrg.orgId.replace(/\D/g, "")) || 0;
      newOrgId = `ORG${String(lastNum + 1).padStart(3, "0")}`;
    }

    // Only create org if user doesn't already have one
    let sandboxOrganization;
    let user = existingUser;

    if (user && user.organizationId) {
      // Rule 5: For Prisma lookups by ID, always use: { OR: [{ id: ... }, { mongoId: ... }] }
      sandboxOrganization = await prisma.organization.findFirst({
        where: {
          OR: [
            { id: user.organizationId },
            { mongoId: user.organizationId }
          ]
        }
      });
    } else {
      sandboxOrganization = await prisma.organization.create({
        data: {
          orgId: newOrgId,
          name: companyName + " (Demo Sandbox)",
          email: email.toLowerCase(),
          phone: phone.trim(),
          status: "Active",
          industry: "Demo",
          companySize: companySize,
          adminUserId: user?.id || null // Use Prisma's 'id' field
        }
      });
    }

    const saltRounds = 10;
    const hashedGeneratedPassword = await bcrypt.hash(generatedPassword, saltRounds);

    // 6. Create or update trial admin user
    if (user) {
      user = await prisma.user.update({ where: { id: (await prisma.user.findFirst({ where: { OR: [{ id: user.id }, { mongoId: user.id }] }, select: { id: true } }))?.id || user.id },
        data: {
          name,
          password: hashedGeneratedPassword,
          role: "admin",
          status: "active",
          isActive: true,
          plan: "trial",
          planExpiresAt,
          companyName,
          organizationId: sandboxOrganization.id, // Use Prisma's 'id'
          phone: phone.trim(),
          companySize,
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedGeneratedPassword,
          role: "admin",
          status: "active",
          isActive: true,
          plan: "trial",
          planExpiresAt,
          companyName,
          organizationId: sandboxOrganization.id, // Use Prisma's 'id'
          phone: phone.trim(),
          companySize,
          isEmailVerified: true
        }
      });

      // Update the organization with the new adminUserId
      sandboxOrganization = await prisma.organization.update({ where: { id: (await prisma.organization.findFirst({ where: { OR: [{ id: sandboxOrganization.id }, { mongoId: sandboxOrganization.id }] }, select: { id: true } }))?.id || sandboxOrganization.id },
        data: {
          adminUserId: user.id // Use Prisma's 'id'
        }
      });
    }

    // 6. Compose modern email template
    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #0f172a; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.03em;">
            Innonsh <span style="color: #0f172a;">WorkGrid</span>
          </div>
          <div style="font-size: 14px; color: #64748b; margin-top: 4px;">Operating System for Modern HR Teams</div>
        </div>
        
        <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #0f172a;">Hello ${name},</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Thank you for booking a walkthrough of <strong>Innonsh WorkGrid</strong>! We are thrilled to invite you to explore our sandbox environment with full administrator privileges.
          </p>
          
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 10px; border: 1px solid #bfdbfe; margin-bottom: 28px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Your Trial Credentials</h3>
            
            <div style="margin-bottom: 16px;">
              <span style="font-size: 13px; color: #1e40af; font-weight: 600; display: block; margin-bottom: 4px;">LOGIN EMAIL</span>
              <code style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #0f172a; font-weight: 700; background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe; display: inline-block;">${email}</code>
            </div>
            
            <div>
              <span style="font-size: 13px; color: #1e40af; font-weight: 600; display: block; margin-bottom: 4px;">TEMPORARY PASSWORD</span>
              <code style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #0f172a; font-weight: 700; background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe; display: inline-block;">${generatedPassword}</code>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="http://localhost:3000/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: all 0.2s;">
              Launch Sandbox Environment
            </a>
          </div>
          
          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
            *Note: This trial sandbox environment is active for <strong>${trialDays} days</strong>. In sandbox mode, you can customize departments, assign shifts, manage mock employee databases, run sample payroll modules, and try out ATS candidate recruiting.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
          © 2026 Innonsh WorkGrid. Pune, Maharashtra, India.
        </div>
      </div>
    `;

    // 7. Dispatch automated email
    const emailResult = await sendEmail({
      to: email,
      subject: "Your Innonsh WorkGrid Sandbox Access Credentials",
      html: emailHtml
    });

    if (emailResult.success) {
      // 8a. Update request status to success
      demoRequest = await prisma.demoRequest.update({ where: { id: (await prisma.demoRequest.findFirst({ where: { OR: [{ id: demoRequest.id }, { mongoId: demoRequest.id }] }, select: { id: true } }))?.id || demoRequest.id },
        data: {
          status: "credentials_sent",
          loginEmail: email.toLowerCase(),
          loginPassword: generatedPassword,
        }
      });

      // Log success in platform log
      try {
        await logActivity({
          action: "created",
          entity: "DemoRequest",
          entityId: demoRequest.id, // Use Prisma's 'id'
          description: `Auto-provisioned sandbox demo access for ${name} (${email})`,
          performedBy: {
            userId: user.id, // Use Prisma's 'id'
            name: user.name,
            email: user.email,
            role: user.role
          },
          details: {
            companyName,
            companySize
          },
          req
        });
      } catch (logErr) {
        console.error("Platform activity logging failed:", logErr);
      }

      return NextResponse.json({
        success: true,
        message: "Your demo sandbox account has been provisioned! Credentials have been sent to your email address.",
        credentials: {
          email: email.toLowerCase(),
          password: generatedPassword
        }
      });
    } else {
      // 8b. Email dispatch failed, record failure trace in database
      await prisma.demoRequest.update({ where: { id: (await prisma.demoRequest.findFirst({ where: { OR: [{ id: demoRequest.id }, { mongoId: demoRequest.id }] }, select: { id: true } }))?.id || demoRequest.id },
        data: {
          status: "failed",
          error: emailResult.error || "Email delivery failed",
          loginEmail: email.toLowerCase(),
          loginPassword: generatedPassword,
        }
      });

      return NextResponse.json({
        success: true, // Still successfully provisioned account
        message: "Your trial account was provisioned, but we couldn't send the credentials email. Please write down your password below to log in.",
        credentials: {
          email: email.toLowerCase(),
          password: generatedPassword
        },
        warning: true,
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error("Demo request provisioning critical error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error occurred while provisioning your demo sandbox." },
      { status: 500 }
    );
  }
}
