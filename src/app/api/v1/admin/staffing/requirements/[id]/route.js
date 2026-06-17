import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const { id } = await params;
    const requirementRecord = await prisma.staffingRequirement.findFirst({ where: {
      OR: [{ id: id }, { mongoId: id }]
    } });

    if (!requirementRecord) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    // Verify client belongs to organization to secure the data
    const client = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: requirementRecord.clientId }, { mongoId: requirementRecord.clientId }],
      organizationId: authUser.organizationId
    } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    const rd = typeof requirementRecord.requirementData === 'object' && requirementRecord.requirementData !== null ? requirementRecord.requirementData : {};
    const clientData = typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
    const popClient = {
      _id: client.id,
      id: client.id,
      organizationId: client.organizationId,
      name: client.name,
      status: client.status,
      ...clientData,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };
    const requirement = {
      _id: requirementRecord.id,
      id: requirementRecord.id,
      clientId: popClient,
      title: requirementRecord.title,
      status: requirementRecord.status,
      ...rd,
      createdAt: requirementRecord.createdAt,
      updatedAt: requirementRecord.updatedAt
    };

    return NextResponse.json({ success: true, requirement });
  } catch (error) {
    console.error("GET REQUIREMENT BY ID ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const { id } = await params;
    const body = await request.json();

    if (body.skillsRequired && typeof body.skillsRequired === 'string') {
      body.skillsRequired = body.skillsRequired.split(',').map(s => s.trim());
    }

    const existingReq = await prisma.staffingRequirement.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingReq) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    // Verify client belongs to organization to secure the data
    const client = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: existingReq.clientId }, { mongoId: existingReq.clientId }],
      organizationId: authUser.organizationId
    } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    let currentRequirementData = existingReq.requirementData ? (typeof existingReq.requirementData === 'string' ? JSON.parse(existingReq.requirementData) : existingReq.requirementData) : {};
    let updatePayload = {};
    Object.keys(body).forEach(key => {
        if (['clientId', 'title', 'status'].includes(key)) {
            updatePayload[key] = body[key];
        } else if (key !== 'id' && key !== '_id') {
            currentRequirementData[key] = body[key];
        }
    });
    updatePayload.requirementData = currentRequirementData;

    const requirementDoc = await prisma.staffingRequirement.update({
      where: { id: existingReq.id },
      data: updatePayload
    });

    const rd = typeof requirementDoc.requirementData === 'object' && requirementDoc.requirementData !== null ? requirementDoc.requirementData : {};
    const popClientData = typeof client.clientData === 'object' && client.clientData !== null ? client.clientData : {};
    const popClient = {
      _id: client.id,
      id: client.id,
      organizationId: client.organizationId,
      name: client.name,
      status: client.status,
      ...popClientData,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    };

    const requirement = {
      _id: requirementDoc.id,
      id: requirementDoc.id,
      clientId: popClient,
      title: requirementDoc.title,
      status: requirementDoc.status,
      ...rd,
      createdAt: requirementDoc.createdAt,
      updatedAt: requirementDoc.updatedAt
    };

    return NextResponse.json({ success: true, requirement, message: "Requirement updated successfully" });
  } catch (error) {
    console.error("PUT REQUIREMENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const { id } = await params;

    const existingReq = await prisma.staffingRequirement.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingReq) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    // Verify client belongs to organization to secure the data
    const client = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: existingReq.clientId }, { mongoId: existingReq.clientId }],
      organizationId: authUser.organizationId
    } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Requirement not found" }, { status: 404 });
    }

    await prisma.staffingRequirement.delete({
      where: { id: existingReq.id }
    });

    // Cascade Delete Submissions: Clean up all pipeline submissions associated with this requirement
    const submissions = await prisma.staffingSubmission.findMany();
    const subIdsToDelete = submissions
      .filter(s => {
        const data = s.modelData && typeof s.modelData === 'object' ? s.modelData : {};
        return data.requirementId === existingReq.id || data.requirementId === existingReq.mongoId;
      })
      .map(s => s.id);
    if (subIdsToDelete.length > 0) {
      await prisma.staffingSubmission.deleteMany({ where: { id: { in: subIdsToDelete } } });
    }

    return NextResponse.json({ success: true, message: "Requirement and associated pipeline records deleted successfully" });
  } catch (error) {
    console.error("DELETE REQUIREMENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
