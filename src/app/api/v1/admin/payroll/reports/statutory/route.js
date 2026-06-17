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
        reportData = await generateESICReport(month, year);
        break;
      case 'PT':
        reportData = await generatePTReport(month, year);
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
      year: parseInt(year),
      isPFApplicable: true
    }
  });

  const pfGrouped = {};
  for (const p of payslips) {
    const empId = p.employeeId;
    const pfDetails = p.pfDetails || {};
    
    if (!pfGrouped[empId]) {
      pfGrouped[empId] = {
        _id: empId,
        totalEmployeeContribution: 0,
        totalEmployerContribution: 0,
        totalPensionContribution: 0
      };
    }
    pfGrouped[empId].totalEmployeeContribution += (pfDetails.employeeContribution || 0);
    pfGrouped[empId].totalEmployerContribution += (pfDetails.employerContribution || 0);
    pfGrouped[empId].totalPensionContribution += (pfDetails.pensionContribution || 0);
  }
  
  return Object.values(pfGrouped);
}

async function generateESICReport(month, year) {
  const payslips = await prisma.payslip.findMany({
    where: {
      month: parseInt(month),
      year: parseInt(year),
      isESICApplicable: true
    }
  });

  const esicGrouped = {};
  for (const p of payslips) {
    const empId = p.employeeId;
    const esicDetails = p.esicDetails || {};
    
    if (!esicGrouped[empId]) {
      esicGrouped[empId] = {
        _id: empId,
        totalEmployeeContribution: 0,
        totalEmployerContribution: 0
      };
    }
    esicGrouped[empId].totalEmployeeContribution += (esicDetails.employeeContribution || 0);
    esicGrouped[empId].totalEmployerContribution += (esicDetails.employerContribution || 0);
  }
  
  return Object.values(esicGrouped);
}

async function generatePTReport(month, year) {
  const payslips = await prisma.payslip.findMany({
    where: {
      month: parseInt(month),
      year: parseInt(year),
      isPTApplicable: true
    }
  });

  const ptGrouped = {};
  for (const p of payslips) {
    const empId = p.employeeId;
    
    if (!ptGrouped[empId]) {
      ptGrouped[empId] = {
        _id: empId,
        totalPTContribution: 0
      };
    }
    ptGrouped[empId].totalPTContribution += (p.professionalTax || 0);
  }
  
  return Object.values(ptGrouped);
}
