import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


export async function GET(request) {
    try {
        
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        
        const query = { status: 'Open' };
        if (orgId) query.organizationId = orgId;
        
        const jobs = await prisma.jobRequisition.findMany({ where: query });
        const formattedJobs = jobs.map(j => {
            const data = j.jobData && typeof j.jobData === 'object' ? j.jobData : {};
            return {
                id: j.id,
                title: j.title || data.title,
                department: data.department,
                location: data.location,
                type: data.type,
                description: data.description,
                requirements: data.requirements,
                skillsRequired: data.skillsRequired,
                salaryRange: data.salaryRange,
                createdAt: j.createdAt
            };
        });
            
        return NextResponse.json({ success: true, jobs: formattedJobs });
    } catch (error) {
        console.error("PUBLIC GET JOBS ERROR:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
