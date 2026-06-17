import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug || !body.module) {
      return NextResponse.json(
        { error: "Name, slug, and module are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existingPermission = await prisma.permission.findFirst({
      where: { slug: body.slug },
    });
    if (existingPermission) {
      return NextResponse.json(
        { error: "Permission with this slug already exists" },
        { status: 400 }
      );
    }

    const permission = await prisma.permission.create({
      data: body,
    });

    // Fetch createdBy user if available
    let performer = null;
    if (body.createdBy) {
      performer = await prisma.user.findFirst({
        where: {
          OR: [{ id: body.createdBy }, { mongoId: body.createdBy }]
        },
        select: {
          id: true, // Select ID to ensure it exists for `userId` in log
          name: true,
          email: true,
          role: true
        }
      });
    }

    await logActivity({
      action: "created",
      entity: "Permission",
      entityId: permission.id,
      description: `Created permission: ${permission.name} (${permission.slug})`,
      performedBy: {
        userId: performer?.id || body.createdBy || null,
        name: performer?.name || "Admin/User",
        email: performer?.email,
        role: performer?.role
      },
      details: {
        module: permission.module
      },
      req: request
    });

    return NextResponse.json(
      { message: "Permission created successfully", permission },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create permission error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const module = searchParams.get("module") || "";

    // Build Prisma where clause
    let prismaWhere = {};
    
    if (search) {
      prismaWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        // Add other fields if $text search applied to them in Mongoose
        // { description: { contains: search, mode: 'insensitive' } } 
      ];
    }
    
    if (module && module !== "all") {
      prismaWhere.module = module;
    }

    // If limit is -1, return all (for dropdowns)
    if (limit === -1) {
         const permissions = await prisma.permission.findMany({
             where: prismaWhere,
             orderBy: [{ module: 'asc' }, { name: 'asc' }],
         });
         return NextResponse.json({ data: permissions });
    }

    const permissions = await prisma.permission.findMany({
      where: prismaWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.permission.count({
      where: prismaWhere,
    });

    return NextResponse.json({
      data: permissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}