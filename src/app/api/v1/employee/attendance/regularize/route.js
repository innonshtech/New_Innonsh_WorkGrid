import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


import { getAuthUser } from "@/lib/auth-util";
import { sendAttendanceRegularizationRequestEmail } from "@/utils/notifications";

export const dynamic = 'force-dynamic';

function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    

    const body = await request.json();
    const { date, type, reason, approverId, halfDaySlot, requestedTime } = body;

    if (!date || !type || !reason || !approverId) {
      return NextResponse.json(
        { success: false, error: "Date, type, reason, and approver are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Requesting Employee
    const employee = await prisma.employee.findFirst({
      where: isValidUUID(authUser.id)
        ? { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        : { mongoId: authUser.id }
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    // 2. Fetch Selected Approver
    const approver = await prisma.employee.findFirst({
      where: isValidUUID(approverId)
        ? { OR: [{ id: approverId }, { mongoId: approverId }] }
        : { mongoId: approverId }
    });
    if (!approver) {
      return NextResponse.json({ success: false, error: "Selected approver not found" }, { status: 404 });
    }

    // 3. Create Regularization Request
    const regularization = await prisma.attendanceRegularization.create({
      data: {
        employeeId: employee.id,
        organizationId: employee.organizationId || authUser.organizationId,
        status: 'Pending',
        modelData: {
          date: new Date(date),
          type,
          reason,
          approver: approver.id,
          halfDaySlot: halfDaySlot || 'None',
          requestedTime: requestedTime || null,
          status: 'Pending'
        }
      }
    });

    // 4. Send Email Notification to Approver
    try {
      await sendAttendanceRegularizationRequestEmail({
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: new Date(date),
        type,
        reason,
        approverEmail: approver.email
      });
    } catch (emailErr) {
      console.error("Non-critical error sending regularization email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: regularization.id,
        ...regularization,
        ...(regularization.modelData || {})
      },
      message: "Request submitted successfully"
    });

  } catch (error) {
    console.error("Error creating attendance regularization:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    const employee = await prisma.employee.findFirst({
      where: isValidUUID(authUser.id)
        ? { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
        : { mongoId: authUser.id }
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    let filter = { employeeId: employee.id };
    if (status) filter.status = status;

    const requestsDocs = await prisma.attendanceRegularization.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' }
    });

    // Resolve employee names for approver and employee
    const employeeIds = [...new Set(
      requestsDocs.map(r => r.employeeId)
        .concat(requestsDocs.map(r => r.modelData?.approver))
        .filter(Boolean)
    )];
    const validUUIDEmployeeIds = employeeIds.filter(isValidUUID);
    const employees = await prisma.employee.findMany({
      where: { OR: [{ id: { in: validUUIDEmployeeIds } }, { mongoId: { in: employeeIds } }] },
      select: { id: true, mongoId: true, firstName: true, lastName: true, email: true }
    });

    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.id] = emp;
      if (emp.mongoId) employeeMap[emp.mongoId] = emp;
    });

    const requests = requestsDocs.map(req => {
      const data = req.modelData || {};
      const emp = employeeMap[req.employeeId];
      const app = employeeMap[data.approver];
      return {
        _id: req.id,
        id: req.id,
        employee: emp ? {
          _id: emp.id,
          personalDetails: { firstName: emp.firstName, lastName: emp.lastName }
        } : null,
        date: data.date,
        type: data.type,
        reason: data.reason,
        approver: app ? {
          _id: app.id,
          personalDetails: { firstName: app.firstName, lastName: app.lastName, email: app.email }
        } : null,
        halfDaySlot: data.halfDaySlot,
        requestedTime: data.requestedTime,
        status: req.status || data.status || 'Pending',
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Error fetching attendance regularizations:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
