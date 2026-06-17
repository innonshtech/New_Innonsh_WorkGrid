import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';
import { summarizeFeedback } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        const body = await request.json();
        const { candidateId, interviewId, rawNotes, round, candidateName, interviewerName } = body;

        if (!rawNotes || rawNotes.trim().length < 10) {
            return NextResponse.json({ 
                success: false, 
                error: "Feedback notes are required (minimum 10 characters)" 
            }, { status: 400 });
        }

        if (!candidateId) {
            return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 });
        }

        // AI summarize feedback
        const structured = await summarizeFeedback(rawNotes, candidateName, round);

        // Save to DB
        const orgId = authUser.role !== 'super_admin' ? authUser.organizationId : body.organizationId;

        const feedback = await InterviewFeedback.create({
            candidate: candidateId,
            interviewId: interviewId || `feedback-${Date.now()}`,
            round: round || 'Technical Interview',
            interviewerName: interviewerName || 'Anonymous',
            rawNotes,
            structuredFeedback: structured,
            aiProcessed: true,
            organizationId: orgId
        });

        return NextResponse.json({
            success: true,
            data: { feedback, structured },
            message: "Feedback processed by AI"
        });
    } catch (error) {
        console.error("AI SUMMARIZE FEEDBACK ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get('candidateId');

        let query = {};
        if (authUser.role !== 'super_admin' && authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        }
        if (candidateId) query.candidate = candidateId;

        const feedbacks = await InterviewFeedback.find(query)
            
            ;

        return NextResponse.json({ success: true, feedbacks });
    } catch (error) {
        console.error("GET FEEDBACKS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
