import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;
    const candidateRecord = await prisma.staffingCandidate.findFirst({ where: {
      OR: [{ id: id }, { mongoId: id }],
      organizationId: authUser.organizationId
    } });

    if (!candidateRecord) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    const cd = typeof candidateRecord.modelData === 'object' && candidateRecord.modelData !== null ? candidateRecord.modelData : {};
    const candidate = {
      ...candidateRecord,
      ...cd,
      id: candidateRecord.id,
      _id: candidateRecord.id
    };

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error("GET CANDIDATE BY ID ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;
    const body = await request.json();

    const existingCandidate = await prisma.staffingCandidate.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }], organizationId: authUser.organizationId }
    });

    if (!existingCandidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    let currentModelData = existingCandidate.modelData ? (typeof existingCandidate.modelData === 'string' ? JSON.parse(existingCandidate.modelData) : existingCandidate.modelData) : {};
    let updatePayload = {};
    Object.keys(body).forEach(key => {
        if (['status', 'employeeId', 'organizationId'].includes(key)) {
            updatePayload[key] = body[key];
        } else if (key !== 'id' && key !== '_id') {
            currentModelData[key] = body[key];
        }
    });
    updatePayload.modelData = currentModelData;

    const candidateDoc = await prisma.staffingCandidate.update({
      where: { id: existingCandidate.id },
      data: updatePayload
    });

    const cd = typeof candidateDoc.modelData === 'object' && candidateDoc.modelData !== null ? candidateDoc.modelData : {};
    const candidate = {
      ...candidateDoc,
      ...cd,
      id: candidateDoc.id,
      _id: candidateDoc.id
    };

    return NextResponse.json({ success: true, candidate, message: "Candidate updated successfully" });
  } catch (error) {
    console.error("PUT CANDIDATE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;

    const existingCandidate = await prisma.staffingCandidate.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
        organizationId: authUser.organizationId
      }
    });

    if (!existingCandidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    const candidate = await prisma.staffingCandidate.delete({
      where: { id: existingCandidate.id }
    });

    const dataObj = typeof candidate.modelData === 'object' && candidate.modelData !== null ? candidate.modelData : {};

    // Clean up local resume file if exists
    if (dataObj.resumeUrl && dataObj.resumeUrl.startsWith('/uploads/resumes/')) {
      try {
        const filePath = path.join(process.cwd(), 'public', dataObj.resumeUrl);
        await fs.unlink(filePath);
        console.log("Deleted local resume file:", filePath);
      } catch (err) {
        console.error("Failed to delete local resume file:", err);
      }
    }

    // Cascade Delete Submissions: Clean up all pipeline submissions associated with this candidate
    const submissions = await prisma.staffingSubmission.findMany();
    const subIdsToDelete = submissions
      .filter(s => {
        const data = s.modelData && typeof s.modelData === 'object' ? s.modelData : {};
        return data.candidateId === existingCandidate.id || data.candidateId === existingCandidate.mongoId;
      })
      .map(s => s.id);
    if (subIdsToDelete.length > 0) {
      await prisma.staffingSubmission.deleteMany({ where: { id: { in: subIdsToDelete } } });
    }

    return NextResponse.json({ success: true, message: "Candidate and associated pipeline records deleted successfully" });
  } catch (error) {
    console.error("DELETE CANDIDATE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
