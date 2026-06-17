import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET a compliance report by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    const complianceReport = await prisma.complianceReport.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!complianceReport) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    return NextResponse.json(complianceReport);
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

    const existing = await prisma.complianceReport.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }

    const complianceReport = await prisma.complianceReport.update({
      where: { id: existing.id },
      data: updates
    });
    
    return NextResponse.json(complianceReport);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE a compliance report by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await prisma.complianceReport.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Compliance report not found' }, { status: 404 });
    }
    
    await prisma.complianceReport.delete({ where: { id: existing.id } });
    
    return NextResponse.json({ message: 'Compliance report deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}