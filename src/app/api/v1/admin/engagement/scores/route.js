import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(req) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;
        const orgQuery = org ? { in: [org.id, org.mongoId].filter(Boolean) } : authUser.organizationId;

        // Fetch all responses under organization
        const allResponses = await prisma.pulseResponse.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        // Group responses by surveyId in-memory since surveyId is in modelData JSON
        const groups = {};
        allResponses.forEach(r => {
            const mData = r.modelData || {};
            const sId = mData.surveyId;
            if (!sId) return;

            const score = parseFloat(mData.engagementScore) || 0;
            if (!groups[sId]) {
                groups[sId] = {
                    surveyId: sId,
                    totalScore: 0,
                    count: 0
                };
            }
            groups[sId].totalScore += score;
            groups[sId].count += 1;
        });

        // Fetch all surveys under organization to map survey info
        const allSurveys = await prisma.pulseSurvey.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });
        const surveyMap = {};
        allSurveys.forEach(s => {
            const sData = s.surveyData && typeof s.surveyData === 'object' ? s.surveyData : {};
            const surveyInfo = {
                _id: s.id,
                id: s.id,
                mongoId: s.mongoId,
                title: s.title,
                status: s.status,
                ...sData,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt
            };
            surveyMap[s.id] = surveyInfo;
            if (s.mongoId) {
                surveyMap[s.mongoId] = surveyInfo;
            }
        });

        const stats = Object.values(groups).map(g => {
            const survey = surveyMap[g.surveyId] || null;
            return {
                _id: g.surveyId,
                averageScore: g.count > 0 ? (g.totalScore / g.count) : 0,
                totalResponses: g.count,
                survey
            };
        });

        return NextResponse.json({ success: true, stats });
    } catch (error) {
        console.error('Engagement stats error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}