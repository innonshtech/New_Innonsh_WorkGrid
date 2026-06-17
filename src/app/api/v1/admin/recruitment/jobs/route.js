import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';
import { validateRequest } from "@/lib/middleware/validate";
import { CreateJobSchema } from "@/lib/validations";

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const department = searchParams.get('department');

        let query = {};

        // SaaS PROTECTION: Scope to org
        let orgId = authUser.role === 'admin' ? authUser.organizationId : searchParams.get('organizationId');
        if (orgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                query.organizationId = { in: [org.id, org.mongoId].filter(Boolean) };
            } else {
                query.organizationId = orgId;
            }
        }

        if (status) query.status = status;

        const jobsRecords = await prisma.jobRequisition.findMany({ where: query });
        let jobs = jobsRecords.map(j => {
            const jobDataObj = (j.jobData && typeof j.jobData === 'object') ? j.jobData : {};
            return {
                ...j,
                ...jobDataObj,
                id: j.id,
                _id: j.id
            };
        });

        if (department) {
            jobs = jobs.filter(j => j.department === department);
        }

        return NextResponse.json({ success: true, jobs });
    } catch (error) {
        console.error("GET JOBS ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export const POST = validateRequest(CreateJobSchema, async (request, context, validatedData) => {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

        // SaaS PROTECTION: Attach org to the job
        const orgId = authUser.role === 'admin' ? authUser.organizationId : undefined;

        const { title, ...rest } = validatedData;

        const job = await prisma.jobRequisition.create({ data: {
            title,
            status: 'Pending Approval',
            organizationId: orgId,
            jobData: {
                ...rest,
                approvalChain: [
                    { role: 'HR Admin', status: 'Pending' },
                    { role: 'Department Head', status: 'Pending' }
                ]
            }
        } });

        const jobDataObj = (job.jobData && typeof job.jobData === 'object') ? job.jobData : {};
        const formattedJob = {
            ...job,
            ...jobDataObj,
            id: job.id,
            _id: job.id
        };

        return NextResponse.json({ success: true, job: formattedJob, message: "Job requisition created successfully" }, { status: 201 });
    } catch (error) {
        console.error("POST JOB ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { jobId, status, approvalRole, approvalStatus, remarks } = body;
        const orgId = authUser.role === 'admin' ? authUser.organizationId : body.organizationId;

        const job = await prisma.jobRequisition.findFirst({ where: { OR: [{ id: jobId }, { mongoId: jobId }], organizationId: orgId } });
        if (!job) return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });

        let updateDataObj = {};
        let currentJobData = job.jobData ? (typeof job.jobData === 'string' ? JSON.parse(job.jobData) : job.jobData) : {};
        let newApprovalChain = [...(currentJobData.approvalChain || [])];
        let newStatus = job.status;

        if (approvalRole && approvalStatus) {
            const levelIndex = newApprovalChain.findIndex(c => c.role === approvalRole);
            if (levelIndex > -1) {
                newApprovalChain[levelIndex].status = approvalStatus;
                newApprovalChain[levelIndex].approvedBy = authUser.id;
                newApprovalChain[levelIndex].approvedAt = new Date();
                newApprovalChain[levelIndex].remarks = remarks || '';
                
                const allApproved = newApprovalChain.every(c => c.status === 'Approved');
                const anyRejected = newApprovalChain.some(c => c.status === 'Rejected');
                
                if (anyRejected) {
                    newStatus = 'Rejected';
                } else if (allApproved) {
                    newStatus = 'Open';
                }
            }
            currentJobData.approvalChain = newApprovalChain;
            updateDataObj.jobData = currentJobData;
            updateDataObj.status = newStatus;

            const updatedJob = await prisma.jobRequisition.update({
                where: { id: job.id },
                data: updateDataObj
            });

            const formatted = {
                ...updatedJob,
                ...currentJobData,
                id: updatedJob.id,
                _id: updatedJob.id
            };
            return NextResponse.json({ success: true, job: formatted });
        }

        // Edit mode: update editable fields
        const editableFields = ['title', 'department', 'location', 'type', 'priority', 'workplaceType', 'headcount', 'experienceLevel', 'hiringManagerName', 'description', 'requirements', 'salaryRange', 'targetDate'];
        const hasEdits = editableFields.some(f => body[f] !== undefined);

        if (hasEdits) {
            editableFields.forEach(field => {
                if (body[field] !== undefined) {
                    if (field === 'title') {
                        updateDataObj.title = body.title;
                    } else if (field === 'targetDate') {
                        currentJobData[field] = body[field] ? new Date(body[field]) : undefined;
                    } else {
                        currentJobData[field] = body[field];
                    }
                }
            });
            if (status) updateDataObj.status = status;
            updateDataObj.jobData = currentJobData;
            
            const updatedJob = await prisma.jobRequisition.update({
                where: { id: job.id },
                data: updateDataObj
            });

            const formatted = {
                ...updatedJob,
                ...currentJobData,
                id: updatedJob.id,
                _id: updatedJob.id
            };
            return NextResponse.json({ success: true, job: formatted });
        }

        if (status) {
            const updatedJob = await prisma.jobRequisition.update({
                where: { id: job.id },
                data: { status }
            });

            const formatted = {
                ...updatedJob,
                ...currentJobData,
                id: updatedJob.id,
                _id: updatedJob.id
            };
            return NextResponse.json({ success: true, job: formatted });
        }

        return NextResponse.json({ success: false, error: 'Invalid update payload' }, { status: 400 });

    } catch (error) {
        console.error("PUT JOB ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('id');

        if (!jobId) {
            return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
        }

        const orgId = authUser.organizationId;
        const job = await prisma.jobRequisition.findFirst({
            where: { OR: [{ id: jobId }, { mongoId: jobId }], organizationId: orgId }
        });

        if (!job) {
            return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
        }

        await prisma.jobRequisition.delete({ where: { id: job.id } });

        return NextResponse.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
        console.error("DELETE JOB ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

