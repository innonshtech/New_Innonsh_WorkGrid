import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";
import { sendRegularizationStatusUpdateEmail } from "@/utils/notifications";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();

    // Resolve employee ID to support User/Employee record separation
    let currentEmployeeId = authUser.id;
    
    const employeeById = await prisma.employee.findFirst({
        where: {
            OR: [
                { id: authUser.id },
                { mongoId: authUser.id }
            ]
        },
        select: { id: true }
    });

    if (employeeById) {
        currentEmployeeId = employeeById.id;
    } else {
        const userRec = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: authUser.id },
                    { mongoId: authUser.id }
                ]
            },
            select: { employeeId: true, email: true }
        });

        if (userRec) {
            let mappedEmp = null;
            if (userRec.employeeId) {
                mappedEmp = await prisma.employee.findFirst({
                    where: { employeeId: userRec.employeeId },
                    select: { id: true }
                });
            }
            if (!mappedEmp && userRec.email) {
                mappedEmp = await prisma.employee.findFirst({
                    where: { email: { equals: userRec.email, mode: 'insensitive' } },
                    select: { id: true }
                });
            }
            if (mappedEmp) currentEmployeeId = mappedEmp.id;
        }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Pending";

    let query = { status };
    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      query.approverId = currentEmployeeId;
    }

    const requests = await prisma.attendanceRegularization.findMany({
      where: query,
      include: {
        employee: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedRequests = requests.map(reg => ({
      ...reg,
      employee: reg.employee ? {
        employeeId: reg.employee.employeeId,
        personalDetails: {
          firstName: reg.employee.firstName,
          lastName: reg.employee.lastName,
          email: reg.employee.email
        }
      } : null
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests
    });
  } catch (error) {
    console.error("Error fetching attendance approvals:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();

    // Resolve employee ID for authorization
    let currentEmployeeId = authUser.id;

    const employeeById = await prisma.employee.findFirst({
        where: {
            OR: [
                { id: authUser.id },
                { mongoId: authUser.id }
            ]
        },
        select: { id: true }
    });

    if (employeeById) {
        currentEmployeeId = employeeById.id;
    } else {
        const userRec = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: authUser.id },
                    { mongoId: authUser.id }
                ]
            },
            select: { employeeId: true, email: true }
        });

        if (userRec) {
            let mappedEmp = null;
            if (userRec.employeeId) {
                mappedEmp = await prisma.employee.findFirst({
                    where: { employeeId: userRec.employeeId },
                    select: { id: true }
                });
            }
            if (!mappedEmp && userRec.email) {
                mappedEmp = await prisma.employee.findFirst({
                    where: { email: { equals: userRec.email, mode: 'insensitive' } },
                    select: { id: true }
                });
            }
            if (mappedEmp) currentEmployeeId = mappedEmp.id;
        }
    }

    const body = await request.json();
    const { requestId, status, remarks } = body;

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: "ID and Status are required" }, { status: 400 });
    }

    const reg = await prisma.attendanceRegularization.findFirst({
      where: {
        OR: [
          { id: requestId },
          { mongoId: requestId }
        ]
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    });

    if (!reg) {
      return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });
    }

    if (reg.approverId !== currentEmployeeId) {
        if (authUser.role !== 'super_admin' && authUser.role !== 'admin') {
            return NextResponse.json({ success: false, error: "Forbidden: You are not the assigned approver" }, { status: 403 });
        }
    }

    const updatedReg = await prisma.attendanceRegularization.update({
      where: { id: reg.id },
      data: {
        status,
        remarks,
        approvedById: currentEmployeeId,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    });

    // IF APPROVED, PERFORM ACTIONS
    if (status === 'Approved') {
      const attendanceDate = new Date(updatedReg.date);
      const normalizedAttendanceDate = new Date(attendanceDate);
      normalizedAttendanceDate.setHours(0, 0, 0, 0);

      const targetStatus = updatedReg.type === 'Half-Day' ? 'Half-day' : 'Present';

      // 1. Update/Create Attendance Record
      // We look up first to see if composite unique exists, or we check by employeeId + date
      const existingAtt = await prisma.attendance.findFirst({
        where: {
            employeeId: updatedReg.employee.id,
            date: normalizedAttendanceDate
        }
      });

      if (existingAtt) {
        await prisma.attendance.update({
          where: { id: existingAtt.id },
          data: {
            status: targetStatus,
            notes: `Approved ${updatedReg.type}: ${updatedReg.reason}${remarks ? ` | Manager Comment: ${remarks}` : ''}`,
            attendanceMethod: 'Manual'
          }
        });
      } else {
        await prisma.attendance.create({
          data: {
            employeeId: updatedReg.employee.id,
            date: normalizedAttendanceDate,
            status: targetStatus,
            notes: `Approved ${updatedReg.type}: ${updatedReg.reason}${remarks ? ` | Manager Comment: ${remarks}` : ''}`,
            attendanceMethod: 'Manual'
          }
        });
      }

      // 2. Trigger Payroll Recalculation Alert
      try {
        const month = attendanceDate.getMonth() + 1;
        const year = attendanceDate.getFullYear();
        const orgId = updatedReg.organizationId;

        const activeRun = await prisma.payrollRun.findFirst({
          where: {
            organizationId: orgId,
            month,
            year,
            status: { in: ['Draft', 'Processing'] }
          }
        });

        if (activeRun) {
          await prisma.payrollRun.update({
            where: { id: activeRun.id },
            data: {
              needsRecalculation: true,
              recalculationReason: `Approved Regularization for ${updatedReg.employee?.firstName} on ${attendanceDate.toDateString()}`,
            }
          });
        }
      } catch (payrollErr) {
        console.error("Non-critical error updating payroll run for approval:", payrollErr);
      }
    }

    // 3. Send Email Notification to Employee
    try {
      await sendRegularizationStatusUpdateEmail({
        employeeEmail: updatedReg.employee?.email,
        date: updatedReg.date,
        type: updatedReg.type,
        status: updatedReg.status,
        remarks: updatedReg.remarks
      });
    } catch (emailErr) {
      console.error("Non-critical error sending status update email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error("Error processing attendance approval:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}