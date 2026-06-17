import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    const token = request.cookies.get("employee_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error: JWT_SECRET missing' }, { status: 500 });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded || !decoded.id) {
       return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Find the employee using the ID from the token, which could be the new Prisma 'id' or a legacy 'mongoId'.
    const employee = await prisma.employee.findFirst({
      where: {
        OR: [
          { id: decoded.id },
          { mongoId: decoded.id }
        ]
      },
      select: {
        id: true // We only need the Prisma 'id' to link to attendance records
      }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or invalid ID in token" },
        { status: 404 }
      );
    }

    // Fetch attendance records for the found employee using their canonical Prisma 'id'
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id, // Assuming Attendance model has an 'employeeId' field that links to Employee.id
      },
      orderBy: {
        date: "desc", // Newest first
      },
    });

    return NextResponse.json({
      success: true,
      data: attendanceRecords,
    });

  } catch (error) {
    console.error("Attendance fetch error:", error);
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return NextResponse.json(
            { error: "Authentication failed: " + error.message },
            { status: 401 }
        );
    }
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}