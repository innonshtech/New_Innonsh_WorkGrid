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
    
    if (reportType) filter.reportType = reportType;
    if (status) filter.overallStatus = status;
    
    const complianceReports = await prisma.complianceReport.findMany({ where: filter })
      
      
      ;
    
    const total = await prisma.complianceReport.count({ where: filter });
    
    return NextResponse.json({
      complianceReports,
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
    
    const complianceReport = await prisma.complianceReport.create({ data: {
      ...body,
      reportId,
      organizationId: authUser.role === 'admin' ? authUser.organizationId : body.organizationId
    } });
    
    
    return NextResponse.json(complianceReport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
