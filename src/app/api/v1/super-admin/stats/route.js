import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';


import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(req) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["super_admin"]);

    

    const [totalOrganizations, activeOrganizations, totalEmployees, pendingApprovals] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "Active" } }),
      prisma.user.count({ where: { role: { not: "super_admin" } } }),
      prisma.user.count({ where: { status: "pending" } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalOrganizations,
        activeOrganizations,
        totalEmployees,
        pendingApprovals
      }
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
