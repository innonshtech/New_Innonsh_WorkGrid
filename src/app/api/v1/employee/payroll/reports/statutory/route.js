import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const reportType = searchParams.get('type'); // PF, ESIC, PT
    
    // Generate statutory reports based on type
    let reportData = [];
    
    switch (reportType) {
      case 'PF':
        reportData = await generatePFReport(month, year);
        break;
      case 'ESIC':
        // Not implemented in legacy either, returning empty
        break;
      case 'PT':
        // Not implemented in legacy either, returning empty
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    
    return NextResponse.json({ report: reportData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generatePFReport(month, year) {
  const payslips = await prisma.payslip.findMany({
    where: {
      month: parseInt(month),
      year: parseInt(year)
    }
  });

  const pfDataMap = new Map();

  for (const slip of payslips) {
    if (slip.isPFApplicable) {
      const empId = slip.employeeId;
      if (!empId) continue;

      const pfDetails = slip.pfDetails || {};
      
      if (!pfDataMap.has(empId)) {
        pfDataMap.set(empId, {
          _id: empId,
          totalEmployeeContribution: 0,
          totalEmployerContribution: 0,
          totalPensionContribution: 0
        });
      }

      const existing = pfDataMap.get(empId);
      existing.totalEmployeeContribution += pfDetails.employeeContribution || 0;
      existing.totalEmployerContribution += pfDetails.employerContribution || 0;
      existing.totalPensionContribution += pfDetails.pensionContribution || 0;
    }
  }
  
  return Array.from(pfDataMap.values());
}
