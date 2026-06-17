import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';



// GET payslip by ID
export async function GET(request, { params }) {
  try {
      const { id } = await params;
      console.log("id", id);
    
    const payslip = await prisma.payslip.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    const employeeId = payslip.employeeId;
    let emp = null;
    if (employeeId) {
        emp = await prisma.employee.findFirst({
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
        employee: emp ? {
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
            designation: emp.designation,
            employeeType: emp.employeeType,
            category: emp.category,
            organizationId: emp.organizationId
          },
          salaryDetails: {
            bankAccount: {
              bankName: emp.bankName,
              accountNumber: emp.bankAccountNumber
            }
          },
          employeeType: emp.employeeType,
          category: emp.category
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
    const payslip = await prisma.payslip.update({ where: { id: (await prisma.payslip.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }, data: body })
      
      
      ;
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }
    
    return NextResponse.json(payslip);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE payslip
export async function DELETE(request, { params }) {
  try {
    
    const { id } = await params;
    
    const payslip = await prisma.payslip.delete({ where: { id: (await prisma.payslip.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });
    
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Payslip deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}