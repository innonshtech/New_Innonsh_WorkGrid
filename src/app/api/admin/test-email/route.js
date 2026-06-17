import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Configure nodemailer transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

// POST - Send test email
export async function POST(request) {
  try {
    const body = await request.json();
    const { emailType } = body;

    if (!emailType) {
      return NextResponse.json(
        { success: false, error: "Email type is required" },
        { status: 400 }
      );
    }

    const transporter = createTransporter();

    let subject, htmlContent, recipientEmail;

    switch (emailType) {
      case 'attendance-report':
        subject = 'Test: Daily Attendance Report';
        recipientEmail = process.env.ATTENDANCE_REPORT_EMAIL || process.env.EMAIL_USER;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 8px; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Test Attendance Report</h1>
              <p>This is a test email</p>
            </div>
            <div class="content">
              <p>This is a test email for the attendance report notification system.</p>
              <p>If you received this email, the attendance report email configuration is working correctly.</p>
            </div>
            <div class="footer">
              <p>Test email sent at ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'threshold-alert':
        subject = 'Test: Attendance Threshold Alert';
        recipientEmail = process.env.ATTENDANCE_THRESHOLD_EMAIL || process.env.EMAIL_USER;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 8px; }
              .alert { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🚨 Test Threshold Alert</h1>
              <p>This is a test email</p>
            </div>
            <div class="content">
              <div class="alert">
                <h3 style="color: #856404; margin: 0;">⚠️ Test Alert</h3>
                <p>This is a test email for the attendance threshold alert notification system.</p>
              </div>
              <p>If you received this email, the threshold alert email configuration is working correctly.</p>
            </div>
            <div class="footer">
              <p>Test email sent at ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          </body>
          </html>
        `;
        break;

      case 'document-reminder':
        subject = 'Test: Document Reminder';
        recipientEmail = process.env.DOCUMENT_REMINDER_EMAIL || process.env.EMAIL_USER;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 8px; }
              .reminder { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📋 Test Document Reminder</h1>
              <p>This is a test email</p>
            </div>
            <div class="content">
              <div class="reminder">
                <h3 style="color: #0c5460; margin: 0;">⏰ Test Reminder</h3>
                <p>This is a test email for the document reminder notification system.</p>
              </div>
              <p>If you received this email, the document reminder email configuration is working correctly.</p>
            </div>
            <div class="footer">
              <p>Test email sent at ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid email type" },
          { status: 400 }
        );
    }

    const mailOptions = {
      from: `"Payroll System Test" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
