import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";
import { syncLeaveApplicationToPayroll, updateAnnualBalance } from "@/lib/payroll/leave-sync-engine";
import { resolveOrgIds } from "@/lib/utils/flatten-model";

// GET all leaves with filters
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    
    let hasLeavesViewPermission = false;
    if (authUser.role === "employee") {
      try {
        const employeeRecord = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
        if (employeeRecord && employeeRecord.roleId) {
          const roleId = employeeRecord.roleId;
          const roleData = await prisma.role.findFirst({ where: { OR: [{ id: roleId }, { mongoId: roleId }] } });
          if (roleData) {
            const perms = Array.isArray(roleData.permissions) ? roleData.permissions : (roleData.roleData?.permissions || []);
            if (Array.isArray(perms) && perms.includes("leaves.view")) {
              hasLeavesViewPermission = true;
            }
          }
        }
      } catch (err) {
        console.error("Error checking employee permission in leaves route:", err);
      }
    }

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

    // Load all leaves
    let leaves = await prisma.leave.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            employee: { select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true } }
        }
    });

    // Hydrate for frontend (mapping employee to expected nested form)
    let enriched = leaves.map(l => ({
        ...l,
        _id: l.id,
        employeeId: l.employee ? {
            _id: l.employee.id,
            employeeId: l.employee.employeeId,
            personalDetails: { firstName: l.employee.firstName, lastName: l.employee.lastName }
        } : null
    }));

    // Filter in JS
    if (authUser.role === "admin" || authUser.role === "supervisor" || (authUser.role === "employee" && hasLeavesViewPermission)) {
        const orgIds = await resolveOrgIds(authUser.organizationId);
        const orgEmployees = await prisma.employee.findMany({ where: { organizationId: { in: orgIds } } });
        const orgEmpIds = new Set(orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean)));
        enriched = enriched.filter(l => l.employee && (orgEmpIds.has(l.employee.id) || orgEmpIds.has(l.employee.mongoId)));
    } else if (authUser.role === "employee") {
        enriched = enriched.filter(l => l.employee && (l.employee.id === authUser.id || l.employee.mongoId === authUser.id));
    }

    let supervisorEmployee = null;
    if (supervisorUserId && supervisorUserId !== 'undefined') {
        const supervisorUser = await prisma.user.findFirst({ where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] } });
        const supervisorEmployeeId = supervisorUser?.employeeId;
        if (supervisorEmployeeId) {
             supervisorEmployee = await prisma.employee.findFirst({ where: { employeeId: supervisorEmployeeId } });
        } else {
             supervisorEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: supervisorUserId }, { mongoId: supervisorUserId }] } });
        }
        
        if (supervisorEmployee) {
            const supervisees = await prisma.employee.findMany();
            const superviseeIds = new Set(supervisees.filter(e => {
                const isReport = e.reportingManager === supervisorEmployee.id || e.reportingManager === supervisorEmployee.mongoId;
                const aa = e.attendanceApproval || {};
                const isShift1Super = aa.shift1Supervisor === supervisorEmployee.id || aa.shift1Supervisor === supervisorEmployee.mongoId;
                const isShift2Super = aa.shift2Supervisor === supervisorEmployee.id || aa.shift2Supervisor === supervisorEmployee.mongoId;
                return isReport || isShift1Super || isShift2Super;
            }).map(e => e.id).concat(supervisees.map(e => e.mongoId).filter(Boolean)));

            enriched = enriched.filter(l => l.employee && (superviseeIds.has(l.employee.id) || superviseeIds.has(l.employee.mongoId)));
        } else {
            enriched = [];
        }
    }

    if (employeeId) {
        enriched = enriched.filter(l => l.employee && (l.employee.id === employeeId || l.employee.mongoId === employeeId));
    }

    if (organizationId) {
        const orgIds = await resolveOrgIds(organizationId);
        enriched = enriched.filter(l => l.organizationId && orgIds.includes(l.organizationId));
    }

    if (organizationType) {
        enriched = enriched.filter(l => l.organizationType === organizationType);
    }

    if (month) {
        enriched = enriched.filter(l => l.month === parseInt(month));
    }

    if (year) {
        enriched = enriched.filter(l => l.year === parseInt(year));
    }

    if (status) {
        enriched = enriched.filter(l => l.status === status);
    }

    if (search) {
        const sLower = search.toLowerCase();
        enriched = enriched.filter(l => 
            (l.employeeName || '').toLowerCase().includes(sLower) ||
            (l.employeeCode || '').toLowerCase().includes(sLower)
        );
    }

    // Background Data Integrity Check:
    if (enriched.length > 0) {
      if (searchParams.get("employeeId") || searchParams.get("query")) {
          const distinctEmployeeIds = [...new Set(enriched.map(l => l.employeeId?._id).filter(Boolean))];
          for (const empId of distinctEmployeeIds) {
              const app = await prisma.leaveApplication.findFirst({
                  where: { employeeId: empId, status: 'Approved' }
              });
              if (app) {
                  console.log(`[LeaveSync] Force-Syncing ${empId} synchronously...`);
                  await syncLeaveApplicationToPayroll(app.id);
              }
          }
          // Reload leaves after sync to return fresh data
          const updatedLeaves = await prisma.leave.findMany({
              where: { id: { in: enriched.map(l => l.id) } },
              include: {
                  employee: { select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true } }
              }
          });
          enriched = updatedLeaves.map(l => ({
              ...l,
              _id: l.id,
              employeeId: l.employee ? {
                  _id: l.employee.id,
                  employeeId: l.employee.employeeId,
                  personalDetails: { firstName: l.employee.firstName, lastName: l.employee.lastName }
              } : null
          }));
      } else {
          // Async - non-blocking sync for the general list view
          const distinctEmployeeIds = [...new Set(enriched.map(l => l.employeeId?._id).filter(Boolean))].slice(0, 5);
          distinctEmployeeIds.forEach(empId => {
              prisma.leaveApplication.findFirst({
                  where: { employeeId: empId, status: 'Approved' }
              }).then(app => {
                  if (app) syncLeaveApplicationToPayroll(app.id).catch(e => console.error("Sync Error:", e));
              });
          });
      }
    }

    const total = enriched.length;
    const paginated = enriched.slice(skip, skip + limit);

    return NextResponse.json({
      leaves: paginated,
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
    const employee = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }] } });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    console.log("Employee found:", {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      organizationId: employee.organizationId,
      department: employee.department,
    });
    
    // SaaS PROTECTION: Admin must use their assigned organizationId or edit users within their org
    if (authUser.role === "admin") {
      const empOrgId = employee.organizationId;
      if (empOrgId !== authUser.organizationId) {
        return NextResponse.json({ error: "Forbidden: Cannot apply leave for employee in another organization" }, { status: 403 });
      }
    }

    // Check if leave record already exists for this month
    let leaveRecord = await prisma.leave.findFirst({ where: {
      employeeId: employee.id,
      month: parseInt(month),
      year: parseInt(year),
    } });

    // Prepare leave data
    const leaveData = {
      employeeId: employee.id,
      employeeCode: employee.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      organizationId: employee.organizationId || null,
      organizationType: "Company",
      department: employee.department || "Unknown",
      month: parseInt(month),
      year: parseInt(year),
      leaves: leaves || [],
      notes: notes || "",
      status,
    };

    if (leaveRecord) {
      console.log("⚠️ WARNING: Record already exists for this employee/month/year!");
      console.log(`   Existing record ID: ${leaveRecord.id}`);
      
      return NextResponse.json(
        { 
          error: "A leave record already exists for this employee in this month. Please use the edit function to modify it.",
          existingRecordId: leaveRecord.id
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Create new record (no existing record found)
    console.log("📝 Creating new leave record...");
    
    leaveRecord = await prisma.leave.create({ data: {
      ...leaveData,
      createdById: body.createdBy,
      updatedById: body.updatedBy,
    } });

    console.log(`✅ Leave record created: ${leaveRecord.id}`);
    
    // Always update annual balance to ensure correct balance calculation on creation
    console.log("📊 Updating annual balance...");
    await updateAnnualBalance(employee.id, employee.organizationId, parseInt(year));

    const freshRecord = await prisma.leave.findUnique({ where: { id: leaveRecord.id } });

    // Log activity
    await logActivity({
      action: "created",
      entity: "Leave",
      entityId: leaveRecord.id,
      description: `Applied leave for ${leaveRecord.employeeName} (${getMonthName(month)} ${year})`,
      performedBy: {
        userId: body.createdBy || authUser.id,
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

    return NextResponse.json({
        ...freshRecord,
        _id: freshRecord.id
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Error in POST /api/payroll/leaves:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to get month name
function getMonthName(month) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1];
}