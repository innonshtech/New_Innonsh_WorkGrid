import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const { searchParams } = new URL(request.url);
    const requirementId = searchParams.get('requirementId');
    const stage = searchParams.get('stage');

    const query = { organizationId: authUser.organizationId };

    const submissionsRecords = await prisma.staffingSubmission.findMany({ where: query });

    // Fetch all staffing candidates for organization
    const candidates = await prisma.staffingCandidate.findMany({ where: { organizationId: authUser.organizationId } });
    const candidatesMap = {};
    candidates.forEach(c => {
      const cd = typeof c.modelData === 'object' && c.modelData !== null ? c.modelData : {};
      const cName = cd.name || "Candidate";
      const popCand = { id: c.id, _id: c.id, name: cName, email: cd.email, resumeUrl: cd.resumeUrl };
      candidatesMap[c.id] = popCand;
      if (c.mongoId) {
        candidatesMap[c.mongoId] = popCand;
      }
    });

    // Fetch all staffing requirements (scoped by organization clients)
    const clients = await prisma.staffingClient.findMany({ where: { organizationId: authUser.organizationId } });
    const clientIds = clients.map(cl => cl.id).concat(clients.map(cl => cl.mongoId).filter(Boolean));
    const requirements = await prisma.staffingRequirement.findMany({ where: { clientId: { in: clientIds } } });
    const requirementsMap = {};
    requirements.forEach(r => {
      const client = clients.find(cl => cl.id === r.clientId || cl.mongoId === r.clientId);
      const clientData = client && typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
      const popClient = client ? {
        _id: client.id,
        id: client.id,
        organizationId: client.organizationId,
        name: client.name,
        status: client.status,
        ...clientData,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      } : null;

      const popReq = { id: r.id, _id: r.id, title: r.title, clientId: popClient };
      requirementsMap[r.id] = popReq;
      if (r.mongoId) {
        requirementsMap[r.mongoId] = popReq;
      }
    });

    let submissions = submissionsRecords.map(s => {
      const dataObj = typeof s.modelData === 'object' && s.modelData !== null ? s.modelData : {};
      const candidate = dataObj.candidateId ? candidatesMap[dataObj.candidateId] : null;
      const requirement = dataObj.requirementId ? requirementsMap[dataObj.requirementId] : null;
      return {
        ...s,
        ...dataObj,
        id: s.id,
        _id: s.id,
        candidate,
        requirement,
        candidateId: candidate,
        requirementId: requirement
      };
    });

    if (requirementId) {
      submissions = submissions.filter(s => s.requirementId === requirementId || (s.requirement && s.requirement.id === requirementId));
    }
    if (stage) {
      submissions = submissions.filter(s => s.stage === stage);
    }

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error("GET SUBMISSIONS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const body = await request.json();
    const {
      candidateId,
      requirementId,
      stage,
      fitScore,
      fitAnalysis,
      fitStrengths,
      fitGaps,
      fitRecommendation,
      notes
    } = body;

    if (!candidateId || !requirementId) {
      return NextResponse.json({ success: false, error: "Candidate ID and Requirement ID are required" }, { status: 400 });
    }

    // Check duplicate submission
    const existingSubmissions = await prisma.staffingSubmission.findMany({
      where: { organizationId: authUser.organizationId }
    });
    const existing = existingSubmissions.find(s => {
      const dataObj = typeof s.modelData === 'object' && s.modelData !== null ? s.modelData : {};
      return dataObj.candidateId === candidateId && dataObj.requirementId === requirementId;
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        error: "This candidate has already been submitted for this client requirement."
      }, { status: 409 });
    }

    // Update candidate status to "interviewing" on submission
    const candidateRecord = await prisma.staffingCandidate.findFirst({
      where: { OR: [{ id: candidateId }, { mongoId: candidateId }] }
    });
    if (candidateRecord) {
      await prisma.staffingCandidate.update({
        where: { id: candidateRecord.id },
        data: { status: "interviewing" }
      });
    }

    const submissionDoc = await prisma.staffingSubmission.create({ data: {
      status: 'Active',
      organizationId: authUser.organizationId,
      modelData: {
        candidateId,
        requirementId,
        stage: stage || "submitted",
        fitScore: fitScore || 0,
        fitAnalysis: fitAnalysis || "",
        fitStrengths: fitStrengths || [],
        fitGaps: fitGaps || [],
        fitRecommendation: fitRecommendation || "Pending Review",
        notes: notes || "",
        statusHistory: [{
          stage: stage || "submitted",
          changedBy: authUser.id,
          notes: notes || "Initial candidate submission to client"
        }]
      }
    } });

    // Load candidate and client/requirement for populated response
    const dbCandidate = await prisma.staffingCandidate.findFirst({
      where: { OR: [{ id: candidateId }, { mongoId: candidateId }] }
    });
    const dbRequirement = await prisma.staffingRequirement.findFirst({
      where: { OR: [{ id: requirementId }, { mongoId: requirementId }] }
    });
    
    let popCandidate = null;
    if (dbCandidate) {
      const cd = typeof dbCandidate.modelData === 'object' && dbCandidate.modelData !== null ? dbCandidate.modelData : {};
      popCandidate = { id: dbCandidate.id, _id: dbCandidate.id, name: cd.name || "Candidate", email: cd.email, resumeUrl: cd.resumeUrl };
    }
    
    let popReq = null;
    if (dbRequirement) {
      const client = await prisma.staffingClient.findFirst({
        where: { OR: [{ id: dbRequirement.clientId }, { mongoId: dbRequirement.clientId }] }
      });
      const clientData = client && typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
      const popClient = client ? {
        _id: client.id,
        id: client.id,
        organizationId: client.organizationId,
        name: client.name,
        status: client.status,
        ...clientData
      } : null;
      
      popReq = {
        id: dbRequirement.id,
        _id: dbRequirement.id,
        title: dbRequirement.title,
        clientId: popClient
      };
    }

    const modelDataObj = typeof submissionDoc.modelData === 'object' && submissionDoc.modelData !== null ? submissionDoc.modelData : {};
    const submission = {
      ...submissionDoc,
      ...modelDataObj,
      id: submissionDoc.id,
      _id: submissionDoc.id,
      candidate: popCandidate,
      requirement: popReq,
      candidateId: popCandidate,
      requirementId: popReq
    };

    return NextResponse.json({ success: true, submission, message: "Candidate submitted to requirement successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST SUBMISSION ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const body = await request.json();
    const { id, stage, notes } = body;

    if (!id || !stage) {
      return NextResponse.json({ success: false, error: "Submission ID and new stage are required" }, { status: 400 });
    }

    const submission = await prisma.staffingSubmission.findFirst({ where: {
      OR: [{ id: id }, { mongoId: id }],
      organizationId: authUser.organizationId
    } });

    if (!submission) {
      return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    const dataObj = typeof submission.modelData === 'object' && submission.modelData !== null ? submission.modelData : {};
    const prevStage = dataObj.stage || "submitted";
    
    // Determine updated notes
    let updatedNotes = notes || dataObj.notes || "";

    let currentModelData = submission.modelData ? (typeof submission.modelData === 'string' ? JSON.parse(submission.modelData) : submission.modelData) : {};
    currentModelData.stage = stage;
    currentModelData.notes = updatedNotes;
    
    if (!Array.isArray(currentModelData.statusHistory)) {
      currentModelData.statusHistory = [];
    }
    currentModelData.statusHistory.push({
      stage,
      changedBy: authUser.id,
      notes: notes || `Pipeline transitioned from ${prevStage} to ${stage}`
    });

    const updatedSubmission = await prisma.staffingSubmission.update({
      where: { id: submission.id },
      data: {
        modelData: currentModelData
      }
    });

    // Side-effects: sync candidate availability
    const cId = currentModelData.candidateId;
    if (cId) {
      const candidateRecord = await prisma.staffingCandidate.findFirst({
        where: { OR: [{ id: cId }, { mongoId: cId }] }
      });
      if (candidateRecord) {
        let newStatus = "available";
        if (stage === "deployed") {
          newStatus = "deployed";
        } else if (stage !== "rejected" && stage !== "withdrawn") {
          newStatus = "interviewing";
        }
        await prisma.staffingCandidate.update({
          where: { id: candidateRecord.id },
          data: { status: newStatus }
        });
      }
    }

    // Load candidate and requirement for populated response
    const dbCandidate = await prisma.staffingCandidate.findFirst({
      where: { OR: [{ id: cId }, { mongoId: cId }] }
    });
    const dbRequirement = await prisma.staffingRequirement.findFirst({
      where: { OR: [{ id: currentModelData.requirementId }, { mongoId: currentModelData.requirementId }] }
    });
    
    let popCandidate = null;
    if (dbCandidate) {
      const cd = typeof dbCandidate.modelData === 'object' && dbCandidate.modelData !== null ? dbCandidate.modelData : {};
      popCandidate = { id: dbCandidate.id, _id: dbCandidate.id, name: cd.name || "Candidate", email: cd.email, resumeUrl: cd.resumeUrl };
    }
    
    let popReq = null;
    if (dbRequirement) {
      const client = await prisma.staffingClient.findFirst({
        where: { OR: [{ id: dbRequirement.clientId }, { mongoId: dbRequirement.clientId }] }
      });
      const clientData = client && typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
      const popClient = client ? {
        _id: client.id,
        id: client.id,
        organizationId: client.organizationId,
        name: client.name,
        status: client.status,
        ...clientData
      } : null;
      
      popReq = {
        id: dbRequirement.id,
        _id: dbRequirement.id,
        title: dbRequirement.title,
        clientId: popClient
      };
    }

    const formatted = {
      ...updatedSubmission,
      ...currentModelData,
      id: updatedSubmission.id,
      _id: updatedSubmission.id,
      candidate: popCandidate,
      requirement: popReq,
      candidateId: popCandidate,
      requirementId: popReq
    };

    return NextResponse.json({ success: true, submission: formatted, message: `Hiring stage updated to ${stage}` });
  } catch (error) {
    console.error("PUT SUBMISSION ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
