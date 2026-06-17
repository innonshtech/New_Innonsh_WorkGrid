import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';
import { calculateFitScore } from '@/lib/ai/gemini';

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const body = await request.json();
    const { requirementId } = body;

    if (!requirementId) {
      return NextResponse.json({ success: false, error: "Requirement ID is required" }, { status: 400 });
    }

    // 1. Fetch requirement details
    const requirementRecord = await prisma.staffingRequirement.findFirst({ where: {
      OR: [{ id: requirementId }, { mongoId: requirementId }]
    } });

    if (!requirementRecord) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    // Verify client belongs to organization to secure the data
    const client = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: requirementRecord.clientId }, { mongoId: requirementRecord.clientId }],
      organizationId: authUser.organizationId
    } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    const reqData = typeof requirementRecord.requirementData === 'object' && requirementRecord.requirementData !== null ? requirementRecord.requirementData : {};
    const requirement = {
      ...requirementRecord,
      ...reqData,
      id: requirementRecord.id,
      _id: requirementRecord.id
    };

    // 2. Stage 1: Fetch all candidates, then filter in-memory
    //    (parsedResume is JSON so can't use native Prisma queries on nested fields)
    let candidatesRaw = await prisma.staffingCandidate.findMany({
      where: { organizationId: authUser.organizationId }
    });

    let candidates = candidatesRaw.map(c => {
      const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      return {
        ...c,
        ...data,
        id: c.id,
        _id: c.id
      };
    });

    // Skill overlap filter (Loosened to allow partial matches)
    if (requirement.skillsRequired && requirement.skillsRequired.length > 0) {
      const baseWords = requirement.skillsRequired.map(skill => skill.trim().split(/[\s-]/)[0].toLowerCase());
      candidates = candidates.filter(c => {
        const candidateSkills = (c.parsedResume?.skills || []).map(s => s.toLowerCase());
        return baseWords.some(bw => candidateSkills.some(cs => cs.includes(bw)));
      });
    }

    // Experience filter (optional, allow ± 2 years of leniency)
    if (requirement.minExperience > 0) {
      const minExp = Math.max(0, requirement.minExperience - 2);
      candidates = candidates.filter(c => (c.parsedResume?.totalExperienceYears || 0) >= minExp);
    }

    console.log(`AI Match Stage 1: Filtered query returned. Fetching candidates...`);

    // If filter was too strict and returned no candidates, fall back to fetching all available candidates
    if (candidates.length === 0) {
      console.log("Stage 1 filter too strict, falling back to all available candidates.");
      candidatesRaw = await prisma.staffingCandidate.findMany({ where: {
        organizationId: authUser.organizationId,
        status: "available"
      } });
      candidates = candidatesRaw.map(c => {
        const data = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
        return {
          ...c,
          ...data,
          id: c.id,
          _id: c.id
        };
      });
    }

    // Cap the AI evaluations to a maximum of 25 candidates to avoid rate limits and keep it light
    const isCapped = candidates.length > 25;
    const candidatesToScore = candidates.slice(0, 25);
    console.log(`AI Match Stage 2: Scoring ${candidatesToScore.length} candidates using Gemini...`);

    // 3. Stage 2: Run AI Matching in Parallel
    const matchPromises = candidatesToScore.map(async (candidate) => {
      try {
        const fitAnalysis = await calculateFitScore(candidate.parsedResume, requirement);
        return {
          candidate: {
            _id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            resumeUrl: candidate.resumeUrl,
            parsedResume: candidate.parsedResume
          },
          fitScore: fitAnalysis.fitScore || 0,
          analysis: fitAnalysis.analysis || "",
          strengths: fitAnalysis.strengths || [],
          gaps: fitAnalysis.gaps || [],
          recommendation: fitAnalysis.recommendation || "Pending Review",
          success: true
        };
      } catch (err) {
        console.error(`AI Scoring failed for candidate ${candidate.id}:`, err);
        return {
          candidate: {
            _id: candidate.id,
            name: candidate.name,
            email: candidate.email
          },
          success: false,
          errorType: err.name === 'GoogleAPIError' ? 'GOOGLE_API_KEY_ERROR' : 'UNKNOWN_ERROR',
          errorMessage: err.message
        };
      }
    });

    const matchResults = await Promise.all(matchPromises);
    const matches = matchResults.filter(m => m.success);
    const failedMatches = matchResults.filter(m => !m.success);

    return NextResponse.json({
      success: true,
      requirement,
      matches,
      failedMatches,
      totalScored: matches.length,
      cappedAt25: isCapped
    });

  } catch (error) {
    console.error("AI MATCHING API ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
