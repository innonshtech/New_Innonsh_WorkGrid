import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    // Build the list of allowed employee IDs based on role
    let allowedEmployeeIds = [];
    if (authUser.role === 'employee' || authUser.role === 'attendance_only') {
      const emp = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: authUser.id },
            { mongoId: authUser.id },
            { email: authUser.email }
          ]
        }
      });
      if (!emp) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
      }
      allowedEmployeeIds = [emp.id];
    } else if (authUser.role === 'supervisor') {
      const supervisorEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: authUser.id },
            { mongoId: authUser.id },
            { email: authUser.email }
          ]
        }
      });
      const deptName = supervisorEmp?.department || authUser.department || "";
      const orgEmployees = await prisma.employee.findMany({
        where: { department: deptName }
      });
      allowedEmployeeIds = orgEmployees.map(e => e.id);
    } else {
      // admin, super_admin, hr
      const orgEmployees = await prisma.employee.findMany({
        where: authUser.organizationId ? { organizationId: authUser.organizationId } : {}
      });
      allowedEmployeeIds = orgEmployees.map(e => e.id);
    }

    // Determine target employee list
    let targetEmployeeIds = [...allowedEmployeeIds];
    if (employeeId) {
      const resolvedEmp = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
      });
      const resolvedId = resolvedEmp ? resolvedEmp.id : employeeId;
      if (!allowedEmployeeIds.includes(resolvedId)) {
        return NextResponse.json({ error: "Forbidden: Access is denied" }, { status: 403 });
      }
      targetEmployeeIds = [resolvedId];
    }

    // Fetch all attendance records
    const allAttendance = await prisma.attendance.findMany();

    // Fetch employee data for hydration
    const allEmployees = await prisma.employee.findMany();
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    const employeeMongoMap = new Map(allEmployees.filter(e => e.mongoId).map(e => [e.mongoId, e]));

    // In-memory filter and map
    let attendance = allAttendance.filter(record => {
      const emp = employeeMap.get(record.employeeId) || employeeMongoMap.get(record.employeeId);
      if (!emp || !targetEmployeeIds.includes(emp.id)) return false;

      if (startDate || endDate) {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
      }
      return true;
    }).map(record => {
      const emp = employeeMap.get(record.employeeId) || employeeMongoMap.get(record.employeeId);
      return {
        _id: record.id,
        id: record.id,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workedHours: record.workedHours,
        totalHours: record.totalHours,
        overtimeHours: record.overtimeHours,
        notes: record.notes,
        employee: emp ? {
          _id: emp.id,
          id: emp.id,
          employeeId: emp.employeeId,
          personalDetails: emp.personalDetails && typeof emp.personalDetails === 'object' ? emp.personalDetails : { firstName: emp.firstName, lastName: emp.lastName, email: emp.email },
          jobDetails: { department: emp.department, designation: emp.designation }
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      attendance,
      count: attendance.length
    }, { status: 200 });

  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
