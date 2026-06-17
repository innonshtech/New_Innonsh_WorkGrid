import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


// GET a compliance report by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const complianceReport = await prisma.complianceReport.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    
    if (!complianceReport) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: complianceReport.id,
      mongoId: complianceReport.mongoId,
      status: complianceReport.status,
      createdAt: complianceReport.createdAt,
      updatedAt: complianceReport.updatedAt,
      ...(complianceReport.modelData || {})
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE a compliance report by ID
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate fields against schema
    const allowedFields = [
      'reportType',
      'period',
      'complianceItems',
      'overallStatus',
      'reviewedBy',
      'approvedBy',
      'notes',
      'attachments'
    ];
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});

    const reportToUpdate = await prisma.complianceReport.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!reportToUpdate) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }

    const updated = await prisma.complianceReport.update({
      where: { id: reportToUpdate.id },
      data: {
        modelData: {
          ...(reportToUpdate.modelData || {}),
          ...updates
        }
      }
    });
    
    return NextResponse.json({
      id: updated.id,
      mongoId: updated.mongoId,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      ...(updated.modelData || {})
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a compliance report by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const reportToDelete = await prisma.complianceReport.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!reportToDelete) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }

    await prisma.complianceReport.delete({ where: { id: reportToDelete.id } });
    
    return NextResponse.json({ message: 'Compliance report deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}