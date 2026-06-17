import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request) {
    try {
        const { candidateId, email, action } = await request.json();

        if (!candidateId || !email || !action) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        if (!['accept', 'decline'].includes(action)) {
            return NextResponse.json({ success: false, error: "Invalid action. Must be 'accept' or 'decline'" }, { status: 400 });
        }

        // Find candidate and verify email matches (security check)
        const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: candidateId }, { mongoId: candidateId }] } });
        if (!candidate) {
            return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
        }

        if (candidate.email.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json({ success: false, error: "Email verification failed" }, { status: 403 });
        }

        // Only allow acceptance if currently in Hired/Offer Sent state
        if (!['Hired', 'Offer Sent'].includes(candidate.status)) {
            return NextResponse.json({ 
                success: false, 
                error: `Cannot ${action} offer — current status is "${candidate.status}". Offer acceptance is only available when status is "Hired" or "Offer Sent".`
            }, { status: 400 });
        }

        if (action === 'accept') {
            await prisma.candidate.update({
                where: { id: candidate.id },
                data: { status: 'Confirmed' }
            });

            // Notify HR via email
            try {
                const { sendEmail } = await import('@/lib/email/service');
                await sendEmail({
                    to: process.env.HR_EMAIL || process.env.SMTP_USER || 'hr@company.com',
                    subject: `🎉 Offer Accepted: ${candidate.name} — ${candidate.appliedRole || 'Position'}`,
                    html: `
                        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">✅ Offer Accepted!</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                                    Great news! <strong>${candidate.name}</strong> has officially accepted the offer for the 
                                    <strong>${candidate.appliedRole || 'open'}</strong> position.
                                </p>
                                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Candidate:</strong> ${candidate.name}
                                    </p>
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Email:</strong> ${candidate.email}
                                    </p>
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Role:</strong> ${candidate.appliedRole || 'N/A'}
                                    </p>
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">CONFIRMED ✅</span>
                                    </p>
                                </div>
                                <p style="color: #64748b; font-size: 14px;">
                                    Please proceed with onboarding formalities.
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.warn("HR notification email skipped:", emailErr.message);
            }

            return NextResponse.json({ 
                success: true, 
                message: "Congratulations! You have accepted the offer. Our HR team will reach out with onboarding details shortly.",
                newStatus: 'Confirmed'
            });

        } else {
            // Decline
            await prisma.candidate.update({
                where: { id: candidate.id },
                data: { status: 'Declined' }
            });

            // Notify HR
            try {
                const { sendEmail } = await import('@/lib/email/service');
                await sendEmail({
                    to: process.env.HR_EMAIL || process.env.SMTP_USER || 'hr@company.com',
                    subject: `⚠️ Offer Declined: ${candidate.name} — ${candidate.appliedRole || 'Position'}`,
                    html: `
                        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
                            <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px; text-align: center;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">Offer Declined</h1>
                            </div>
                            <div style="padding: 32px;">
                                <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                                    Unfortunately, <strong>${candidate.name}</strong> has declined the offer for the 
                                    <strong>${candidate.appliedRole || 'open'}</strong> position.
                                </p>
                                <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Candidate:</strong> ${candidate.name}
                                    </p>
                                    <p style="margin: 8px 0; color: #64748b; font-size: 14px;">
                                        <strong>Email:</strong> ${candidate.email}
                                    </p>
                                </div>
                                <p style="color: #64748b; font-size: 14px;">
                                    Consider reaching out to discuss their concerns or proceed with alternate candidates.
                                </p>
                            </div>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.warn("HR notification email skipped:", emailErr.message);
            }

            return NextResponse.json({ 
                success: true, 
                message: "We're sorry to see you go. Thank you for your time and we wish you the best.",
                newStatus: 'Declined'
            });
        }

    } catch (error) {
        console.error("OFFER RESPONSE ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
