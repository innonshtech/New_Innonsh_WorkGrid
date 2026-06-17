// src/app/api/v1/forgot-password/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import nodemailer from 'nodemailer';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

export async function POST(request) {
  try {
    const { email, role = 'admin' } = await request.json();
    console.log(`Password reset requested for email: ${email}, role: ${role}`);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let targetUser = null;
    let userName = '';

    if (role === 'employee') {
      targetUser = await prisma.employee.findFirst({ where: { email: email.toLowerCase().trim() } });
      if (targetUser) {
        userName = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim();
      }
    } else {
      targetUser = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
      if (targetUser) {
        userName = targetUser.name;
      }
    }

    // Always return success even if user not found (security: prevents email enumeration)
    if (!targetUser) {
      console.log(`User not found for email ${email} and role ${role}`);
      return NextResponse.json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Store a hashed version
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const forgotPasswordToken = hashedToken;
    const forgotPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (role === 'employee') {
      await prisma.employee.update({
        where: { id: targetUser.id },
        data: { forgotPasswordToken, forgotPasswordExpires }
      });
    } else {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { forgotPasswordToken, forgotPasswordExpires }
      });
    }

    // Build reset link using the RAW token (not hashed)
    // Priority: Use NEXT_PUBLIC_APP_URL if set (production), otherwise detect from request
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL 
      || request.headers.get('origin') 
      || request.headers.get('referer')?.replace(/\/[^/]*$/, '') 
      || 'http://localhost:3000').replace(/\/$/, '');
    const resetLink = `${appUrl}/reset-password?token=${rawToken}&role=${role}`;

    // Send email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"HR & Payroll System" <${process.env.EMAIL_USER}>`,
      to: email.toLowerCase().trim(),
      subject: '🔑 Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .content { background: #f8f9fa; padding: 25px; border-radius: 8px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 15px; margin-top: 20px; font-size: 14px; color: #856404; }
            .footer { text-align: center; margin-top: 25px; color: #888; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔑 Password Reset</h1>
            <p>You requested to reset your password</p>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>We received a request to reset the password for your ${role} account. Click the button below to set a new password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="btn">Reset My Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #555;">${resetLink}</p>
            <div class="warning">
              ⚠️ This link is valid for <strong>1 hour</strong> only. If you did not request a password reset, please ignore this email — your password will remain unchanged.
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the HR & Payroll Management System.</p>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to send reset email. Please try again later.' }, { status: 500 });
  }
}
