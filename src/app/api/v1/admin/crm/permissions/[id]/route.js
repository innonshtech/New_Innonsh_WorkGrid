import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { logActivity } from "@/lib/logger";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const permission = await prisma.permission.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }],
      },
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Get permission error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check for duplicate slug if being updated
    if (body.slug) {
        const existingPermission = await prisma.permission.findFirst({
            where: {
                slug: body.slug,
                NOT: {
                    OR: [{ id: id }, { mongoId: id }]
                }
            }
        });
        if (existingPermission) {
        return NextResponse.json(
            { error: "Permission with this slug already exists" },
            { status: 400 }
        );
        }
    }

    const permission = await prisma.permission.update({
      where: {
        OR: [{ id: id }, { mongoId: id }],
      },
      data: body,
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    let performer = null;
    if (body.updatedBy) {
      performer = await prisma.user.findFirst({
        where: {
          OR: [{ id: body.updatedBy }, { mongoId: body.updatedBy }],
        },
      });
    }

    await logActivity({
      action: "updated",
      entity: "Permission",
      entityId: id,
      description: `Updated permission: ${permission.name}`,
      performedBy: {
        userId: body.updatedBy || "System",
        name: performer?.name || "Admin/User",
        email: performer?.email,
        role: performer?.role
      },
      req: request
    });

    return NextResponse.json(
      { message: "Permission updated successfully", permission },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update permission error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const permission = await prisma.permission.delete({
      where: {
        OR: [{ id: id }, { mongoId: id }],
      },
    });

    if (!permission) {
      return NextResponse.json(
        { error: "Permission not found" },
        { status: 404 }
      );
    }

    await logActivity({
      action: "deleted",
      entity: "Permission",
      entityId: id,
      description: `Deleted permission: ${permission.name}`,
      req: request
    });

    return NextResponse.json(
      { message: "Permission deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete permission error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}