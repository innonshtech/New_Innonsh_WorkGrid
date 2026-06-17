export const getSurveyTemplate = (surveyTitle, dashboardUrl) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 40px; height: 40px; background-color: #4f46e5; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 20px;">H</div>
    <h2 style="color: #1e293b; margin-top: 10px;">New Pulse Survey</h2>
  </div>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">A new pulse survey "<strong>${surveyTitle}</strong>" has been published. We value your feedback!</p>
  <div style="text-align: center; margin: 40px 0;">
    <a href="${dashboardUrl}/engagement/surveys" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Take Survey</a>
  </div>
  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px;">&copy; 2026 HR Portal. All rights reserved.</p>
</div>
`;

export const getShoutOutTemplate = (authorName, content, dashboardUrl) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; width: 40px; height: 40px; background-color: #f59e0b; border-radius: 8px; line-height: 40px; color: white; font-weight: bold; font-size: 20px;">S</div>
    <h2 style="color: #1e293b; margin-top: 10px;">You received a Shout-Out!</h2>
  </div>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hi there,</p>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;"><strong>${authorName}</strong> just gave you a public shout-out on the social feed:</p>
  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; font-style: italic; color: #92400e; border-radius: 4px;">
    "${content}"
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${dashboardUrl}/engagement/feed" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View on Social Feed</a>
  </div>
  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px;">&copy; 2026 HR Portal. All rights reserved.</p>
</div>
`;

export const getApplicationReceivedTemplate = ({ candidateName, jobTitle, applicationId }) => {
    return {
        subject: `Application Received: ${jobTitle}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #4f46e5; margin: 0;">Application Received</h1>
            </div>
            <p>Hi <strong>${candidateName}</strong>,</p>
            <p>Thank you for applying for the <strong>${jobTitle}</strong> position. We have safely received your application and resume.</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase;">Your Application Tracking ID</p>
                <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #4f46e5;">${applicationId}</p>
            </div>
            <p>Best regards,<br/><strong>Team Xpertance</strong></p>
        </div>
        `
    };
};

export const getCandidateStatusChangeTemplate = ({ candidateName, jobTitle, newStatus }) => {
    const statusMessages = {
        'Screening': {
            subject: `Profile Under Review: ${jobTitle}`,
            heading: 'Your Profile is Being Reviewed',
            body: `We are pleased to inform you that your application for <strong>${jobTitle}</strong> has advanced to the screening stage.`,
            color: '#6366f1'
        },
        'Interviewing': {
            subject: `Next Steps: Interview Scheduled for ${jobTitle}`,
            heading: 'Interview Scheduled',
            body: `Congratulations! Your application for <strong>${jobTitle}</strong> has been shortlisted. We will schedule an Interview with you shortly.`,
            color: '#0ea5e9'
        },
        'Offer Sent': {
            subject: `Offer Letter: ${jobTitle}`,
            heading: 'Your Offer is Ready!',
            body: `We are thrilled to extend an offer for the <strong>${jobTitle}</strong> position. Details will follow shortly.`,
            color: '#10b981'
        },
        'Rejected': {
            subject: `Application Update: ${jobTitle}`,
            heading: 'Application Update',
            body: `Thank you for your interest in <strong>${jobTitle}</strong>. After careful review, we have decided to move forward with other candidates. We encourage you to apply for future openings.`,
            color: '#64748b'
        }
    };
    const config = statusMessages[newStatus];
    if (!config) return null;
    return {
        subject: config.subject,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="border-bottom: 3px solid ${config.color}; padding-bottom: 12px; margin-bottom: 24px;">
                <h1 style="color: ${config.color}; margin: 0; font-size: 22px;">${config.heading}</h1>
            </div>
            <p>Hi <strong>${candidateName}</strong>,</p>
            <p style="line-height: 1.6;">${config.body}</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${config.color};">
                <p style="margin: 0; font-size: 13px; color: #64748b;">Current Stage: <strong style="color: ${config.color};">${newStatus}</strong></p>
            </div>
            <p>Best regards,<br/><strong>Team Xpertance</strong></p>
        </div>
        `
    };
};

export const getSystemNotificationTemplate = ({ title, message, priority, dashboardUrl }) => {
    let color = '#4f46e5'; // default indigo
    if (priority === 'high') color = '#ef4444'; // red
    else if (priority === 'low') color = '#10b981'; // green

    return {
        subject: `Notification: ${title}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <div style="border-bottom: 3px solid ${color}; padding-bottom: 12px; margin-bottom: 24px;">
                <h1 style="color: ${color}; margin: 0; font-size: 22px;">System Notification</h1>
            </div>
            <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
            <p style="line-height: 1.6; white-space: pre-wrap; color: #475569;">${message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${dashboardUrl}/employee/dashboard" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">View Dashboard</a>
            </div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">This is an automated notification from your HR portal.</p>
        </div>
        `
    };
};
