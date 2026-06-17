import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["super_admin"]);

    

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

    let filter = {};

    if (action && action !== "all") {
      filter.action = action;
    }

    if (entity) {
      filter.module = entity;
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

    // Map and filter logs in-memory for JSON structure search
    let logs = rawLogs.map(log => ({
      _id: log.id,
      action: log.action,
      module: log.module,
      createdAt: log.createdAt,
      ...(log.logData || {})
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => {
        const desc = (log.description || '').toLowerCase();
        const perfName = (log.performedBy?.name || '').toLowerCase();
        const perfEmail = (log.performedBy?.email || '').toLowerCase();
        const entId = (log.entityId || '').toLowerCase();
        return desc.includes(searchLower) ||
               perfName.includes(searchLower) ||
               perfEmail.includes(searchLower) ||
               entId.includes(searchLower);
      });
    }

    const total = logs.length;
    const paginatedLogs = logs.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching super admin logs:", error);
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ message: error.message }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
