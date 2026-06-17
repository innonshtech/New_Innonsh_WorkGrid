//src/app/api/payroll/taxes/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET all tax calculations
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const financialYear = searchParams.get('financialYear');
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    
    let filter = {};

    // SaaS PROTECTION: Restrict by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgEmployees = await prisma.employee.findMany({ 
            where: { organizationId: authUser.organizationId },
            select: { id: true, mongoId: true }
        });
        const empIds = orgEmployees.flatMap(e => [e.id, e.mongoId].filter(Boolean));
        filter.employeeId = { in: empIds };
    } else if (authUser.role === "employee") {
        const emp = await prisma.employee.findFirst({
            where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        });
        filter.employeeId = emp ? { in: [emp.id, emp.mongoId].filter(Boolean) } : authUser.id;
    }

    if (employeeId && authUser.role !== "employee") {
        filter.employeeId = employeeId;
    }
    
    const rawCalcs = await prisma.taxCalculation.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
    });

    // In-memory filter for JSON fields
    let taxCalculations = rawCalcs.map(tc => ({
        _id: tc.id,
        ...tc.taxData,
        employee: tc.taxData?.employee || tc.employeeId
    }));

    if (financialYear) {
        taxCalculations = taxCalculations.filter(tc => tc.financialYear === financialYear);
    }
    if (status) {
        taxCalculations = taxCalculations.filter(tc => tc.status === status);
    }

    const total = taxCalculations.length;
    const skip = (page - 1) * limit;
    taxCalculations = taxCalculations.slice(skip, skip + limit);

    // Populate references
    const populated = await Promise.all(taxCalculations.map(async tc => {
        let emp = null;
        if (tc.employee) {
            const e = await prisma.employee.findFirst({
                where: { OR: [{ id: tc.employee }, { mongoId: tc.employee }] }
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
        if (tc.calculatedBy) {
            const u = await prisma.user.findFirst({
                where: { OR: [{ id: tc.calculatedBy }, { mongoId: tc.calculatedBy }] },
                select: { name: true, email: true }
            });
            calcBy = u;
        }

        let revBy = null;
        if (tc.reviewedBy) {
            const u = await prisma.user.findFirst({
                where: { OR: [{ id: tc.reviewedBy }, { mongoId: tc.reviewedBy }] },
                select: { name: true, email: true }
            });
            revBy = u;
        }

        let appBy = null;
        if (tc.approvedBy) {
            const u = await prisma.user.findFirst({
                where: { OR: [{ id: tc.approvedBy }, { mongoId: tc.approvedBy }] },
                select: { name: true, email: true }
            });
            appBy = u;
        }

        return {
            ...tc,
            employee: emp,
            calculatedBy: calcBy,
            reviewedBy: revBy,
            approvedBy: appBy
        };
    }));
    
    return NextResponse.json({
      taxCalculations: populated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tax calculations:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE new tax calculation
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();

    // Verify employee belongs to admin's organization
    let employee = null;
    if (body.employee) {
        employee = await prisma.employee.findFirst({
            where: { OR: [{ id: body.employee }, { mongoId: body.employee }] }
        });
    }

    if (authUser.role === "admin") {
      if (!employee || employee.organizationId !== authUser.organizationId) {
        return NextResponse.json({ error: "Forbidden: Employee not in your organization" }, { status: 403 });
      }
    }
    
    // Map the new form structure to the expected TaxCalculation model
    const taxCalculationData = {
      employee: body.employee,
      financialYear: body.financialYear,
      
      // Map salary components to totalEarnings
      totalEarnings: (body.basicSalary || 0) + 
                    (body.hra || 0) + 
                    (body.specialAllowance || 0) + 
                    (body.otherAllowances || 0) + 
                    (body.lta || 0),
      
      // Map deductions
      totalDeductions: (body.section80C || 0) + 
                      (body.section80D || 0) + 
                      (body.section80CCD || 0) + 
                      (body.section80E || 0) + 
                      (body.section24 || 0) + 
                      (body.otherDeductions || 0),
      
      // Use calculated values
      taxableIncome: body.calculatedValues?.taxableIncome || 0,
      totalTax: body.calculatedValues?.finalTax || 0,
      
      // Additional fields
      taxRegime: body.taxRegime,
      age: body.age,
      status: body.status || 'Calculated',
      notes: body.notes,
      
      // Include detailed breakdown for reference
      calculationDetails: {
        salaryComponents: {
          basicSalary: body.basicSalary,
          hra: body.hra,
          specialAllowance: body.specialAllowance,
          otherAllowances: body.otherAllowances,
          lta: body.lta
        },
        deductions: {
          section80C: body.section80C,
          section80D: body.section80D,
          section80CCD: body.section80CCD,
          section80E: body.section80E,
          section24: body.section24,
          otherDeductions: body.otherDeductions
        },
        hraDetails: {
          rentPaid: body.rentPaid,
          cityType: body.cityType
        },
        calculatedValues: body.calculatedValues
      },
      
      calculatedBy: authUser.id
    };
    
    const taxCalculation = await prisma.taxCalculation.create({
        data: {
            employeeId: employee ? employee.id : body.employee,
            taxData: taxCalculationData
        }
    });

    const populatedEmp = employee ? {
        _id: employee.id,
        employeeId: employee.modelData?.employeeId,
        personalDetails: employee.modelData?.personalDetails
    } : null;
    
    return NextResponse.json({
        _id: taxCalculation.id,
        ...taxCalculation.taxData,
        employee: populatedEmp
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
