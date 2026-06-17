import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    
    // An employee can only view their own logs
    const employee = await prisma.employee.findFirst({
        where: {
            OR: [
                { id: authUser.id },
                { mongoId: authUser.id },
                { email: authUser.email }
            ]
        },
        select: { id: true, mongoId: true }
    });

    if (!employee) {
        return NextResponse.json({ success: true, logs: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") || "newest";

    const skip = (page - 1) * limit;

    let filter = {
        userId: { in: [employee.id, employee.mongoId].filter(Boolean) }
    };

    if (action && action !== "all") {
        filter.action = action;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDay = new Date(dateTo);
        endDay.setHours(23, 59, 59, 999);
        filter.createdAt.lte = endDay;
      }
    }

    const rawLogs = await prisma.activityLog.findMany({
        where: filter,
        orderBy: { createdAt: sortBy === "oldest" ? "asc" : "desc" }
    });

    let logs = rawLogs.map(l => {
        const logDataObj = typeof l.logData === 'object' && l.logData !== null ? l.logData : {};
        return {
            _id: l.id,
            action: l.action,
            module: l.module,
            createdAt: l.createdAt,
            ...logDataObj
        };
    });

    // In-memory filter for Entity/Module if provided
    if (entity && entity !== "all") {
        const entityLower = entity.toLowerCase();
        logs = logs.filter(log => (log.entity || log.module || "").toLowerCase() === entityLower);
    }

    // In-memory filter for search terms
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => {
        const desc = (log.description || "").toLowerCase();
        const perfName = (log.performedBy?.name || "").toLowerCase();
        const perfEmail = (log.performedBy?.email || "").toLowerCase();
        const entId = (log.entityId || "").toLowerCase();
        return desc.includes(searchLower) ||
               perfName.includes(searchLower) ||
               perfEmail.includes(searchLower) ||
               entId.includes(searchLower);
      });
    }

    const total = logs.length;
    const paginated = logs.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      logs: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    const isAuthError = error.message.startsWith("Unauthorized");
    return NextResponse.json(
      { error: error.message },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

