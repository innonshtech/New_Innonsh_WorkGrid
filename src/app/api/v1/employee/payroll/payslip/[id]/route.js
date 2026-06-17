import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET payslip by ID
export async function GET(request, { params }) {
  try {
      const { id } = await params;
      console.log("id", id);
    
    const payslip = await prisma.payslip.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    const employeeId = payslip.employeeId;
    let employee = null;
    if (employeeId) {
        employee = await prisma.employee.findFirst({
            where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
        });
    }

    let generatedBy = null;
    if (payslip.generatedById) {
        generatedBy = await prisma.user.findFirst({
            where: { OR: [{ id: payslip.generatedById }, { mongoId: payslip.generatedById }] },
            select: { id: true, name: true, email: true }
        });
    }

    let approvedBy = null;
    if (payslip.approvedById) {
        approvedBy = await prisma.user.findFirst({
            where: { OR: [{ id: payslip.approvedById }, { mongoId: payslip.approvedById }] },
            select: { id: true, name: true, email: true }
        });
    }

    const formatted = {
        ...payslip,
        _id: payslip.id,
        employee: employee ? {
          _id: employee.id,
          id: employee.id,
          employeeId: employee.employeeId,
          personalDetails: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone
          },
          jobDetails: {
            department: employee.department,
            designation: employee.designation,
            employeeType: employee.employeeType,
            category: employee.category,
            organizationId: employee.organizationId
          },
          salaryDetails: {
            bankAccount: {
              bankName: employee.bankName,
              accountNumber: employee.bankAccountNumber
            }
          },
          employeeType: employee.employeeType,
          category: employee.category
        } : null,
        generatedBy: generatedBy ? { _id: generatedBy.id, name: generatedBy.name, email: generatedBy.email } : payslip.generatedById,
        approvedBy: approvedBy ? { _id: approvedBy.id, name: approvedBy.name, email: approvedBy.email } : payslip.approvedById
    };

    console.log("payslip fetched");
    
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE payslip
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    let payslip = await prisma.payslip.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paymentDate !== undefined) updateData.paymentDate = body.paymentDate ? new Date(body.paymentDate) : null;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.approvedBy !== undefined) updateData.approvedById = body.approvedBy;

    payslip = await prisma.payslip.update({
        where: { id: payslip.id },
        data: updateData
    });

    const formatted = {
        ...payslip,
        _id: payslip.id,
        employee: payslip.employeeId
    };
    
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE payslip
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const payslip = await prisma.payslip.findFirst({
        where: { OR: [{ id }, { mongoId: id }] }
    });

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    await prisma.payslip.delete({ where: { id: payslip.id } });
    
    return NextResponse.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}