import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const where = { organizationId: authUser.organizationId };
    
    const clientsDocs = await prisma.staffingClient.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    const clients = clientsDocs.map(c => {
        const cd = typeof c.clientData === 'object' && c.clientData !== null ? c.clientData : {};
        return {
            _id: c.id,
            id: c.id,
            organizationId: c.organizationId,
            name: c.name,
            status: c.status,
            ...cd,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        };
    });

    // Sort by name if name exists
    clients.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error("GET CLIENTS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "recruiter"]);

    const body = await request.json();
    const { name, contactPerson, email, phone, website, notes } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Client name is required" }, { status: 400 });
    }

    // Check duplicate
    const existing = await prisma.staffingClient.findMany({
        where: { organizationId: authUser.organizationId }
    });
    const isDuplicate = existing.some(e => e.name === name);

    if (isDuplicate) {
        return NextResponse.json({ success: false, error: "A client with this name already exists" }, { status: 409 });
    }

    const clientDoc = await prisma.staffingClient.create({
      data: {
          name,
          organizationId: authUser.organizationId,
          status: 'Active',
          clientData: {
              contactPerson,
              email,
              phone,
              website,
              notes
          }
      }
    });
    
    const client = {
        _id: clientDoc.id,
        id: clientDoc.id,
        name: clientDoc.name,
        status: clientDoc.status,
        organizationId: clientDoc.organizationId,
        ...(typeof clientDoc.clientData === 'object' && clientDoc.clientData !== null ? clientDoc.clientData : {})
    };

    return NextResponse.json({ success: true, client, message: "Client created successfully" }, { status: 201 });
  } catch (error) {
    console.error("POST CLIENT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
