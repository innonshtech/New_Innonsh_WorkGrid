import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin", "employee"]);

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const employeeId = searchParams.get("employeeId");

    let filter = {};

    if (authUser.role !== "super_admin") {
      if (authUser.role === "employee") {
        const emp = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
        if (emp) filter.employeeId = emp.id;
        else return NextResponse.json({ success: true, payslips: [] });
      } else {
        // SaaS PROTECTION
        // Admin gets their org's employees
        const myOrgEmployees = await prisma.employee.findMany({ where: { organizationId: authUser.organizationId }, select: { id: true, mongoId: true } });
        const myOrgEmployeeIds = myOrgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
        filter.employeeId = { in: myOrgEmployeeIds };
      }
    }

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    
    if (employeeId) {
        const emp = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }, { employeeId: employeeId }] } });
        if (emp) {
            if (filter.employeeId && filter.employeeId.in) {
                 if (filter.employeeId.in.includes(emp.id) || filter.employeeId.in.includes(emp.mongoId)) {
                     filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
                 } else {
                     return NextResponse.json({ success: true, payslips: [] });
                 }
            } else {
                filter.employeeId = { in: [emp.id, emp.mongoId].filter(Boolean) };
            }
        } else {
            return NextResponse.json({ success: true, payslips: [] });
        }
    }

    const payslipsDocs = await prisma.payslip.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' }
    });

    const empIds = [...new Set(payslipsDocs.map(p => p.employeeId))];
    const employees = await prisma.employee.findMany({
        where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
        select: { id: true, mongoId: true, employeeId: true, firstName: true, lastName: true, department: true }
    });

    const empMap = {};
    employees.forEach(e => {
        const data = {
            _id: e.id,
            employeeId: e.employeeId,
            personalDetails: { firstName: e.firstName, lastName: e.lastName },
            jobDetails: { department: e.department }
        };
        empMap[e.id] = data;
        if (e.mongoId) empMap[e.mongoId] = data;
    });

    const payslips = payslipsDocs.map(p => ({
        _id: p.id,
        ...p,
        employee: empMap[p.employeeId] || null,
        ...(typeof p.payslipData === 'object' && p.payslipData !== null ? p.payslipData : {})
    }));

    return NextResponse.json({ success: true, payslips });
  } catch (error) {
    console.error("GET PAYSLIPS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);

    const body = await request.json();
    const { 
      employee, 
      month, 
      year, 
      basicSalary, 
      earnings, 
      deductions, 
      grossSalary, 
      totalDeductions, 
      netSalary, 
      workingDays, 
      presentDays, 
      leaveDays, 
      paidLeaveDays, 
      unpaidLeaveDays, 
      overtimeHours, 
      overtimeAmount, 
      notes, 
      organizationName, 
      salaryType 
    } = body;

    const empId = employee || body.employeeId;

    if (!empId || !month || !year || basicSalary === undefined || grossSalary === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot generate payslip for future months." 
      }, { status: 400 });
    }

    const formattedEarnings = (earnings || []).map(e => ({
      type: e.type || e.name || 'Other',
      amount: e.amount || 0,
      percentage: e.percentage || 0,
      calculationType: e.calculationType || 'percentage'
    }));

    const formattedDeductions = (deductions || []).map(d => ({
      type: d.type || d.name || 'Other',
      amount: d.amount || 0,
      percentage: d.percentage || 0,
      calculationType: d.calculationType || 'percentage'
    }));

    const employeeRecord = await prisma.employee.findFirst({
        where: { OR: [{ id: empId }, { mongoId: empId }, { employeeId: empId }] }
    });

    if (!employeeRecord) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const targetEmpId = employeeRecord.id;

    const existing = await prisma.payslip.findFirst({
      where: {
          OR: [{ employeeId: targetEmpId }, { employeeId: employeeRecord.mongoId || 'none' }],
          month: parseInt(month),
          year: parseInt(year),
          status: { not: "Cancelled" },
      }
    });

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: "DUPLICATE_PAYSLIP", 
        message: "Payslip already exists for this period",
        existingPayslipId: existing.id
      }, { status: 400 });
    }

    let orgName = organizationName || employeeRecord.organizationId;
    let orgId = employeeRecord.organizationId || authUser.organizationId;
    if (!orgName) orgName = "Unknown Organization";
    
    const payslip = await prisma.payslip.create({
        data: {
            employeeId: targetEmpId,
            month: parseInt(month),
            year: parseInt(year),
            grossSalary: Number(grossSalary),
            netSalary: Number(netSalary),
            status: "Generated",
            payslipData: {
              basicSalary,
              earnings: formattedEarnings,
              deductions: formattedDeductions,
              totalDeductions,
              workingDays: workingDays || 30,
              presentDays: presentDays || 30,
              leaveDays: leaveDays || 0,
              paidLeaveDays: paidLeaveDays || 0,
              unpaidLeaveDays: unpaidLeaveDays || 0,
              overtimeHours: overtimeHours || 0,
              overtimeAmount: overtimeAmount || 0,
              notes: notes || "",
              organizationId: orgId,
              organizationName: orgName,
              salaryType: salaryType || employeeRecord.payslipStructure?.salaryType || "monthly",
              generatedBy: authUser.id,
              payslipId: `PSL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            }
        }
    });

    return NextResponse.json({ success: true, payslip: { ...payslip, _id: payslip.id } }, { status: 201 });
  } catch (error) {
    console.error("POST PAYSLIPS ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
