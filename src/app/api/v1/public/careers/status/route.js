import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';



export async function GET(request) {
    try {
        
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const id = searchParams.get('id');
        
        if (!email || !id) return NextResponse.json({ success: false, error: 'Email and Application ID required' }, { status: 400 });
        
        const candidate = await prisma.candidate.findFirst({ 
            where: { 
                email, 
                OR: [{ id: id }, { mongoId: id }] 
            } 
        });
            
        if (!candidate) return NextResponse.json({ success: false, error: 'Application not found with provided credentials' }, { status: 404 });
        
        const data = candidate.candidateData && typeof candidate.candidateData === 'object' ? candidate.candidateData : {};
        const formatted = {
            id: candidate.id,
            status: candidate.status,
            name: ((!candidate.firstName || candidate.firstName === 'Unknown') && (!candidate.lastName || candidate.lastName === 'Unknown') && data.name) ? data.name : `${candidate.firstName} ${candidate.lastName}`.trim(),
            email: candidate.email,
            jobRequisitionId: candidate.jobRequisitionId,
            createdAt: candidate.createdAt,
            interviews: data.interviews || [],
            fitScore: data.fitScore || 0,
            parsedResume: data.parsedResume || null
        };

        return NextResponse.json({ success: true, application: formatted });
    } catch (error) {
        console.error("STATUS CHECK ERROR:", error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
