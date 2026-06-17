import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validateRequest } from "@/lib/middleware/validate";
import { ChangePasswordSchema } from "@/lib/validations";

const JWT_SECRET = process.env.JWT_SECRET;

export const PUT = validateRequest(ChangePasswordSchema, async (request, context, validatedData) => {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error: JWT_SECRET missing' }, { status: 500 });
    }

    // 1. Get Token
    const token = request.cookies.get("authToken")?.value || request.cookies.get("employee_token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    // 2. Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid session. Please login again." },
        { status: 401 }
      );
    }

    const employeeId = decoded.id;
    const { currentPassword, newPassword } = validatedData;

    // 4. Find Employee & Verify Current Password
    const employee = await prisma.employee.findFirst({
        where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    if (!employee.password) {
        return NextResponse.json({ error: "Password not set for this account." }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, employee.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password." },
        { status: 400 }
      );
    }

    // 5. Update Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.employee.update({
        where: { id: employee.id },
        data: { password: hashedPassword }
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });

  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the password." },
      { status: 500 }
    );
  }
});
