import prisma from '@/lib/db/prisma';

export async function GET(request) {
  try {
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    // Build the `where` clause for the Attendance query
    let attendanceWhere = {};

    // Date range filter
    if (startDate && endDate) {
      attendanceWhere.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // The 'session' object is assumed to be available in scope,
    // similar to how it was used in the original Mongoose code.
    // In a Next.js app with NextAuth, this might be `const session = await auth();`.
    // For the purpose of this refactor, it's used as is.
    // IMPORTANT: Replace this placeholder with actual session retrieval in your application.
    const session = { user: { role: 'Supervisor', department: 'HR' } };

    let finalEmployeeIdFilter = []; // This will hold the array of employee IDs to filter by

    // Step 1: Resolve the specific employeeId from search parameters, if provided.
    // This accounts for potential legacy MongoDB string IDs.
    let resolvedSpecificEmployeeId = null;
    if (employeeId) {
      const targetEmployee = await prisma.employee.findFirst({
        where: {
          OR: [{ id: employeeId }, { mongoId: employeeId }]
        },
        select: { id: true }
      });
      if (targetEmployee) {
        resolvedSpecificEmployeeId = targetEmployee.id;
      }
    }

    // Step 2: Determine employee IDs based on role-based access control.
    let roleBasedEmployeePrismaIds = [];
    if (session.user && session.user.role === 'Supervisor') {
      const employeesInDepartment = await prisma.employee.findMany({
        where: {
          jobDetails: {
            department: session.user.department
          }
        },
        select: {
          id: true
        }
      });
      roleBasedEmployeePrismaIds = employeesInDepartment.map(emp => emp.id);
    } else {
      // If not a Supervisor, the original Mongoose code implies `Employee.find({})`
      // (because `employeeQuery` would be empty), which fetches all employees.
      const allEmployees = await prisma.employee.findMany({ select: { id: true } });
      roleBasedEmployeePrismaIds = allEmployees.map(emp => emp.id);
    }

    // Step 3: Apply filter priority based on the original Mongoose overwrite logic.
    // If role-based filter yields results, it takes precedence and overwrites any specific employeeId filter.
    if (roleBasedEmployeePrismaIds.length > 0) {
      finalEmployeeIdFilter = roleBasedEmployeePrismaIds;
    } else if (resolvedSpecificEmployeeId) {
      // If no role-based employees (e.g., supervisor in an empty department),
      // but a specific employee ID was provided and found.
      finalEmployeeIdFilter = [resolvedSpecificEmployeeId];
    }
    // If neither condition is met (no role-based employees, AND no specific employee found or provided),
    // then `finalEmployeeIdFilter` remains an empty array. This will correctly result in no attendance records
    // when used with Prisma's `in: []`.

    // Apply the combined employee ID filter to attendanceWhere
    attendanceWhere.employeeId = { in: finalEmployeeIdFilter };

    // Fetch attendance data with related employee details
    const attendance = await prisma.attendance.findMany({
      where: attendanceWhere,
      include: {
        employee: { // 'employee' is the relation name in your Prisma schema
          select: {
            employeeId: true, // Assuming this maps to a specific employee ID from the legacy system
            personalDetails: true,
            jobDetails: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform data for response to match original output structure
    const transformedAttendance = attendance.map(record => ({
      id: record.id, // Prisma uses 'id' (a CUID/UUID or integer) instead of Mongoose's '_id'
      date: record.date,
      status: record.status,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      lateHours: record.lateHours,
      overtime: record.overtime,
      remarks: record.remarks,
      employee: record.employee ? {
        employeeId: record.employee.employeeId,
        personalDetails: record.employee.personalDetails,
        jobDetails: record.employee.jobDetails
      } : null
    }));

    return new Response(JSON.stringify({
      success: true,
      attendance: transformedAttendance,
      count: transformedAttendance.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Export API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}