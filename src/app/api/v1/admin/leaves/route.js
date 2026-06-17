import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const organizationId = searchParams.get("organizationId");
    const organizationType = searchParams.get("organizationType");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");
    const search = searchParams.get("search");
    const supervisorUserId = searchParams.get("supervisorUserId");

    const skip = (page - 1) * limit;

    let filter = {};

    // SaaS PROTECTION: Restrict by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgEmployees = await prisma.employee.findMany({ 
            where: { organizationId: authUser.organizationId },
            select: { id: true, mongoId: true }
        });
        const allowedIds = orgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
        filter.employeeId = { in: allowedIds };
    } else if (authUser.role === "employee") {
        const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
        if (emp) filter.employeeId = emp.id;
        else filter.employeeId = 'none';
    }

    if (employeeId) {
        // Find specific employee
        const emp = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }, { employeeId: employeeId }] } });
        if (emp) {
            // Ensure within allowed list if any
            if (filter.employeeId && filter.employeeId.in) {
                 if (filter.employeeId.in.includes(emp.id) || filter.employeeId.in.includes(emp.mongoId)) {
                     filter.employeeId = emp.id;
                 } else {
                     filter.employeeId = 'none';
                 }
            } else {
                filter.employeeId = emp.id;
            }
        } else {
            filter.employeeId = 'none';
        }
    }

    if (organizationId) {
      filter.organizationId = organizationId;
    }

    if (organizationType) {
      filter.organizationType = organizationType;
    }

    if (month) {
      filter.month = parseInt(month);
    }

    if (year) {
      filter.year = parseInt(year);
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const leavesDocs = await prisma.leave.findMany({
        where: filter,
        orderBy: [ { year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' } ],
        skip,
        take: limit
    });

    const total = await prisma.leave.count({ where: filter });

    const empIds = [...new Set(leavesDocs.map(l => l.employeeId))];
    const employees = await prisma.employee.findMany({
        where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
        select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, status: true }
    });

    const empMap = {};
    employees.forEach(e => {
        const data = {
            _id: e.id,
            employeeId: e.employeeId,
            status: e.status,
            personalDetails: { firstName: e.firstName, lastName: e.lastName }
        };
        empMap[e.id] = data;
        if (e.mongoId) empMap[e.mongoId] = data;
    });

    const orgIds = [...new Set(leavesDocs.map(l => l.organizationId).filter(Boolean))];
    const orgs = await prisma.organization.findMany({
        where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
        select: { id: true, mongoId: true, name: true }
    });

    const orgMap = {};
    orgs.forEach(o => {
        const data = { _id: o.id, name: o.name };
        orgMap[o.id] = data;
        if (o.mongoId) orgMap[o.mongoId] = data;
    });

    const leaves = leavesDocs.map(l => ({
        _id: l.id,
        ...l,
        employeeId: empMap[l.employeeId] || { _id: l.employeeId },
        organizationId: orgMap[l.organizationId] || null
    }));

    return NextResponse.json({
      leaves,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/payroll/leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();

    const {
      employeeId,
      month,
      year,
      leaves,
      notes,
      status = "Draft",
    } = body;

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: "Employee ID, month, and year are required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { mongoId: employeeId }, { employeeId: employeeId }] }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    if (authUser.role === "admin") {
      const empOrgId = employee.organizationId;
      if (empOrgId !== authUser.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cannot apply leave for employee in another organization" }, { status: 403 });
      }
    }

    let leaveRecord = await prisma.leave.findFirst({
      where: {
          OR: [{ employeeId: employee.id }, { employeeId: employee.mongoId || 'none' }],
          month: parseInt(month),
          year: parseInt(year),
      }
    });

    const leaveData = {
      employeeId: employee.id,
      employeeCode: employee.employeeId,
      employeeName: `${employee.firstName || employee.personalDetails?.firstName} ${employee.lastName || employee.personalDetails?.lastName}`,
      organizationId: employee.organizationId || null,
      organizationType: employee.organizationType || "Unknown",
      department: employee.departmentId || employee.department || "Unknown",
      month: parseInt(month),
      year: parseInt(year),
      leaves: leaves || [],
      notes: notes || "",
      status,
    };

    if (leaveRecord) {
      return NextResponse.json(
        { 
          error: "A leave record already exists for this employee in this month. Please use the edit function to modify it.",
          existingRecordId: leaveRecord.id
        },
        { status: 409 }
      );
    }
    
    // Summary computation based on manual logic
    let totalDays = 0, paidLeaves = 0, unpaidLeaves = 0, halfDayPaidLeaves = 0, halfDayUnpaidLeaves = 0;
    (leaves || []).forEach((leave) => {
      const type = (leave.leaveType || "").toLowerCase();
      if (type.includes("unpaid")) {
        if (type.includes("half")) { halfDayUnpaidLeaves += 1; totalDays += 0.5; } 
        else { unpaidLeaves += 1; totalDays += 1; }
      } else {
        if (type.includes("half")) { halfDayPaidLeaves += 1; totalDays += 0.5; } 
        else { paidLeaves += 1; totalDays += 1; }
      }
    });

    const summary = { totalDays, paidLeaves, unpaidLeaves, halfDayPaidLeaves, halfDayUnpaidLeaves };

    leaveRecord = await prisma.leave.create({
      data: {
          ...leaveData,
          summary,
          createdById: body.createdBy || authUser.id,
          updatedById: body.updatedBy || authUser.id,
      }
    });

    return NextResponse.json({ ...leaveRecord, _id: leaveRecord.id }, { status: 201 });
  } catch (error) {
    console.error("❌ Error in POST /api/payroll/leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
