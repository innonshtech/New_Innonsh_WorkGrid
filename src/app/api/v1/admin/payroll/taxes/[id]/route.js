import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

// GET tax calculation by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const taxCalculation = await prisma.taxCalculation.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!taxCalculation) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    // Fetch employee details
    let employee = null;
    if (taxCalculation.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: taxCalculation.employeeId },
        select: {
          id: true,
          mongoId: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          department: true,
          designation: true
        }
      });
      if (emp) {
        employee = {
          _id: emp.id,
          id: emp.id,
          employeeId: emp.employeeId,
          personalDetails: {
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone
          },
          jobDetails: {
            department: emp.department,
            designation: emp.designation
          }
        };
      }
    }

    const data = taxCalculation.taxData && typeof taxCalculation.taxData === 'object' ? taxCalculation.taxData : {};
    const responseObj = {
      id: taxCalculation.id,
      _id: taxCalculation.id,
      mongoId: taxCalculation.mongoId,
      employeeId: taxCalculation.employeeId,
      createdAt: taxCalculation.createdAt,
      updatedAt: taxCalculation.updatedAt,
      ...data,
      employee
    };

    return NextResponse.json(responseObj);
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

    const existing = await prisma.taxCalculation.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }

    // Merge updates into taxData
    const existingData = existing.taxData && typeof existing.taxData === 'object' ? existing.taxData : {};
    
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

    const updatedData = { ...existingData };
    allowedFields.forEach(key => {
      if (body[key] !== undefined) {
        updatedData[key] = body[key];
      }
    });

    const taxCalculation = await prisma.taxCalculation.update({
      where: { id: existing.id },
      data: {
        taxData: updatedData
      }
    });

    // Fetch employee details for returned object
    let employee = null;
    if (taxCalculation.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: taxCalculation.employeeId },
        select: {
          id: true,
          mongoId: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          department: true,
          designation: true
        }
      });
      if (emp) {
        employee = {
          _id: emp.id,
          id: emp.id,
          employeeId: emp.employeeId,
          personalDetails: {
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone
          },
          jobDetails: {
            department: emp.department,
            designation: emp.designation
          }
        };
      }
    }
    
    const responseObj = {
      id: taxCalculation.id,
      _id: taxCalculation.id,
      mongoId: taxCalculation.mongoId,
      employeeId: taxCalculation.employeeId,
      createdAt: taxCalculation.createdAt,
      updatedAt: taxCalculation.updatedAt,
      ...updatedData,
      employee
    };

    return NextResponse.json(responseObj);
  } catch (error) {
    console.error('Error updating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE tax calculation by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const existing = await prisma.taxCalculation.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });
    
    if (!existing) {
      return NextResponse.json({ error: 'Tax calculation not found' }, { status: 404 });
    }
    
    await prisma.taxCalculation.delete({ where: { id: existing.id } });
    
    return NextResponse.json({ message: 'Tax calculation deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}