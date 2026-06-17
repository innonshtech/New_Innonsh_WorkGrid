import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';




import { getAuthUser, authorize } from '@/lib/auth-util';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/service';
import {
    getApplicationReceivedTemplate,
    getRejectionEmailTemplate,
    getOnboardingWelcomeTemplate
} from '@/lib/email/templates/recruitment';
import { getCandidateStatusChangeTemplate } from '@/lib/email/templates';
import { generateOnboardingTasks } from '@/lib/ai/gemini';
import { processCandidateResumeInBackground } from '@/lib/recruitment/resume-processing';

const candidateSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    resumeUrl: z.string().url().optional(),
    jobRequisition: z.string().optional(),
    appliedRole: z.string().optional(),
    source: z.enum(['LinkedIn', 'Indeed', 'Referral', 'Website', 'Careers Portal', 'Other']).default('Website'),
    notes: z.string().optional(),
    parsedResume: z.any().optional()
});

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        const status = searchParams.get('status');

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
        if (status) query.status = status;

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

        // Map to include Mongoose expected fields for frontend
        const candidates = candidatesRecords.map(c => {
            const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
            
            // Look up job requisition details
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

        return NextResponse.json({ success: true, candidates });
    } catch (error) {
        console.error("GET CANDIDATES ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const validatedData = candidateSchema.parse(body);

        // SaaS PROTECTION: Attach org to candidate record
        const orgId = authUser.role === 'admin' ? authUser.organizationId : body.organizationId;

        // Gap Fix #9: Duplicate detection
        const existingCandidates = await prisma.candidate.findMany({
            where: { email: validatedData.email.toLowerCase() }
        });
        const existingCandidate = existingCandidates.find(c => {
            const data = (c.candidateData && typeof c.candidateData === 'object') ? c.candidateData : {};
            return data.organizationId === orgId;
        });
        if (existingCandidate) {
            return NextResponse.json({ 
                success: false, 
                error: `Candidate with email ${validatedData.email} already exists in the pipeline (Status: ${existingCandidate.status})`,
                existingCandidate: { 
                    id: existingCandidate.id, 
                    _id: existingCandidate.id, 
                    status: existingCandidate.status, 
                    name: `${existingCandidate.firstName} ${existingCandidate.lastName}` 
                }
            }, { status: 409 });
        }

        const nameParts = validatedData.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        const { name, email, phone, jobRequisition, ...otherData } = validatedData;

        const candidate = await prisma.candidate.create({ 
            data: { 
                firstName,
                lastName,
                email,
                phone,
                jobRequisitionId: jobRequisition,
                candidateData: {
                    ...otherData,
                    organizationId: orgId
                }
            } 
        });

        // Gap Fix #7: Send application received email (non-blocking)
        try {
            const jobTitle = validatedData.appliedRole || 'the open position';
            await sendEmail({
                to: candidate.email,
                subject: `Application Received — ${jobTitle}`,
                html: getApplicationReceivedTemplate(candidate.name, jobTitle)
            });
        } catch (emailErr) {
            console.log("Email send skipped (no SMTP configured):", emailErr.message);
        }

        // Fix: Trigger AI parsing if a resume was uploaded
        if (validatedData.resumeUrl) {
            processCandidateResumeInBackground(candidate.id).catch(err => {
                console.error("Failed to trigger background parse:", err);
            });
        }

        const formattedCandidate = {
            ...candidate,
            ...(candidate.candidateData || {}),
            id: candidate.id,
            _id: candidate.id,
            name: `${candidate.firstName} ${candidate.lastName}`
        };

        return NextResponse.json({ success: true, candidate: formattedCandidate, message: "Candidate application received" }, { status: 201 });
    } catch (error) {
        console.error("POST CANDIDATE ERROR:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Validation failed', details: error.errors }, { status: 400 });
        }
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return NextResponse.json({ 
                success: false, 
                error: 'A candidate with this email already exists in your organization' 
            }, { status: 409 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });

        const candidate = await prisma.candidate.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        const prevStatus = candidate.status;
        const newStatus = updateData.status;

        // Extract native fields vs candidateData JSON fields
        let updatePayload = {};
        let candidateDataObj = candidate.candidateData ? (typeof candidate.candidateData === 'string' ? JSON.parse(candidate.candidateData) : candidate.candidateData) : {};
        
        Object.keys(updateData).forEach(key => {
            if (['firstName', 'lastName', 'email', 'phone', 'status', 'jobRequisitionId'].includes(key)) {
                updatePayload[key] = updateData[key];
            } else if (key === 'name') {
                const parts = updateData[key].split(' ');
                updatePayload.firstName = parts[0];
                updatePayload.lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
            } else {
                candidateDataObj[key] = updateData[key];
            }
        });
        
        updatePayload.candidateData = candidateDataObj;

        // Perform the update
        const updatedCandidate = await prisma.candidate.update({
            where: { id: candidate.id },
            data: updatePayload
        });

        const candidateName = `${updatedCandidate.firstName} ${updatedCandidate.lastName}`;
        const candidateAppliedRole = candidateDataObj.appliedRole || candidate.candidateData?.appliedRole;
        const candidateResumeUrl = candidateDataObj.resumeUrl || candidate.candidateData?.resumeUrl;

        // Send status-change email notification for ALL pipeline transitions
        if (newStatus && newStatus !== prevStatus) {
            try {
                const jobTitle = candidateAppliedRole || 'the position';
                const template = getCandidateStatusChangeTemplate({
                    candidateName: candidateName,
                    jobTitle,
                    newStatus
                });
                if (template) {
                    await sendEmail({ to: candidate.email, subject: template.subject, html: template.html });
                }
            } catch (emailErr) {
                console.log(`Status email (${newStatus}) skipped:`, emailErr.message);
            }
        }

        // 🚀 AUTO-ONBOARDING TRIGGER with AI-powered smart tasks (Gap #12)
        if (newStatus === 'Hired' && prevStatus !== 'Hired') {
            try {
                // 1. Check if employee already exists by email
                let employee = await prisma.employee.findFirst({ where: { email: candidate.email } });

                if (!employee) {
                    const department = "General";
                    const designation = candidateAppliedRole || "New Joiner";

                    // 2. Create basic Employee record
                    employee = await prisma.employee.create({ data: {
                        employeeId: `EMP-${Date.now().toString().slice(-6)}`,
                        password: 'welcome_to_team',
                        organizationId: candidate.organizationId,
                        firstName: updatedCandidate.firstName,
                        lastName: updatedCandidate.lastName,
                        email: updatedCandidate.email,
                        phone: updatedCandidate.phone || 'N/A',
                        dateOfJoining: new Date(),
                        department: department,
                        designation: designation,
                        workLocation: "Remote / Office",
                        payslipStructure: {
                            salaryType: 'monthly',
                            basicSalary: 30000,
                            earnings: [],
                            deductions: []
                        },
                        workingHr: 9,
                        status: 'Active'
                    } });
                }

                // 3. Check if Checklist already exists
                const existingChecklist = await prisma.onboardingChecklist.findFirst({ where: { employeeId: employee.id } });

                if (!existingChecklist) {
                    // Gap Fix #12: AI-generated smart onboarding tasks
                    let onboardingTasks;
                    try {
                        const aiResult = await generateOnboardingTasks({
                            department: candidate.jobRequisition?.department || 'General',
                            role: candidate.appliedRole || candidate.jobRequisition?.title || 'New Joiner',
                            location: candidate.jobRequisition?.location || 'Office'
                        });
                        onboardingTasks = (aiResult.tasks || []).map(t => ({
                            category: t.category || 'Documentation',
                            task: t.task,
                            status: 'Pending'
                        }));
                    } catch (aiErr) {
                        console.log("AI onboarding failed, using defaults:", aiErr.message);
                        onboardingTasks = [
                            { category: 'Documentation', task: 'Submit Personal Documents (ID/Address Proof)', status: 'Pending' },
                            { category: 'Documentation', task: 'Sign Employment Agreement & Policies', status: 'Pending' },
                            { category: 'IT Setup', task: 'Set up System & Corporate Email', status: 'Pending' },
                            { category: 'IT Setup', task: 'Configure Access to Project Tools (GitHub/Jira)', status: 'Pending' },
                            { category: 'Orientation', task: 'Company Culture & Values Introduction', status: 'Pending' },
                            { category: 'Orientation', task: 'Team Introduction & Department Briefing', status: 'Pending' },
                            { category: 'Finance', task: 'Submit Bank Details & Tax Declaration', status: 'Pending' }
                        ];
                    }

                    await prisma.onboardingChecklist.create({
                        data: {
                            employeeId: employee.id,
                            organizationId: candidate.organizationId,
                            status: 'Not Started',
                            modelData: {
                                tasks: onboardingTasks
                            }
                        }
                    });
                }

                // Gap Fix #7: Send welcome email
                try {
                    const joiningDate = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric' });
                    await sendEmail({
                        to: candidate.email,
                        subject: `🚀 Welcome Aboard — ${candidateAppliedRole || 'New Role'}`,
                        html: getOnboardingWelcomeTemplate(candidateName, joiningDate, candidateAppliedRole)
                    });
                } catch (emailErr) {
                    console.log("Welcome email skipped:", emailErr.message);
                }
            } catch (triggerError) {
                console.error("Auto-onboarding trigger failed:", triggerError);
            }
        }

        const formattedCandidate = {
            ...updatedCandidate,
            ...(updatedCandidate.candidateData || {}),
            id: updatedCandidate.id,
            _id: updatedCandidate.id,
            name: `${updatedCandidate.firstName} ${updatedCandidate.lastName}`
        };

        return NextResponse.json({
            success: true,
            candidate: formattedCandidate,
            message: newStatus === 'Hired' ? "Candidate Hired & AI Onboarding Initiated!" : "Candidate updated successfully"
        });
    } catch (error) {
        console.error("PUT CANDIDATE ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
