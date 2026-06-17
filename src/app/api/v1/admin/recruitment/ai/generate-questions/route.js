import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';
import { generateInterviewQuestions } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        const body = await request.json();
        const { jobId, jobTitle, requirements, round, candidateSummary } = body;

        let finalTitle = jobTitle;
        let finalRequirements = requirements || [];

        // If jobId provided, fetch details from DB
        if (jobId) {
            const job = await prisma.jobRequisition.findFirst({ where: { OR: [{ id: jobId }, { mongoId: jobId }] } });
            if (job) {
                finalTitle = job.title;
                finalRequirements = [...(job.requirements || []), ...(job.skillsRequired || [])];
            }
        }

        if (!finalTitle) {
            return NextResponse.json({ success: false, error: "Job title or Job ID is required" }, { status: 400 });
        }

        const result = await generateInterviewQuestions({
            jobTitle: finalTitle,
            requirements: finalRequirements,
            round: round || 'Technical Interview',
            candidateSummary
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: `Generated ${result.questions?.length || 0} interview questions`
        });
    } catch (error) {
        console.error("AI GENERATE QUESTIONS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
