import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    // Scope requirements by organization using the organization's clients
    const clients = await prisma.staffingClient.findMany({
      where: { organizationId: authUser.organizationId }
    });
    
    const clientsMap = {};
    clients.forEach(c => {
      const cd = typeof c.clientData === 'object' && c.clientData !== null ? c.clientData : {};
      const popClient = {
        _id: c.id,
        id: c.id,
        organizationId: c.organizationId,
        name: c.name,
        status: c.status,
        ...cd,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
      clientsMap[c.id] = popClient;
      if (c.mongoId) {
        clientsMap[c.mongoId] = popClient;
      }
    });

    const clientIds = clients.map(c => c.id).concat(clients.map(c => c.mongoId).filter(Boolean));

    const where = { clientId: { in: clientIds } };
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const requirementsRecords = await prisma.staffingRequirement.findMany({ where });

    const requirements = requirementsRecords.map(r => {
      const rd = typeof r.requirementData === 'object' && r.requirementData !== null ? r.requirementData : {};
      const client = r.clientId ? clientsMap[r.clientId] : null;
      return {
        _id: r.id,
        id: r.id,
        clientId: client,
        title: r.title,
        status: r.status,
        ...rd,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });

    return NextResponse.json({ success: true, requirements });
  } catch (error) {
    console.error("GET REQUIREMENTS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const body = await request.json();
    const {
      clientId,
      title,
      skillsRequired,
      minExperience,
      maxExperience,
      budgetRange,
      durationMonths,
      openingsCount,
      description
    } = body;

    if (!clientId || !title) {
      return NextResponse.json({ success: false, error: "Client ID and job title are required" }, { status: 400 });
    }

    // Verify client belongs to organization
    const client = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: clientId }, { mongoId: clientId }],
      organizationId: authUser.organizationId
    } });
    if (!client) {
      return NextResponse.json({ success: false, error: "Invalid client selected" }, { status: 400 });
    }

    const requirementDoc = await prisma.staffingRequirement.create({ data: {
      clientId,
      title,
      status: 'Open',
      requirementData: {
        skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : [],
        minExperience: Number(minExperience) || 0,
        maxExperience: Number(maxExperience) || 0,
        budgetRange: budgetRange || "",
        durationMonths: Number(durationMonths) || 0,
        openingsCount: Number(openingsCount) || 1,
        description: description || "",
        organizationId: authUser.organizationId
      }
    } });

    const rd = typeof requirementDoc.requirementData === 'object' && requirementDoc.requirementData !== null ? requirementDoc.requirementData : {};
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
      _id: requirementDoc.id,
      id: requirementDoc.id,
      clientId: popClient,
      title: requirementDoc.title,
      status: requirementDoc.status,
      ...rd,
      createdAt: requirementDoc.createdAt,
      updatedAt: requirementDoc.updatedAt
    };

    return NextResponse.json({ success: true, requirement, message: "Requirement created successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST REQUIREMENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
