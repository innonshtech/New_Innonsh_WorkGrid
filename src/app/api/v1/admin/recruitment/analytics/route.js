import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        let query = {};
        if (authUser.role !== 'super_admin' && authUser.organizationId) {
            query.organizationId = authUser.organizationId;
        }

        const [candidatesRaw, jobs] = await Promise.all([
            prisma.candidate.findMany(),
            prisma.jobRequisition.findMany({ where: query })
        ]);

        const targetOrgId = authUser.role !== 'super_admin' ? authUser.organizationId : null;
        const filteredCandidates = targetOrgId 
            ? candidatesRaw.filter(c => {
                const data = c.candidateData && typeof c.candidateData === 'object' ? c.candidateData : {};
                return data.organizationId === targetOrgId;
              })
            : candidatesRaw;

        const candidates = filteredCandidates.map(c => {
            const data = c.candidateData && typeof c.candidateData === 'object' ? c.candidateData : {};
            return {
                ...c,
                source: data.source,
                appliedDate: data.appliedDate || c.createdAt,
                fitScore: data.fitScore
            };
        });

        // 1. Funnel conversion rates
        const stages = ['Applied', 'Screening', 'Interviewing', 'Offer Sent', 'Hired', 'Rejected'];
        const funnelData = stages.map(stage => ({
            stage,
            count: candidates.filter(c => c.status === stage).length
        }));

        // 2. Source effectiveness
        const sources = ['LinkedIn', 'Indeed', 'Referral', 'Website', 'Other'];
        const sourceData = sources.map(source => {
            const fromSource = candidates.filter(c => c.source === source);
            const hired = fromSource.filter(c => c.status === 'Hired');
            return {
                source,
                total: fromSource.length,
                hired: hired.length,
                conversionRate: fromSource.length > 0 ? Math.round((hired.length / fromSource.length) * 100) : 0
            };
        });

        // 3. Time-to-hire per job (average days from applied to hired)
        const hiredCandidates = candidates.filter(c => c.status === 'Hired');
        const timeToHire = hiredCandidates.map(c => {
            const appliedDate = new Date(c.appliedDate || c.createdAt);
            const hiredDate = new Date(c.updatedAt);
            const days = Math.ceil((hiredDate - appliedDate) / (1000 * 60 * 60 * 24));
            return days;
        });
        const avgTimeToHire = timeToHire.length > 0 ? Math.round(timeToHire.reduce((a, b) => a + b, 0) / timeToHire.length) : 0;

        // 4. Jobs overview
        const jobStats = {
            total: jobs.length,
            open: jobs.filter(j => j.status === 'Open').length,
            closed: jobs.filter(j => j.status === 'Closed').length,
            onHold: jobs.filter(j => j.status === 'On Hold').length
        };

        // 5. Monthly hiring trend (last 6 months)
        const now = new Date();
        const monthlyHires = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthLabel = monthStart.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short', year: '2-digit' });
            
            const hiredInMonth = hiredCandidates.filter(c => {
                const hDate = new Date(c.updatedAt);
                return hDate >= monthStart && hDate <= monthEnd;
            });
            
            monthlyHires.push({ month: monthLabel, hires: hiredInMonth.length });
        }

        // 6. Fit score distribution
        const withFitScore = candidates.filter(c => c.fitScore != null);
        const fitDistribution = {
            excellent: withFitScore.filter(c => c.fitScore >= 90).length,
            strong: withFitScore.filter(c => c.fitScore >= 75 && c.fitScore < 90).length,
            decent: withFitScore.filter(c => c.fitScore >= 60 && c.fitScore < 75).length,
            weak: withFitScore.filter(c => c.fitScore < 60).length,
            unscored: candidates.length - withFitScore.length
        };

        // 7. Overall stats
        const overallStats = {
            totalCandidates: candidates.length,
            activePipeline: candidates.filter(c => !['Hired', 'Rejected', 'Withdrawn'].includes(c.status)).length,
            totalHired: hiredCandidates.length,
            totalRejected: candidates.filter(c => c.status === 'Rejected').length,
            avgTimeToHire,
            averageFitScore: withFitScore.length > 0 ? Math.round(withFitScore.reduce((a, c) => a + c.fitScore, 0) / withFitScore.length) : null
        };

        return NextResponse.json({
            success: true,
            analytics: {
                funnelData,
                sourceData,
                jobStats,
                monthlyHires,
                fitDistribution,
                overallStats
            }
        });
    } catch (error) {
        console.error("ANALYTICS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
