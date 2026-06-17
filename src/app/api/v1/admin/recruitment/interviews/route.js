import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';



import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        // SaaS PROTECTION: Scope to org
        let query = {};
        let interviewerQuery = { status: 'Active' };
        let orgQueryVal = undefined;
        let orgId = undefined;
        if (authUser.role !== "super_admin" && authUser.organizationId) {
            orgId = authUser.organizationId;
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                orgQueryVal = { in: [org.id, org.mongoId].filter(Boolean) };
                interviewerQuery.organizationId = orgQueryVal;
            } else {
                orgQueryVal = orgId;
                interviewerQuery.organizationId = orgId;
            }
        }

        // Fetch candidates with interviews
        let candidates = await prisma.candidate.findMany();

        // Filter candidates by organizationId in-memory to support JSON-based tenant scoping safely
        if (orgId) {
            const allowedOrgIds = orgQueryVal && typeof orgQueryVal === 'object' && orgQueryVal.in 
                ? orgQueryVal.in 
                : [orgId];
            candidates = candidates.filter(c => {
                const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
                return allowedOrgIds.includes(data.organizationId);
            });
        }

        const interviewers = await prisma.employee.findMany({ where: interviewerQuery });

        // Flatten interviews for easy consumption by the UI
        const allInterviews = candidates.flatMap(candidate => {
            const data = candidate.candidateData || {};
            const interviews = data.interviews || [];
            return interviews.map(interview => {
                // Format interviewer name if populated
                let interviewerData = interview.interviewer;
                if (interviewerData && interviewerData.personalDetails) {
                    interviewerData = {
                        ...interviewerData,
                        name: `${interviewerData.personalDetails.firstName} ${interviewerData.personalDetails.lastName}`
                    };
                }

                return {
                    ...interview,
                    _id: interview.id || interview._id,
                    interviewer: interviewerData, // Replace with object containing the name
                    candidateId: candidate.id,
                    candidateName: `${candidate.firstName} ${candidate.lastName}`,
                    candidateEmail: candidate.email,
                    role: data.appliedRole || "N/A",
                    interviewId: interview._id || interview.id
                };
            });
        });

        return NextResponse.json({
            success: true,
            interviews: allInterviews,
            interviewers: interviewers.map(emp => ({
                _id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                designation: emp.designation,
                department: emp.department
            }))
        });
    } catch (error) {
        console.error("GET INTERVIEWS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { candidateId, interview } = body;

        if (!candidateId || !interview) {
            return NextResponse.json({ error: "Candidate ID and interview details are required" }, { status: 400 });
        }
        const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: candidateId }, { mongoId: candidateId }] } });
        if (!candidate) {
            console.error("CANDIDATE NOT FOUND:", candidateId);
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        // Logic to sync status with the round type
        const roundToStageMap = {
            'Screening': 'Screening',
            'Interviewing': 'Interviewing'
        };

        let newStatus = candidate.status;
        if (roundToStageMap[interview.round]) {
            newStatus = roundToStageMap[interview.round];
        }

        // Add to interviews array
        const candidateData = candidate.candidateData || {};
        const interviews = candidateData.interviews || [];
        
        // ensure an ID exists
        interview.id = interview.id || `int_${Date.now()}`;
        interviews.push(interview);
        candidateData.interviews = interviews;

        const updatedCandidate = await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
                status: newStatus,
                candidateData
            }
        });

        // 🚀 Gap Fix #10: Send Interview Invitation Email
        try {
            const { sendEmail } = await import('@/lib/email/service');
            const { getInterviewInviteTemplate } = await import('@/lib/email/templates/recruitment');
            
            // Resolve interviewer name
            const interviewer = await prisma.employee.findFirst({ where: { OR: [{ id: interview.interviewer }, { mongoId: interview.interviewer }] } });
            const interviewerName = interviewer ? `${interviewer.firstName} ${interviewer.lastName}` : 'an HR Representative';
            
            // Format date for email
            const formattedDate = new Date(interview.date).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await sendEmail({
                to: candidate.email,
                subject: `Interview Invitation: ${interview.round} — ${candidate.appliedRole || 'the position'}`,
                html: getInterviewInviteTemplate(
                    `${candidate.firstName} ${candidate.lastName}`, 
                    interview.round, 
                    formattedDate, 
                    interview.meetingLink, 
                    interviewerName,
                    interview.mode,
                    interview.location
                )
            });
        } catch (emailErr) {
            console.warn("📧 Interview email skipped:", emailErr.message);
        }

        return NextResponse.json({ success: true, message: "Interview scheduled successfully", candidate: updatedCandidate });
    } catch (error) {
        console.error("POST INTERVIEW ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { candidateId, interviewId, updateData } = body;

        if (!candidateId || !interviewId) {
            return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
        }

        console.log("PUT INTERVIEW UPDATE RECEIVED:", { candidateId, interviewId, decision: updateData.decision });

        const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: candidateId }, { mongoId: candidateId }] } });
        if (!candidate) {
            console.error("CANDIDATE NOT FOUND:", candidateId);
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        const candidateName = `${candidate.firstName} ${candidate.lastName}`;
        console.log("CANDIDATE FOUND:", candidateName, "Current Status:", candidate.status);

        const candidateData = candidate.candidateData || {};
        const interviews = candidateData.interviews || [];

        // Update the specific interview in the array
        const interviewIndex = interviews.findIndex(i => (i._id && i._id.toString() === interviewId) || i.id === interviewId);
        if (interviewIndex === -1) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

        const originalInterview = interviews[interviewIndex];
        const decision = updateData.decision;

        // Merge updates
        interviews[interviewIndex] = {
            ...originalInterview,
            ...updateData
        };
        candidateData.interviews = interviews;

        let newStatus = candidate.status;

        // Decision-Driven Pipeline Updates
        // --- PIPELINE AUTOMATION LOGIC ---
        // 1. Handle Promotion (Next Stage)
        if (updateData.decision === 'Promoted') {
            const rounds = ['Applied', 'Screening', 'Interviewing', 'Offer Sent', 'Hired'];
            const currentIndex = rounds.indexOf(candidate.status);
            if (currentIndex !== -1 && currentIndex < rounds.length - 1) {
                newStatus = rounds[currentIndex + 1];
            }
        }

        // 2. Handle Rejection (Closed)
        if (updateData.decision === 'Rejected') {
            newStatus = 'Rejected';
            try {
                const { sendEmail } = await import('@/lib/email/service');
                const { getRejectionEmailTemplate } = await import('@/lib/email/templates/recruitment');
                
                await sendEmail({
                    to: candidate.email,
                    subject: `Update regarding your application - ${candidateData.appliedRole || 'Team Member'}`,
                    html: getRejectionEmailTemplate(
                        candidateName, 
                        candidateData.appliedRole || 'Team Member'
                    )
                });
            } catch (err) {
                console.error("Auto-rejection email failed:", err);
            }
        }

        // 3. Handle Hiring & Offers
        if (updateData.decision === 'Hired' || updateData.decision === 'Offer Sent') {
            newStatus = updateData.decision;
            
            try {
                const { sendEmail } = await import('@/lib/email/service');
                const { getOfferLetterEmailTemplate } = await import('@/lib/email/templates/recruitment');
                const { generateOfferLetter } = await import('@/lib/pdf/offer-generator');

                console.log("GENERATING OFFER FOR:", candidateName);
                const pdfDataUri = generateOfferLetter({
                    candidateName: candidateName,
                    jobTitle: candidateData.appliedRole || 'Team Member',
                    salary: "As per Discussion",
                    joiningDate: "Immediate"
                });

                const attachments = [];
                if (pdfDataUri && pdfDataUri.includes('base64,')) {
                    attachments.push({
                        filename: `Offer_Letter_${candidateName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfDataUri.split('base64,')[1],
                        encoding: 'base64'
                    });
                }

                console.log("SENDING EMAIL TO:", candidate.email, "Attachments:", attachments.length);
                const emailResult = await sendEmail({
                    to: candidate.email,
                    subject: `Offer Letter: ${candidateData.appliedRole || 'Team Member'} position at Bizmate Technologies`,
                    html: getOfferLetterEmailTemplate(
                        candidateName, 
                        candidateData.appliedRole || 'Team Member',
                        null,
                        candidateId,
                        candidate.email
                    ),
                    attachments
                });
                console.log("EMAIL RESULT:", emailResult.success ? "SUCCESS" : "FAILED", emailResult.error || "");
            } catch (err) {
                console.error("CRITICAL OFFER ERROR:", err);
            }
        } else if (updateData.decision === 'On Hold') {
            candidateData.isOnHold = true;
        }

        console.log("INTERVIEW RECORD UPDATED:", interviewId);
        console.log("SAVING CANDIDATE:", candidateName, "Final Status:", newStatus);
        
        await prisma.candidate.update({
            where: { id: candidate.id },
            data: {
                status: newStatus,
                candidateData
            }
        });
        
        return NextResponse.json({ 
            success: true, 
            message: `Decision '${updateData.decision}' processed successfully`,
            newStatus: newStatus 
        });
    } catch (error) {
        console.error("PUT INTERVIEW ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
