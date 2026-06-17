import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import { getManualCommunicationTemplate } from '@/lib/email/templates/recruitment';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        
        const { candidateId, subject, message } = await request.json();

        if (!candidateId || !subject || !message) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

                const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: candidateId }, { mongoId: candidateId }] } });
        if (!candidate) {
            return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
        }

        const candidateName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || "Candidate";

        // Send formal manual email
        const result = await sendEmail({
            to: candidate.email,
            subject: subject,
            html: getManualCommunicationTemplate(candidateName, subject, message)
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return NextResponse.json({ 
            success: true, 
            message: `Email successfully sent to ${candidateName}` 
        }, { status: 200 });

    } catch (error) {
        console.error("MANUAL EMAIL API ERROR:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || "Failed to send email" 
        }, { status: 500 });
    }
}
