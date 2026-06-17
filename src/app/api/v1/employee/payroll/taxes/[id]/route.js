import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET tax calculation by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // We fetch via Prisma (checking id or mongoId)
    const taxCalculation = await prisma.taxCalculation.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    let emp = null;
    if (taxCalculation.employeeId || taxCalculation.taxData?.employee) {
        const queryId = taxCalculation.taxData?.employee || taxCalculation.employeeId;
        const e = await prisma.employee.findFirst({
            where: { OR: [{ id: queryId }, { mongoId: queryId }] }
        });
        if (e) {
            emp = {
                _id: e.id,
                employeeId: e.modelData?.employeeId,
                personalDetails: e.modelData?.personalDetails
            };
        }
    }

    let calcBy = null;
    if (taxCalculation.taxData?.calculatedBy) {
        const u = await prisma.user.findFirst({
            where: { OR: [{ id: taxCalculation.taxData.calculatedBy }, { mongoId: taxCalculation.taxData.calculatedBy }] },
            select: { name: true, email: true, phone: true }
        });
        calcBy = u;
    }

    let revBy = null;
    if (taxCalculation.taxData?.reviewedBy) {
        const u = await prisma.user.findFirst({
            where: { OR: [{ id: taxCalculation.taxData.reviewedBy }, { mongoId: taxCalculation.taxData.reviewedBy }] },
            select: { name: true, email: true, phone: true }
        });
        revBy = u;
    }

    let appBy = null;
    if (taxCalculation.taxData?.approvedBy) {
        const u = await prisma.user.findFirst({
            where: { OR: [{ id: taxCalculation.taxData.approvedBy }, { mongoId: taxCalculation.taxData.approvedBy }] },
            select: { name: true, email: true, phone: true }
        });
        appBy = u;
    }

    return NextResponse.json({
        _id: taxCalculation.id,
        ...taxCalculation.taxData,
        employee: emp,
        calculatedBy: calcBy,
        reviewedBy: revBy,
        approvedBy: appBy
    });
  } catch (error) {
    console.error('Error fetching tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE tax calculation by ID
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    let taxCalculation = await prisma.taxCalculation.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    // Validate fields against schema
    const allowedFields = [
      'financialYear',
      'totalEarnings',
      'totalDeductions',
      'taxableIncome',
      'taxDetails',
      'totalTax',
      'status',
      'reviewedBy',
      'approvedBy',
      'notes'
    ];
    
    const updates = Object.keys(body).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = body[key];
      }
      return acc;
    }, {});
    
    taxCalculation = await prisma.taxCalculation.update({
        where: { id: taxCalculation.id },
        data: {
            taxData: {
                ...taxCalculation.taxData,
                ...updates
            }
        }
    });
    
    return NextResponse.json({
        _id: taxCalculation.id,
        ...taxCalculation.taxData
    });
  } catch (error) {
    console.error('Error updating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE tax calculation by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const taxCalculation = await prisma.taxCalculation.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });
    
    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    await prisma.taxCalculation.delete({
        where: { id: taxCalculation.id }
    });
    
    return NextResponse.json({ message: 'Tax calculation deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}