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

        // 1. Find all eNPS enabled surveys under the organization
        const allSurveys = await prisma.pulseSurvey.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        const enpsSurveys = allSurveys.filter(s => {
            const sData = s.surveyData || {};
            return sData.isEnps === true;
        });

        const surveyIds = [];
        enpsSurveys.forEach(s => {
            surveyIds.push(s.id);
            if (s.mongoId) {
                surveyIds.push(s.mongoId);
            }
        });

        if (surveyIds.length === 0) {
            return NextResponse.json({ 
                success: true, 
                enps: 0, 
                totalResponses: 0, 
                breakdown: { promoters: 0, detractors: 0, passives: 0, promoterPct: 0, detractorPct: 0, passivePct: 0 } 
            });
        }

        // 2. Fetch all responses under organization
        const allResponses = await prisma.pulseResponse.findMany({
            where: {
                OR: [
                    { organizationId: orgQuery },
                    { organizationId: null }
                ]
            }
        });

        // Filter responses in-memory
        const responses = allResponses.filter(r => {
            const mData = r.modelData || {};
            return surveyIds.includes(mData.surveyId);
        });

        if (responses.length === 0) {
            return NextResponse.json({ 
                success: true, 
                enps: 0, 
                totalResponses: 0, 
                breakdown: { promoters: 0, detractors: 0, passives: 0, promoterPct: 0, detractorPct: 0, passivePct: 0 } 
            });
        }

        // 3. Calculate eNPS using engagementScore inside modelData JSON
        let promoters = 0; // 9-10
        let detractors = 0; // 0-6
        let passives = 0; // 7-8

        responses.forEach(resp => {
            const mData = resp.modelData || {};
            const score = parseInt(mData.engagementScore) || 0;
            if (score >= 9) promoters++;
            else if (score <= 6) detractors++;
            else passives++;
        });

        const total = responses.length;
        const promoterPct = (promoters / total) * 100;
        const detractorPct = (detractors / total) * 100;
        const passivePct = (passives / total) * 100;
        const enps = Math.round(promoterPct - detractorPct);

        return NextResponse.json({
            success: true,
            enps,
            totalResponses: total,
            breakdown: {
                promoters,
                detractors,
                passives,
                promoterPct: Math.round(promoterPct),
                detractorPct: Math.round(detractorPct),
                passivePct: Math.round(passivePct)
            }
        });
    } catch (error) {
        console.error('eNPS calculation error:', error);
        return NextResponse.json({ success: false, message: 'Server error: ' + error.message }, { status: error.status || 500 });
    }
}