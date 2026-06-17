//src/app/api/payroll/compliance/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from '@/lib/auth-util';

// GET all compliance reports
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const reportType = searchParams.get('reportType');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    let filter = {};

    // SaaS PROTECTION: Admin restricted to their org
    if (authUser.role === "admin" && authUser.organizationId) {
        filter.organizationId = authUser.organizationId;
    }
    
    const rawReports = await prisma.complianceReport.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
    });

    let reports = rawReports.map(r => ({ _id: r.id, status: r.status, ...r.modelData, organizationId: r.organizationId }));

    if (reportType || status) {
        reports = reports.filter(r => {
            if (reportType && r.reportType !== reportType) return false;
            if (status && r.overallStatus !== status) return false;
            return true;
        });
    }

    // Since we sort by period.from in mongo, we simulate it here in JS if present
    reports.sort((a, b) => {
        const dateA = a.period?.from ? new Date(a.period.from).getTime() : 0;
        const dateB = b.period?.from ? new Date(b.period.from).getTime() : 0;
        return dateB - dateA; // descending
    });
    
    const total = reports.length;
    const paginated = reports.slice(skip, skip + limit);
    
    return NextResponse.json({
      complianceReports: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// CREATE new compliance report
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);
    
    const body = await request.json();
    
    // Generate unique report ID without race conditions
    const uniqueSuffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reportId = `COMP-${uniqueSuffix}`;
    
    const complianceReportRecord = await prisma.complianceReport.create({
        data: {
            organizationId: authUser.role === 'admin' ? authUser.organizationId : body.organizationId,
            status: "Active",
            modelData: {
                ...body,
                reportId
            }
        }
    });
    
    const complianceReport = {
        _id: complianceReportRecord.id,
        status: complianceReportRecord.status,
        ...complianceReportRecord.modelData,
        organizationId: complianceReportRecord.organizationId
    };
    
    return NextResponse.json(complianceReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
