import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";
import * as XLSX from "xlsx";

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const row of data) {
      try {
        const {
          "Employee Code": employeeCode,
          "Date": dateStr,
          "Status": status,
          "Check In": checkInStr,
          "Check Out": checkOutStr,
        } = row;

        if (!employeeCode || !dateStr || !status) {
          failedCount++;
          errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
          continue;
        }

        const employee = await prisma.employee.findFirst({
          where: { employeeId: employeeCode }
        });

        if (!employee) {
          failedCount++;
          errors.push(`Employee not found: ${employeeCode}`);
          continue;
        }

        // Check if attendance already exists for this date
        const parsedDateForRange = new Date(dateStr);
        const startOfDay = new Date(parsedDateForRange.getFullYear(), parsedDateForRange.getMonth(), parsedDateForRange.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(parsedDateForRange.getFullYear(), parsedDateForRange.getMonth(), parsedDateForRange.getDate(), 23, 59, 59, 999);

        const existingRecord = await prisma.attendance.findFirst({
          where: {
            employeeId: employee.id, // Assuming employee.id is the Prisma ID for the linked Employee
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (existingRecord) {
          failedCount++;
          errors.push(`Attendance already exists for ${employeeCode} on ${dateStr}`);
          continue;
        }

        let totalHours = 0;
        if (checkInStr && checkOutStr) {
           const inTime = new Date(checkInStr);
           const outTime = new Date(checkOutStr);
           const diffMs = outTime - inTime;
           totalHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        await prisma.attendance.create({
          data: {
            employeeId: employee.id, // Link to the employee's ID
            date: new Date(dateStr),
            status,
            checkIn: checkInStr ? new Date(checkInStr) : null,
            checkOut: checkOutStr ? new Date(checkOutStr) : null,
            totalHours,
            attendanceMethod: "Excel Import",
          },
        });

        successCount++;
      } catch (rowError) {
        failedCount++;
        errors.push(`Error processing row: ${rowError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete. ${successCount} successful, ${failedCount} failed.`,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error("IMPORT ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}