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
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    let filter = {};

    // SaaS PROTECTION: Restrict by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgEmployees = await prisma.employee.findMany({
            where: { organizationId: authUser.organizationId },
            select: { id: true }
        });
        const orgEmployeeIds = orgEmployees.map(e => e.id);
        filter.employeeId = { in: orgEmployeeIds };
    } else if (authUser.role === "employee") {
        filter.employeeId = authUser.id;
    }

    if (employeeId && authUser.role !== "employee") {
      if (filter.employeeId && filter.employeeId.in) {
        const isAllowed = filter.employeeId.in.includes(employeeId);
        filter.employeeId = isAllowed ? employeeId : { in: [] };
      } else {
        filter.employeeId = employeeId;
      }
    }

    if (search) {
      const matchingEmployees = await prisma.employee.findMany({
        where: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeId: { contains: search, mode: 'insensitive' } }
          ]
        },
        select: { id: true }
      });
      const matchingEmployeeIds = matchingEmployees.map(e => e.id);
      
      if (filter.employeeId) {
        if (filter.employeeId.in) {
          const intersected = filter.employeeId.in.filter(id => matchingEmployeeIds.includes(id));
          filter.employeeId = { in: intersected };
        } else {
          filter.employeeId = matchingEmployeeIds.includes(filter.employeeId) ? filter.employeeId : 'non-existent-id';
        }
      } else {
        filter.employeeId = { in: matchingEmployeeIds };
      }
    }

    if (financialYear || status) {
      const containsObj = {};
      if (financialYear) containsObj.financialYear = financialYear;
      if (status) containsObj.status = status;
      filter.taxData = {
        contains: containsObj
      };
    }
    
    const taxCalculations = await prisma.taxCalculation.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.taxCalculation.count({ where: filter });

    // Populate employee details
    const empIds = [...new Set(taxCalculations.map(c => c.employeeId).filter(Boolean))];
    const employees = empIds.length > 0 ? await prisma.employee.findMany({
      where: { id: { in: empIds } },
      select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, email: true, phone: true, department: true, designation: true }
    }) : [];

    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(emp.id, {
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
      });
    });

    const enrichedCalculations = taxCalculations.map(c => {
      const data = c.taxData && typeof c.taxData === 'object' ? c.taxData : {};
      return {
        id: c.id,
        _id: c.id,
        mongoId: c.mongoId,
        employeeId: c.employeeId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        ...data,
        employee: employeeMap.get(c.employeeId) || null
      };
    });
    
    return NextResponse.json({
      taxCalculations: enrichedCalculations,
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
    if (authUser.role === "admin") {
      const employee = await prisma.employee.findFirst({ where: { OR: [{ id: body.employee }, { mongoId: body.employee }] } });
      if (!employee || employee.organizationId !== authUser.organizationId) {
        return NextResponse.json({ error: "Forbidden: Employee not in your organization" }, { status: 403 });
      }
    }
    
    const employeeRecord = await prisma.employee.findFirst({ where: { OR: [{ id: body.employee }, { mongoId: body.employee }] } });
    if (!employeeRecord) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    
    // Package all calculation properties inside taxData JSON field
    const taxCalculationData = {
      employeeId: employeeRecord.id,
      taxData: {
        financialYear: body.financialYear,
        totalEarnings: (body.basicSalary || 0) + 
                      (body.hra || 0) + 
                      (body.specialAllowance || 0) + 
                      (body.otherAllowances || 0) + 
                      (body.lta || 0),
        totalDeductions: (body.section80C || 0) + 
                        (body.section80D || 0) + 
                        (body.section80CCD || 0) + 
                        (body.section80E || 0) + 
                        (body.section24 || 0) + 
                        (body.otherDeductions || 0),
        taxableIncome: body.calculatedValues?.taxableIncome || 0,
        totalTax: body.calculatedValues?.finalTax || 0,
        taxRegime: body.taxRegime,
        age: body.age,
        status: body.status || 'Calculated',
        notes: body.notes,
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
      }
    };
    
    const taxCalculation = await prisma.taxCalculation.create({ data: taxCalculationData });
    
    const data = taxCalculation.taxData && typeof taxCalculation.taxData === 'object' ? taxCalculation.taxData : {};
    const responseObj = {
      id: taxCalculation.id,
      _id: taxCalculation.id,
      mongoId: taxCalculation.mongoId,
      employeeId: taxCalculation.employeeId,
      createdAt: taxCalculation.createdAt,
      updatedAt: taxCalculation.updatedAt,
      ...data
    };
    
    return NextResponse.json(responseObj, { status: 201 });
  } catch (error) {
    console.error('Error creating tax calculation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
