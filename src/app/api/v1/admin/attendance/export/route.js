import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const organizationId = searchParams.get('organizationId') || authUser.organizationId;

    let where = {};
    
    // SaaS PROTECTION: Restrict data by organization
    if (authUser.role !== "super_admin" || (authUser.role === "super_admin" && organizationId)) {
      const orgId = organizationId || authUser.organizationId;
      
      const orgEmployees = await prisma.employee.findMany({
        where: {
          organizationId: orgId
        },
        select: {
          id: true,
        },
      });

      const employeePrismaIds = orgEmployees.map(e => e.id);
      where.employeeId = { in: employeePrismaIds };
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            mongoId: true,
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Prepare data for Excel
    const excelData = attendance.map(record => ({
      "Employee ID": record.employee?.employeeId || "N/A",
      "Employee Name": record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : "N/A",
      "Date": new Date(record.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }),
      "Status": record.status,
      "Check In": record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) : "N/A",
      "Check Out": record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) : "N/A",
      "Total Hours": record.totalHours || 0,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=attendance.xlsx",
      },
    });

  } catch (error) {
    console.error("EXPORT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}