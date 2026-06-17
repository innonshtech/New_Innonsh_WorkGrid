import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;
    const clientRecord = await prisma.staffingClient.findFirst({ where: {
      OR: [{ id: id }, { mongoId: id }],
      organizationId: authUser.organizationId
    } });

    if (!clientRecord) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const cd = typeof clientRecord.clientData === 'object' && clientRecord.clientData !== null ? clientRecord.clientData : {};
    const client = {
        _id: clientRecord.id,
        id: clientRecord.id,
        organizationId: clientRecord.organizationId,
        name: clientRecord.name,
        status: clientRecord.status,
        ...cd,
        createdAt: clientRecord.createdAt,
        updatedAt: clientRecord.updatedAt
    };

    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("GET CLIENT BY ID ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;
    const body = await request.json();

    const existingClient = await prisma.staffingClient.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }], organizationId: authUser.organizationId }
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    let currentClientData = existingClient.clientData ? (typeof existingClient.clientData === 'string' ? JSON.parse(existingClient.clientData) : existingClient.clientData) : {};
    let updatePayload = {};
    
    Object.keys(body).forEach(key => {
        if (['name', 'status', 'organizationId'].includes(key)) {
            updatePayload[key] = body[key];
        } else if (key !== 'id' && key !== '_id') {
            currentClientData[key] = body[key];
        }
    });
    updatePayload.clientData = currentClientData;

    const clientDoc = await prisma.staffingClient.update({
      where: { id: existingClient.id },
      data: updatePayload
    });

    const cd = typeof clientDoc.clientData === 'object' && clientDoc.clientData !== null ? clientDoc.clientData : {};
    const client = {
        _id: clientDoc.id,
        id: clientDoc.id,
        organizationId: clientDoc.organizationId,
        name: clientDoc.name,
        status: clientDoc.status,
        ...cd,
        createdAt: clientDoc.createdAt,
        updatedAt: clientDoc.updatedAt
    };

    return NextResponse.json({ success: true, client, message: "Client updated successfully" });
  } catch (error) {
    console.error("PUT CLIENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);
    

    const { id } = await params;

    const existingClient = await prisma.staffingClient.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
        organizationId: authUser.organizationId
      }
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    await prisma.staffingClient.delete({
      where: { id: existingClient.id }
    });

    return NextResponse.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("DELETE CLIENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
