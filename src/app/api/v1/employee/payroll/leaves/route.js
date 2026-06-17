import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET all leaves with filters
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

    let prismaFilter = {};

    // SaaS PROTECTION: Restrict by organization
    if (authUser.role === "admin" || authUser.role === "supervisor") {
        const orgEmployees = await prisma.employee.findMany({ 
            where: { organizationId: authUser.organizationId },
            select: { id: true, mongoId: true }
        });
        const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
        prismaFilter.employeeId = { in: empIds };
    } else if (authUser.role === "employee") {
        prismaFilter.employeeId = authUser.id; // Or mongoId
    }

    let supervisorFilter = {};
    if (supervisorUserId && supervisorUserId !== 'undefined') {
        let supervisorEmployeeId = null;
        try {
           const supervisorUser = await prisma.user.findFirst({
               where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] }
           });
           if (supervisorUser?.employeeId) {
               supervisorEmployeeId = supervisorUser.employeeId;
           }
        } catch (e) {}

        let supervisorEmployee;
        if (supervisorEmployeeId) {
             supervisorEmployee = await prisma.employee.findFirst({
                 where: { employeeId: supervisorEmployeeId }
             });
        } else {
             try {
                supervisorEmployee = await prisma.employee.findFirst({
                    where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] }
                });
             } catch(e) {}
        }

        if (supervisorEmployee) {
           const supervisees = await prisma.employee.findMany({
               where: {
                   OR: [
                       { reportingManager: supervisorEmployee.id },
                   ]
               },
               select: { id: true, mongoId: true }
           });
           
           if (supervisees.length > 0) {
               const sIds = supervisees.map(e => e.id).concat(supervisees.map(e => e.mongoId).filter(Boolean));
               supervisorFilter = { employeeId: { in: sIds } };
           } else {
               supervisorFilter = { employeeId: { in: [] } };
           }
        } else {
            supervisorFilter = { employeeId: { in: [] } };
        }
    }

    if (employeeId) {
        if (supervisorUserId) {
             if (supervisorFilter.employeeId && supervisorFilter.employeeId.in) {
                 const isAllowed = supervisorFilter.employeeId.in.includes(employeeId);
                 if (!isAllowed) {
                     prismaFilter.employeeId = { in: [] }; 
                 } else {
                     prismaFilter.employeeId = employeeId;
                 }
             } else {
                  prismaFilter.employeeId = { in: [] };
             }
        } else {
            if (prismaFilter.employeeId && prismaFilter.employeeId.in) {
                if (prismaFilter.employeeId.in.includes(employeeId)) prismaFilter.employeeId = employeeId;
                else prismaFilter.employeeId = { in: [] };
            } else {
                prismaFilter.employeeId = employeeId;
            }
        }
    } else if (supervisorUserId) {
        Object.assign(prismaFilter, supervisorFilter);
    }

    if (organizationId) prismaFilter.organizationId = organizationId;
    if (organizationType) prismaFilter.organizationType = organizationType;
    if (month) prismaFilter.month = parseInt(month);
    if (year) prismaFilter.year = parseInt(year);
    if (status) prismaFilter.status = status;

    if (search) {
      prismaFilter.OR = [
        { employeeName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Convert filter if employeeId uses fallback OR logic
    const finalFilter = { ...prismaFilter };
    if (prismaFilter.employeeId && !prismaFilter.OR) {
        if (typeof prismaFilter.employeeId === 'string') {
            finalFilter.OR = [
                { employeeId: prismaFilter.employeeId },
                { employee: { mongoId: prismaFilter.employeeId } }
            ];
            delete finalFilter.employeeId;
        } else if (prismaFilter.employeeId.in) {
            finalFilter.OR = [
                { employeeId: { in: prismaFilter.employeeId.in } },
                { employee: { mongoId: { in: prismaFilter.employeeId.in } } }
            ];
            delete finalFilter.employeeId;
        }
    }

    const leaves = await prisma.leave.findMany({
      where: finalFilter,
      include: {
          employee: { select: { firstName: true, lastName: true, email: true, employeeId: true, status: true, id: true, mongoId: true } }
      },
      orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' }
      ],
      skip: skip,
      take: limit,
    });

    const total = await prisma.leave.count({ where: finalFilter });

    const orgIds = [...new Set(leaves.map(l => l.organizationId).filter(Boolean))];
    const orgs = await prisma.organization.findMany({
        where: { OR: [{ id: { in: orgIds } }, { mongoId: { in: orgIds } }] },
        select: { id: true, name: true }
    });
    const orgMap = new Map(orgs.map(o => [o.id, o]));

    const formattedLeaves = leaves.map(l => {
        const org = l.organizationId ? orgMap.get(l.organizationId) : null;
        return {
            ...l,
            _id: l.id,
            employeeId: l.employee ? {
                id: l.employee.id,
                mongoId: l.employee.mongoId,
                _id: l.employee.mongoId || l.employee.id,
                employeeId: l.employee.employeeId,
                status: l.employee.status,
                personalDetails: {
                    firstName: l.employee.firstName,
                    lastName: l.employee.lastName,
                    email: l.employee.email
                }
            } : null,
            organizationId: org ? { name: org.name, _id: l.organizationId } : null
        };
    });

    return NextResponse.json({
      leaves: formattedLeaves,
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

// CREATE or UPDATE leave record
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    console.log("Leave Request Body:", body);

    const {
      employeeId,
      month,
      year,
      leaves,
      notes,
      status = "Draft",
    } = body;

    // Validate required fields
    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: "Employee ID, month, and year are required" },
        { status: 400 }
      );
    }

    // Get employee details
    const employee = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }
    
    // SaaS PROTECTION: Admin must use their assigned organizationId
    if (authUser.role === "admin") {
      const empOrgId = employee.organizationId;
      if (empOrgId !== authUser.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cannot apply leave for employee in another organization" }, { status: 403 });
      }
    }

    // Check if leave record already exists for this month
    let leaveRecord = await prisma.leave.findFirst({
      where: {
          employeeId: employee.id,
          month: parseInt(month),
          year: parseInt(year),
      }
    });

    // Prepare leave data
    const leaveData = {
      employeeId: employee.id,
      employeeCode: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      organizationId: employee.organizationId || null,
      organizationType: employee.employeeType || "Unknown",
      department: employee.department || "Unknown",
      month: parseInt(month),
      year: parseInt(year),
      leaves: leaves || [],
      notes: notes || "",
      status,
    };

    if (leaveRecord) {
      console.log("⚠️ WARNING: Record already exists for this employee/month/year!");
      return NextResponse.json(
        { 
          error: "A leave record already exists for this employee in this month. Please use the edit function to modify it.",
          existingRecordId: leaveRecord.id
        },
        { status: 409 }
      );
    }

    console.log("📝 Creating new leave record...");
    
    leaveRecord = await prisma.leave.create({
      data: {
        ...leaveData,
        createdById: body.createdBy,
        updatedById: body.updatedBy,
      }
    });

    console.log(`✅ Leave record created: ${leaveRecord.id}`);

    const populatedEmployee = await prisma.employee.findUnique({
      where: { id: leaveRecord.employeeId },
      select: { firstName: true, lastName: true, email: true, employeeId: true, status: true, id: true, mongoId: true }
    });

    const org = leaveRecord.organizationId ? await prisma.organization.findFirst({
      where: { OR: [{ id: leaveRecord.organizationId }, { mongoId: leaveRecord.organizationId }] },
      select: { name: true }
    }) : null;
    
    // Log activity
    await logActivity({
      action: "created",
      entity: "Leave",
      entityId: leaveRecord.id,
      description: `Applied leave for ${leaveRecord.employeeName} (${getMonthName(month)} ${year})`,
      performedBy: {
        userId: authUser.id,
        name: "Admin/User"
      },
      details: {
        employeeId,
        month,
        year,
        totalDays: (leaves || []).length
      },
      req: request
    });

    const formatted = {
        ...leaveRecord,
        _id: leaveRecord.id,
        employeeId: populatedEmployee ? {
            id: populatedEmployee.id,
            mongoId: populatedEmployee.mongoId,
            _id: populatedEmployee.mongoId || populatedEmployee.id,
            employeeId: populatedEmployee.employeeId,
            status: populatedEmployee.status,
            personalDetails: {
                firstName: populatedEmployee.firstName,
                lastName: populatedEmployee.lastName,
                email: populatedEmployee.email
            }
        } : null,
        organizationId: org ? { name: org.name, _id: leaveRecord.organizationId } : null
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("❌ Error in POST /api/payroll/leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getMonthName(month) {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return months[month - 1];
}
