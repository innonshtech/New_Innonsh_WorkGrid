import prisma from '@/lib/db/prisma';
import { parseResumeFromPDF, calculateFitScore } from '@/lib/ai/gemini';
import fs from 'fs/promises';
import path from 'path';

function resumeUrlToAbsolutePath(resumeUrl) {
  if (!resumeUrl || typeof resumeUrl !== 'string') return null;
  const clean = resumeUrl.replace(/^[\\/]+/, '');
  return path.join(process.cwd(), 'public', clean);
}

export async function processCandidateResumeInBackground(candidateId) {
  if (!candidateId) return;

  try {
    const candidate = await prisma.candidate.findFirst({
      where: { OR: [{ id: candidateId }, { mongoId: candidateId }] }
    });
    if (!candidate) return;

    const candidateData = candidate.candidateData || {};

    if (candidateData.resumeParseStatus === 'processing' || candidateData.resumeParseStatus === 'done') {
      return;
    }

    // Update status to processing
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        candidateData: {
          ...candidateData,
          resumeParseStatus: 'processing',
          resumeParseError: null,
          resumeParseAttempts: (candidateData.resumeParseAttempts || 0) + 1
        }
      }
    });

    const resumeUrl = candidateData.resumeUrl;
    const resumePath = resumeUrlToAbsolutePath(resumeUrl);
    if (!resumePath) {
      throw new Error('Missing resumeUrl for candidate');
    }

    const buffer = await fs.readFile(resumePath);
    if (!buffer || buffer.length === 0) {
      throw new Error('Resume file is empty');
    }

    const aiResult = await parseResumeFromPDF(buffer, 'application/pdf');
    if (!aiResult) {
      throw new Error('AI resume parsing returned empty result');
    }

    const resumeText = aiResult.rawText || '';
    delete aiResult.rawText;

    let fitScore = candidateData.fitScore ?? 0;
    let fitAnalysis = candidateData.fitAnalysis || 'Analysis pending...';
    let fitRecommendation = candidateData.fitRecommendation || 'Pending Review';
    let fitStrengths = candidateData.fitStrengths || [];
    let fitGaps = candidateData.fitGaps || [];

    if (candidate.jobRequisitionId) {
      const job = await prisma.jobRequisition.findFirst({
        where: { OR: [{ id: candidate.jobRequisitionId }, { mongoId: candidate.jobRequisitionId }] }
      });
      if (job) {
        const candidateProfile = {
          skills: aiResult.skills || [],
          totalExperienceYears: aiResult.totalExperienceYears || 0,
          currentRole: aiResult.currentRole || '',
          education: aiResult.education || [],
          summary: aiResult.summary || '',
          rawText: resumeText
        };

        const jobData = job.jobData || {};
        const jobRequirements = {
          title: job.title || 'N/A',
          department: jobData.department || 'N/A',
          description: jobData.description || 'N/A',
          requirements: jobData.requirements || [],
          skillsRequired: jobData.skillsRequired || []
        };

        const fitResult = await calculateFitScore(candidateProfile, jobRequirements);
        if (fitResult) {
          fitScore = fitResult.fitScore || 0;
          fitAnalysis = fitResult.analysis || '';
          fitRecommendation = fitResult.recommendation || 'Weak Match';
          fitStrengths = fitResult.strengths || [];
          fitGaps = fitResult.gaps || [];
        }
      }
    }

    const updatedCandidate = await prisma.candidate.findFirst({ where: { id: candidate.id } });
    const freshData = updatedCandidate.candidateData || {};

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        candidateData: {
          ...freshData,
          parsedResume: aiResult,
          resumeText,
          fitScore,
          fitAnalysis,
          fitRecommendation,
          fitStrengths,
          fitGaps,
          resumeParseStatus: 'done',
          resumeParsedAt: new Date().toISOString(),
          resumeParseError: null
        }
      }
    });
  } catch (err) {
    try {
      const candidate = await prisma.candidate.findFirst({
        where: { OR: [{ id: candidateId }, { mongoId: candidateId }] }
      });
      if (candidate) {
        const freshData = candidate.candidateData || {};
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            candidateData: {
              ...freshData,
              resumeParseStatus: 'failed',
              resumeParseError: err?.message || String(err)
            }
          }
        });
      }
    } catch {
      // best-effort only
    }
  }
}
