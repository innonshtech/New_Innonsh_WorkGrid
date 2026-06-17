import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { processCandidateResumeInBackground } from '@/lib/recruitment/resume-processing';
import fs from 'fs/promises';
import path from 'path';

async function scheduleAfterResponse(fn) {
  try {
    const mod = await import('next/server');
    const afterFn = mod.after || mod.unstable_after;
    if (typeof afterFn === 'function') {
      afterFn(fn);
      return;
    }
  } catch {
    // ignore
  }

  setTimeout(() => {
    try {
      fn();
    } catch {
      // ignore
    }
  }, 0);
}

export async function POST(request) {
  try {
    

    const formData = await request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const jobId = formData.get('jobId');
    const resumeFile = formData.get('resume');

    if (!name || !email || !jobId) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and Job ID are required' },
        { status: 400 }
      );
    }

    const job = await prisma.jobRequisition.findFirst({ where: { OR: [{ id: jobId }, { mongoId: jobId }] } });
    if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

    const existingCandidates = await prisma.candidate.findMany({
      where: { email: String(email).toLowerCase() }
    });
    const existing = existingCandidates.find(c => {
      const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
      return c.jobRequisitionId === job.id || 
             c.jobRequisitionId === job.mongoId || 
             data.jobRequisition === job.id || 
             data.jobRequisition === job.mongoId;
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already exists for this position' },
        { status: 400 }
      );
    }

    let resumeUrl = null;

    // 1) Save the PDF file to public/uploads/resumes (fast)
    if (resumeFile && typeof resumeFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const fileName = `resume_${Date.now()}_${String(name).replace(/\s+/g, '_').toLowerCase()}.pdf`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
      const filePath = path.join(uploadDir, fileName);

      try {
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(filePath, buffer);
        resumeUrl = `/uploads/resumes/${fileName}`;
      } catch (fsErr) {
        console.error('Failed to save resume locally:', fsErr?.message || fsErr);
      }
    }

    // 2) Create candidate immediately (no AI work here)
    const nameParts = String(name).trim().split(/\s+/);
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    const candidate = await prisma.candidate.create({ data: {
      firstName,
      lastName,
      email,
      phone: phone || '',
      jobRequisitionId: job.id,
      status: 'Applied',
      candidateData: {
        name,
        source: 'Careers Portal',
        resumeUrl,
        resumeParseStatus: resumeUrl ? 'queued' : 'failed',
        resumeParseRequestedAt: resumeUrl ? new Date() : null,
        resumeParseError: resumeUrl ? null : 'Resume file missing or failed to save',
        organizationId: job.organizationId,
        jobRequisition: jobId
      }
    } });

    const candidateId = String(candidate._id);

    // 3) Background tasks (won't block the user)
    if (resumeUrl) {
      void scheduleAfterResponse(() => processCandidateResumeInBackground(candidateId));
    }

    void scheduleAfterResponse(async () => {
      try {
        const { sendEmail } = await import('@/lib/email/service');
        const { getApplicationReceivedTemplate } = await import('@/lib/email/templates/recruitment');

        await sendEmail({
          to: email,
          subject: `Application Received — ${job?.title || 'the open position'}`,
          html: getApplicationReceivedTemplate(name, job?.title || 'the open position')
        });
      } catch (emailErr) {
        console.warn('Email skipping (SMTP not configured):', emailErr?.message || emailErr);
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Application submitted successfully',
        candidateId,
        applicationId: candidateId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('APPLY API ERROR:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

