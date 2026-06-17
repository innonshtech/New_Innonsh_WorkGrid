// Recruitment email templates — Gap Fix #7

export const getApplicationReceivedTemplate = (candidateName, jobTitle, dashboardUrl) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Application Received ✓</h1>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">Thank you for applying for the position of <strong>${jobTitle}</strong>. Your application has been received and added to our recruitment pipeline.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">Our talent acquisition team will review your profile and get back to you shortly. You can expect to hear from us within 5-7 business days.</p>
    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #4f46e5;">
      <p style="color: #64748b; font-size: 13px; margin: 0;"><strong>What's Next?</strong></p>
      <p style="color: #64748b; font-size: 13px; margin: 8px 0 0 0;">Your application will go through: Screening → Technical → Managerial → HR Interview → Offer</p>
    </div>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;

export const getInterviewInviteTemplate = (candidateName, round, date, meetingLink, interviewerName, mode = 'Online', location = '') => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, ${mode === 'Online' ? '#0ea5e9 0%, #6366f1 100%' : '#1e293b 0%, #475569 100%'}); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📅 Interview Invitation</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">${mode} Session</p>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">We're pleased to invite you for the next round of interviews.</p>
    <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Round:</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${round}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Date & Time:</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${date}</td></tr>
        ${interviewerName ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Interviewer:</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${interviewerName}</td></tr>` : ''}
        ${mode === 'Offline' ? `<tr><td style="padding: 8px 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">📍 Location:</td><td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${location || 'Company Corporate Office'}</td></tr>` : ''}
      </table>
    </div>
    ${mode === 'Online' && meetingLink ? `<div style="text-align: center; margin: 30px 0;"><a href="${meetingLink}" style="background: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block;">Join Meeting</a></div>` : ''}
    <p style="color: #475569; font-size: 14px; line-height: 1.8;">Please confirm your availability by replying to this email. We look forward to speaking with you!</p>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;

export const getOfferLetterEmailTemplate = (candidateName, jobTitle, offerContent, candidateId = '', candidateEmail = '') => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
  const acceptUrl = `${baseUrl}/careers/offer?id=${candidateId}&email=${encodeURIComponent(candidateEmail)}&action=accept`;
  const declineUrl = `${baseUrl}/careers/offer?id=${candidateId}&email=${encodeURIComponent(candidateEmail)}&action=decline`;
  const statusUrl = `${baseUrl}/careers/status`;
  
  return `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Offer Letter — ${jobTitle}</h1>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">We are delighted to extend you an offer for the position of <strong>${jobTitle}</strong>.</p>
    <div style="margin: 25px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      ${offerContent || 'Please find the detailed offer letter attached.'}
    </div>
    
    ${candidateId ? `
    <div style="margin: 30px 0; text-align: center;">
      <p style="color: #1e293b; font-size: 15px; font-weight: bold; margin-bottom: 20px;">Ready to respond? Click below:</p>
      <div style="display: inline-block;">
        <a href="${acceptUrl}" style="background: #059669; color: white; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 8px;">✅ Accept Offer</a>
        <a href="${declineUrl}" style="background: #f1f5f9; color: #64748b; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; margin: 0 8px; border: 1px solid #e2e8f0;">Decline</a>
      </div>
    </div>
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 10px;">Or track your application at: <a href="${statusUrl}" style="color: #4f46e5;">${statusUrl}</a></p>
    ` : ''}
    
    <p style="color: #475569; font-size: 14px; line-height: 1.8;">Please review and respond at your earliest convenience. We're excited to welcome you to the team!</p>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;
};

export const getRejectionEmailTemplate = (candidateName, jobTitle) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #475569 0%, #64748b 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">Thank you for your interest in the <strong>${jobTitle}</strong> position and for the time you invested in the interview process.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">After careful consideration, we have decided to move forward with another candidate whose experience more closely aligns with our current requirements.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">This decision does not diminish the value of your qualifications. We encourage you to apply for future openings that match your profile.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">We genuinely appreciate your interest and wish you the very best in your career journey.</p>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;

export const getOnboardingWelcomeTemplate = (employeeName, joiningDate, roleName) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Welcome Aboard!</h1>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${employeeName}</strong>,</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">Welcome to the team! We're thrilled to have you join us as <strong>${roleName || 'a valued team member'}</strong>.</p>
    <div style="background: #faf5ff; border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 4px solid #8b5cf6;">
      <p style="color: #6b21a8; font-size: 14px; margin: 0; font-weight: bold;">📋 Joining Date: ${joiningDate}</p>
    </div>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">Your onboarding checklist has been created. Our HR team will guide you through the documentation, IT setup, and orientation process.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">If you have any questions before your start date, don't hesitate to reach out!</p>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;
export const getManualCommunicationTemplate = (candidateName, subject, message) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Message from HR Department</h1>
  </div>
  <div style="padding: 30px;">
    <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Dear <strong>${candidateName}</strong>,</p>
    <div style="color: #475569; font-size: 15px; line-height: 1.8; margin-top: 20px;">
      ${message.replace(/\n/g, '<br/>')}
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.8; margin-top: 30px;">Best regards,<br/><strong>Human Resources Team</strong></p>
  </div>
  <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 Bizmate Technologies. All rights reserved.</p>
  </div>
</div>
`;
