import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import { sendEmail } from "@/lib/email/service";

// GET all demo requests for super_admin
export async function GET(req) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["super_admin"]);

    const requests = await prisma.demoRequest.findMany({ where: {} });

    return NextResponse.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error("Demo requests fetch error:", error);
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST to resend demo credentials
export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["super_admin"]);

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Demo Request ID is required" },
        { status: 400 }
      );
    }

    const demoRequest = await prisma.demoRequest.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    if (!demoRequest) {
      return NextResponse.json(
        { success: false, message: "Demo request not found" },
        { status: 404 }
      );
    }

    const { name, email, loginPassword } = demoRequest;

    if (!loginPassword) {
      return NextResponse.json(
        { success: false, message: "No credentials recorded for this request" },
        { status: 400 }
      );
    }

    // Modern HTML email template for re-send
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
            Here are your login credentials for the <strong>Innonsh WorkGrid</strong> sandbox environment as requested.
          </p>
          
          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 10px; border: 1px solid #bfdbfe; margin-bottom: 28px;">
            <h3 style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-top: 0; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em;">Your Sandbox Credentials</h3>
            
            <div style="margin-bottom: 16px;">
              <span style="font-size: 13px; color: #1e40af; font-weight: 600; display: block; margin-bottom: 4px;">LOGIN EMAIL</span>
              <code style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #0f172a; font-weight: 700; background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe; display: inline-block;">${email}</code>
            </div>
            
            <div>
              <span style="font-size: 13px; color: #1e40af; font-weight: 600; display: block; margin-bottom: 4px;">TEMPORARY PASSWORD</span>
              <code style="font-family: 'JetBrains Mono', monospace; font-size: 15px; color: #0f172a; font-weight: 700; background: #ffffff; padding: 4px 8px; border-radius: 4px; border: 1px solid #bfdbfe; display: inline-block;">${loginPassword}</code>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="http://localhost:3000/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: all 0.2s;">
              Launch Sandbox Environment
            </a>
          </div>
          
          <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 0;">
            *Note: This trial sandbox environment is active for <strong>14 days</strong> from the initial request date.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
          © 2026 Innonsh WorkGrid. Pune, Maharashtra, India.
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: "Your Innonsh WorkGrid Sandbox Access Credentials (Resend)",
      html: emailHtml
    });

    if (emailResult.success) {
      await prisma.demoRequest.update({
          where: { id: demoRequest.id },
          data: {
              status: "credentials_sent",
              error: null
          }
      });

      return NextResponse.json({
        success: true,
        message: "Credentials resent successfully!"
      });
    } else {
      await prisma.demoRequest.update({
          where: { id: demoRequest.id },
          data: {
              status: "failed",
              error: emailResult.error || "Email delivery failed during resend"
          }
      });

      return NextResponse.json(
        { success: false, message: `Resend failed: ${emailResult.error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Demo request credential resend error:", error);
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// DELETE a demo request and deactivate the associated user
export async function DELETE(req) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["super_admin"]);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Demo Request ID is required" },
        { status: 400 }
      );
    }

    const demoRequest = await prisma.demoRequest.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

    if (!demoRequest) {
      return NextResponse.json(
        { success: false, message: "Demo request not found" },
        { status: 404 }
      );
    }

    // Deactivate the associated trial user so they can no longer log in
    if (demoRequest.loginEmail) {
      try {
        await prisma.user.update({
          where: { email: demoRequest.loginEmail.toLowerCase() },
          data: { 
            isActive: false, 
            status: "suspended",
            sessionToken: null // Force logout any active session
          }
        });
      } catch (err) {
        console.warn("User account for deactivation not found or already deactivated:", err.message);
      }
    }

    // Delete the demo request record
    await prisma.demoRequest.delete({ where: { id: demoRequest.id } });

    return NextResponse.json({
      success: true,
      message: "Demo request deleted and user account deactivated successfully."
    });
  } catch (error) {
    console.error("Demo request delete error:", error);
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
