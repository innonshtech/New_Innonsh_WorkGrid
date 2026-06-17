// src/app/api/v1/test-approvals/route.js
import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function GET() {
  try {
    const authUser = await getAuthUser();
    
    let currentEmployeeId = authUser.id;
    let mappedVia = "none";
    let userRec = null;
    let emp = await prisma.employee.findFirst({ 
      where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] },
      select: { id: true, mongoId: true }
    });
    
    if (emp) {
        mappedVia = "employeeObjId";
        currentEmployeeId = emp.mongoId || emp.id;
    } else {
        userRec = await prisma.user.findFirst({ 
          where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] },
          select: { employeeId: true, email: true, role: true }
        });
        if (userRec) {
            let mappedEmp = null;
            if (userRec.employeeId) {
                mappedEmp = await prisma.employee.findFirst({ 
                  where: { employeeId: userRec.employeeId },
                  select: { id: true, mongoId: true }
                });
                if (mappedEmp) mappedVia = "userEmployeeId";
            }
            if (!mappedEmp && userRec.email) {
                mappedEmp = await prisma.employee.findFirst({ 
                  where: { email: userRec.email },
                  select: { id: true, mongoId: true }
                });
                if (mappedEmp) mappedVia = "userEmail";
            }
            if (mappedEmp) currentEmployeeId = mappedEmp.mongoId || mappedEmp.id;
        }
    }

    const testQuery = { approver: currentEmployeeId };

    // In Prisma, AttendanceRegularization modelData has model details or relation
    const requests = await prisma.attendanceRegularization.findMany({ where: {} });
    
    return NextResponse.json({
        success: true,
        authUserId: authUser.id,
        authUserRole: authUser.role,
        userRecEmail: userRec?.email,
        computedEmployeeId: currentEmployeeId,
        mappedVia,
        allRequestsCount: requests.length,
        actualRequestsInDb: requests.map(r => ({
            id: r.id,
            approverId: r.modelData && typeof r.modelData === "object" ? r.modelData.approver : null
        })),
        matchTestQuery: 0 // Stubbed since we do in-memory filtering for schema consistency
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
