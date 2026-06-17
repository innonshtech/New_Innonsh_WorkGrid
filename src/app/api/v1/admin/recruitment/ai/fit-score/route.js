import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';
import { calculateFitScore } from '@/lib/ai/gemini';

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        const body = await request.json();
        const { candidateId, jobId } = body;

        if (!candidateId) {
            return NextResponse.json({ success: false, error: "Candidate ID is required" }, { status: 400 });
        }

        const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: candidateId }, { mongoId: candidateId }] } });
        if (!candidate) {
            return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
        }

        // Get job requirements
        let jobRequirements = {};
        if (jobId) {
            const job = await prisma.jobRequisition.findFirst({ where: { OR: [{ id: jobId }, { mongoId: jobId }] } });
            if (job) {
                jobRequirements = {
                    title: job.title,
                    department: job.department,
                    description: job.description,
                    requirements: job.requirements,
                    skillsRequired: job.skillsRequired
                };
            }
        } else if (candidate.jobRequisitionId) {
            const job = await prisma.jobRequisition.findFirst({ where: { OR: [{ id: candidate.jobRequisitionId }, { mongoId: candidate.jobRequisitionId }] } });
            if (job) {
                jobRequirements = {
                    title: job.title,
                    department: job.department,
                    description: job.description,
                    requirements: job.requirements,
                    skillsRequired: job.skillsRequired
                };
            }
        }

        const candidateData = candidate.candidateData || {};
        const parsedResume = candidateData.parsedResume || {};

        // Build candidate profile from parsed resume or basic info
        const candidateProfile = {
            skills: parsedResume.skills || [],
            totalExperienceYears: parsedResume.totalExperienceYears || 0,
            currentRole: parsedResume.currentRole || candidateData.appliedRole || '',
            education: parsedResume.education || [],
            summary: parsedResume.summary || candidateData.notes || ''
        };

        const result = await calculateFitScore(candidateProfile, jobRequirements);

        // Save fit score to candidate
        candidateData.fitScore = result.fitScore;
        candidateData.fitAnalysis = result.analysis;
        candidateData.fitRecommendation = result.recommendation;
        candidateData.fitStrengths = result.strengths || [];
        candidateData.fitGaps = result.gaps || [];
        
        await prisma.candidate.update({
            where: { id: candidate.id },
            data: { candidateData }
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: `Fit score calculated: ${result.fitScore}/100`
        });
    } catch (error) {
        console.error("AI FIT SCORE ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
