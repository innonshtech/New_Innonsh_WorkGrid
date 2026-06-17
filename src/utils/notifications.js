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

// Send attendance threshold exceeded notification
export async function sendAttendanceThresholdNotification(thresholdData) {
  const { employeeType, subType, organization, currentCount, threshold, date } = thresholdData;

  const transporter = createTransporter();

  const subject = `⚠️ Attendance Threshold Exceeded Alert - ${employeeType}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Threshold Exceeded Alert</h1>
        <p>Employee Count Limit Reached</p>
      </div>

      <div class="content">
        <div class="alert">
          <h3 style="color: #856404; margin: 0;">⚠️ Action Required</h3>
          <p>The attendance count for <strong>${employeeType}${subType ? ` (${subType})` : ''}</strong> has exceeded the configured threshold.</p>
        </div>

        <div class="details">
          <h3>Details:</h3>
          <ul>
            <li><strong>Employee Type:</strong> ${employeeType}</li>
            ${subType ? `<li><strong>Sub-Type:</strong> ${subType}</li>` : ''}
            <li><strong>Organization:</strong> ${organization}</li>
            <li><strong>Current Count:</strong> ${currentCount}</li>
            <li><strong>Threshold Limit:</strong> ${threshold}</li>
            <li><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</li>
            <li><strong>Exceeded By:</strong> ${currentCount - threshold} employees</li>
          </ul>
        </div>

        <p>Please review the attendance records and take necessary actions to manage the workforce capacity.</p>
      </div>

      <div class="footer">
        <p>This is an automated notification from the Payroll Management System.</p>
        <p>Generated at ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </body>
    </html>
  `;

  const recipientEmail = process.env.ATTENDANCE_THRESHOLD_EMAIL || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Payroll System" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Attendance threshold notification sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send attendance threshold notification:", error);
    throw error;
  }
}

// Send document reminder notification
export async function sendDocumentReminderNotification(reminderData) {
  const { employee, missingDocuments, reminderDays } = reminderData;

  const transporter = createTransporter();

  const subject = `📄 Document Reminder - ${employee.personalDetails.firstName} ${employee.personalDetails.lastName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .content { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .reminder { background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .employee-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .document-list { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 Document Submission Reminder</h1>
        <p>Pending Documents Notice</p>
      </div>

      <div class="content">
        <div class="reminder">
          <h3 style="color: #0c5460; margin: 0;">⏰ Reminder</h3>
          <p>The following employee has missing required documents. This is a reminder sent after ${reminderDays} days of registration.</p>
        </div>

        <div class="employee-details">
          <h3>Employee Information:</h3>
          <ul>
            <li><strong>Employee ID:</strong> ${employee.employeeId}</li>
            <li><strong>Name:</strong> ${employee.personalDetails.firstName} ${employee.personalDetails.lastName}</li>
            <li><strong>Email:</strong> ${employee.personalDetails.email}</li>
            <li><strong>Phone:</strong> ${employee.personalDetails.phone}</li>
            <li><strong>Date of Joining:</strong> ${new Date(employee.personalDetails.dateOfJoining).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })}</li>
            <li><strong>Department:</strong> ${employee.jobDetails?.department || 'N/A'}</li>
            <li><strong>Organization:</strong> ${employee.jobDetails?.organizationId?.name || employee.jobDetails?.organization || 'N/A'}</li>
          </ul>
        </div>

        <div class="document-list">
          <h3>Missing Documents:</h3>
          <ul>
            ${missingDocuments.map(doc => `<li><strong>${doc.documentType}</strong></li>`).join('')}
          </ul>
        </div>

        <p>Please ensure that all required documents are submitted as soon as possible to complete the employee's profile and comply with company policies.</p>

        <p>If you have already submitted these documents, please disregard this reminder.</p>
      </div>

      <div class="footer">
        <p>This is an automated reminder from the Payroll Management System.</p>
        <p>Generated at ${new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' })}</p>
      </div>
    </body>
    </html>
  `;

  const recipientEmail = process.env.DOCUMENT_REMINDER_EMAIL || employee.personalDetails.email || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"Payroll System" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Document reminder notification sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send document reminder notification:", error);
    throw error;
  }
}

// Send attendance regularization request notification to manager
export async function sendAttendanceRegularizationRequestEmail(requestData) {
  const { employeeName, date, type, reason, approverEmail } = requestData;
  const transporter = createTransporter();

  const subject = `📥 New Attendance Request: ${type} - ${employeeName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px; }
        .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 40px 20px; text-align: center; }
        .body { padding: 30px; }
        .info-grid { display: grid; grid-template-columns: 100px 1fr; gap: 10px; background: #f8fafc; padding: 20px; border-radius: 15px; margin: 20px 0; }
        .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .value { color: #1e293b; font-weight: 600; }
        .reason-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 15px; border-radius: 8px; margin-top: 20px; font-style: italic; }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2 style="margin:0;">Attendance Request</h2>
          <p style="opacity:0.8; margin-top:5px;">Pending Approval</p>
        </div>
        <div class="body">
          <p>Hi Admin/Manager,</p>
          <p><strong>${employeeName}</strong> has submitted a new attendance request for your review.</p>
          
          <div class="info-grid">
            <div class="label">Type</div> <div class="value">${type}</div>
            <div class="label">Date</div> <div class="value">${new Date(date).toDateString()}</div>
          </div>

          <div class="reason-box">
            <strong>Reason:</strong><br/>
            "${reason}"
          </div>

          <p style="margin-top:30px; font-size:14px; color:#64748b;">Please log in to the HR Portal to approve or reject this request.</p>
        </div>
      </div>
      <div class="footer">
        <p>Managed for you by the HR-Payroll System</p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"HR Portal" <${process.env.EMAIL_USER}>`,
    to: approverEmail,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}

// Send regularization status update to employee
export async function sendRegularizationStatusUpdateEmail(updateData) {
  const { employeeEmail, date, type, status, remarks } = updateData;
  const transporter = createTransporter();

  const isApproved = status === 'Approved';
  const color = isApproved ? '#10b981' : '#ef4444';
  const subject = `📢 Attendance Request ${status}: ${new Date(date).toDateString()}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
        .header { background: ${color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .remarks { background: #f1f5f9; padding: 15px; border-radius: 8px; border-top: 2px solid ${color}; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">Request ${status}</h2>
        </div>
        <div class="content">
          <p>Your request for <strong>${type}</strong> on <strong>${new Date(date).toDateString()}</strong> has been ${status.toLowerCase()}.</p>
          
          ${remarks ? `<div class="remarks"><strong>Manager Remarks:</strong><br/>${remarks}</div>` : ''}

          <p style="margin-top:20px;">The attendance records have been updated accordingly.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"HR Portal" <${process.env.EMAIL_USER}>`,
    to: employeeEmail,
    subject,
    html: htmlContent,
  });
}