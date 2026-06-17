import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
    
    const user = await prisma.user.findFirst({
        where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
    });

    if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      data: { ...userWithoutPassword, _id: user.id }
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
    
    const body = await request.json();

    const targetUser = await prisma.user.findFirst({
        where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] }
    });

    if (!targetUser) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { name: body.name }
    });

    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      data: { ...userWithoutPassword, _id: updatedUser.id },
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("PUT PROFILE ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
