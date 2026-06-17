import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        let query = {};
        
        // SaaS PROTECTION: Scope to org
        let orgQueryVal = undefined;
        const orgId = authUser.role === 'admin' ? authUser.organizationId : searchParams.get('organizationId');
        if (orgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                orgQueryVal = { in: [org.id, org.mongoId].filter(Boolean) };
            } else {
                orgQueryVal = orgId;
            }
        }

        if (jobId) query.jobRequisitionId = jobId;

        let candidatesRecords = await prisma.candidate.findMany({ where: query });

        // Filter by organizationId in-memory to support JSON-based tenant scoping safely
        if (orgId) {
            const allowedOrgIds = orgQueryVal && typeof orgQueryVal === 'object' && orgQueryVal.in 
                ? orgQueryVal.in 
                : [orgId];
            candidatesRecords = candidatesRecords.filter(c => {
                const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
                return allowedOrgIds.includes(data.organizationId);
            });
        }

        // Fetch all jobs in organization to map jobRequisition structures
        const jobs = await prisma.jobRequisition.findMany({
            where: orgQueryVal ? { organizationId: orgQueryVal } : {}
        });
        const jobsMap = {};
        jobs.forEach(j => {
            const jData = (j.jobData && typeof j.jobData === 'object') ? j.jobData : {};
            const jobObj = {
                _id: j.id,
                id: j.id,
                title: j.title,
                department: jData.department,
                location: jData.location
            };
            jobsMap[j.id] = jobObj;
            if (j.mongoId) {
                jobsMap[j.mongoId] = jobObj;
            }
        });

        const candidates = candidatesRecords.map(c => {
            const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
            
            let jobReq = null;
            if (c.jobRequisitionId && jobsMap[c.jobRequisitionId]) {
                jobReq = jobsMap[c.jobRequisitionId];
            } else if (data.jobRequisition && jobsMap[data.jobRequisition]) {
                jobReq = jobsMap[data.jobRequisition];
            }

            let candidateName = `${c.firstName || ''} ${c.lastName || ''}`.trim();
            if ((!candidateName || candidateName === 'Unknown Unknown' || candidateName === 'Unknown') && data.name) {
                candidateName = data.name;
            }

            return {
                ...c,
                ...data,
                id: c.id,
                _id: c.id,
                name: candidateName,
                jobRequisition: jobReq
            };
        });

        // Group candidates by status (stages)
        const pipeline = candidates.reduce((acc, candidate) => {
            const status = candidate.status || 'Applied';
            if (!acc[status]) acc[status] = [];
            acc[status].push(candidate);
            return acc;
        }, {});

        return NextResponse.json({ 
            success: true,
            pipeline,
            candidates,
            totalCandidates: candidates.length
        });
    } catch (error) {
        console.error("PIPELINE API ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
    }
}
