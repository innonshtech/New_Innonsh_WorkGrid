import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET all payslips
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const employee = searchParams.get("employee");
    const skip = (page - 1) * limit;

    let filter = {};

    // SaaS PROTECTION: Restrict data by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
      filter.organizationId = authUser.organizationId;
    } else if (authUser.role === "employee") {
      filter.employeeId = authUser.id;
      // Keka Parity: Employees only see Published payslips
      if (!status) filter.status = "Published"; 
    } else if (authUser.role === "super_admin" && (employeeId || employee)) {
       filter.employeeId = employeeId || employee;
    }

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    if (employeeId && authUser.role !== "employee") filter.employeeId = employeeId;
    if (employee && authUser.role !== "employee") filter.employeeId = employee;

    const payslips = await prisma.payslip.findMany({
      where: filter,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // Enrich payslips with employee data for the frontend
    const employeeIds = [...new Set(payslips.map(p => p.employeeId).filter(Boolean))];
    const employees = employeeIds.length > 0 ? await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        designation: true,
        employeeType: true,
        category: true,
        organizationId: true
      }
    }) : [];

    const employeeMap = {};
    employees.forEach(e => {
      employeeMap[e.id] = e;
    });

    const enrichedPayslips = payslips.map(p => {
      const emp = employeeMap[p.employeeId];
      return {
        ...p,
        _id: p.id,
        employee: emp ? {
          _id: emp.id,
          id: emp.id,
          employeeId: emp.employeeId,
          personalDetails: {
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email
          },
          jobDetails: {
            department: emp.department,
            designation: emp.designation,
            employeeType: emp.employeeType,
            category: emp.category,
            organizationId: emp.organizationId
          },
          employeeType: emp.employeeType,
          category: emp.category
        } : null
      };
    });

    console.log("Payslips fetched:", enrichedPayslips.length);

    const total = await prisma.payslip.count({ where: filter });

    return NextResponse.json({
      payslips: enrichedPayslips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payslips:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check for duplicate payslip
export async function GET_CHECK(request) {
  try {
    

    const { searchParams } = new URL(request.url);
    const employee = searchParams.get("employee");
    const month = parseInt(searchParams.get("month"));
    const year = parseInt(searchParams.get("year"));

    if (!employee || !month || !year) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const existingPayslip = await prisma.payslip.findFirst({ where: {
      employeeId: employee,
      month,
      year,
      status: { not: "Cancelled" },
    } });

    return NextResponse.json({
      exists: !!existingPayslip,
      payslip: existingPayslip,
    });
  } catch (error) {
    console.error("Error checking payslip:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// CREATE new payslip
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    

    const body = await request.json();

    // Validate required fields
    if (!body.employee || !body.month || !body.year || !body.organizationName || !body.salaryType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for existing payslip
    const existingPayslip = await prisma.payslip.findFirst({ where: {
      employeeId: body.employee,
      month: body.month,
      year: body.year,
      status: { not: "Cancelled" },
    } });

    if (existingPayslip) {
      return NextResponse.json(
        {
          error: "DUPLICATE_PAYSLIP",
          message: `A payslip for ${getMonthName(body.month)} ${body.year} already exists for this employee.`,
          existingPayslipId: existingPayslip.id,
        },
        { status: 409 }
      );
    }

    // Fetch employee data to validate ownership and get type
    const employeeRecord = await prisma.employee.findFirst({ where: { OR: [{ id: body.employee }, { mongoId: body.employee }] } });
    if (!employeeRecord) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    
    // SaaS PROTECTION: Admin must use their assigned organizationId
    const targetOrgId = authUser.role === "admin" ? authUser.organizationId : body.organizationId;

    if (authUser.role === "admin" && employeeRecord.organizationId !== authUser.organizationId) {
       return NextResponse.json({ error: "Forbidden: Employee belongs to another organization" }, { status: 403 });
    }

    const employeeType = employeeRecord.employeeType || null;

    // Generate unique payslip ID without race conditions
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const payslipId = `PSL-${uniqueSuffix}`;

    if (!targetOrgId) {
       return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Map 'employee' from request body to 'employeeId' for Prisma schema
    const payslipBody = { ...body };
    if (payslipBody.employee) {
      payslipBody.employeeId = employeeRecord.id; // Use the resolved employee UUID
      delete payslipBody.employee;
    }

    const payslip = await prisma.payslip.create({ data: {
      ...payslipBody,
      organizationId: targetOrgId,
      generatedById: authUser.id,
      payslipId,
      employeeType,
    } });



    // Log activity
    await logActivity({
      action: "generated",
      entity: "Payslip",
      entityId: payslip.payslipId,
      description: `Generated payslip for employee ${body.employee} (${getMonthName(body.month)} ${body.year})`,
      performedBy: {
        userId: body.generatedBy,
        name: "Admin/User"
      },
      details: {
        employeeId: body.employee,
        month: body.month,
        year: body.year,
        netSalary: payslip.netSalary
      },
      req: request
    });

    return NextResponse.json(payslip, { status: 201 });
  } catch (error) {
    if (error.code === 11000 || error.code === 'P2002') {
      return NextResponse.json(
        {
          error: "DUPLICATE_PAYSLIP",
          message: "A payslip for this employee and period already exists.",
        },
        { status: 409 }
      );
    }
    console.error("Error creating payslip:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get month name
function getMonthName(month) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1];
}
