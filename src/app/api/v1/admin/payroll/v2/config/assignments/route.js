import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET employee salary assignments
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const orgId = authUser.organizationId;

    const where = { organizationId: orgId };
    if (employeeId) where.employeeId = employeeId;

    const assignments = await prisma.payrollEmployeeSalary.findMany({
      where,
      include: { template: { include: { components: true } } },
      orderBy: { effectiveFrom: 'desc' }
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST assign salary structure to employee
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const orgId = authUser.organizationId;

    const { 
      employeeId, 
      templateId, 
      ctc, 
      effectiveFrom, 
      revisionReason,
      basicSalary: reqBasic,
      grossSalary: reqGross,
      componentValues: reqComponentValues,
      payslipStructure: reqPayslipStructure
    } = body;

    if (!employeeId || !ctc) {
      return NextResponse.json({ error: "employeeId and ctc are required" }, { status: 400 });
    }

    // Resolve templateId — if not provided in body, check if employee already has one, or find default
    let resolvedTemplateId = templateId;
    if (!resolvedTemplateId) {
      const existing = await prisma.payrollEmployeeSalary.findFirst({
        where: { employeeId, organizationId: orgId, status: 'Active' }
      });
      if (existing) {
        resolvedTemplateId = existing.templateId;
      } else {
        let defaultTemp = await prisma.payrollSalaryTemplate.findFirst({
          where: { organizationId: orgId, isActive: true, isDefault: true }
        }) || await prisma.payrollSalaryTemplate.findFirst({
          where: { organizationId: orgId, isActive: true }
        });
        
        if (!defaultTemp) {
          defaultTemp = await prisma.payrollSalaryTemplate.create({
            data: {
              name: 'Standard Structure',
              description: 'Auto-generated standard salary template',
              organizationId: orgId,
              isDefault: true,
              isActive: true,
            }
          });
        }
        resolvedTemplateId = defaultTemp?.id;
      }
    }

    if (!resolvedTemplateId) {
      return NextResponse.json({ error: "Failed to resolve or create a salary template." }, { status: 500 });
    }

    // Load the template and its components
    const template = await prisma.payrollSalaryTemplate.findUnique({
      where: { id: resolvedTemplateId },
      include: { components: true }
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Load component masters for this org
    const masters = await prisma.payrollComponentMaster.findMany({
      where: {
        organizationId: orgId,
        isActive: true
      }
    });

    const masterMap = {};
    masters.forEach(m => { masterMap[m.code] = m; });

    let basicSalary = 0;
    let grossSalary = 0;
    let componentValues = {};

    if (reqComponentValues) {
      // Use client-provided custom component values directly!
      componentValues = { ...reqComponentValues };
      basicSalary = reqBasic || Number(componentValues['BASIC'] || 0);
      grossSalary = reqGross || 0;
      
      // Calculate gross salary from earnings components in componentValues
      for (const [code, val] of Object.entries(componentValues)) {
        const master = masterMap[code];
        if (master && master.isPartOfGross && master.category === 'EARNING') {
          if (master.code !== 'BASIC') {
            grossSalary += Number(val);
          }
        }
      }
      grossSalary += basicSalary;
    } else {
      // Calculate component values from CTC using formulas
      const monthlyCTC = ctc / 12;

      // First pass: calculate BASIC (50% of CTC by default)
      for (const tc of template.components) {
        const master = masterMap[tc.componentCode];
        if (!master) continue;

        const config = tc.overrideFormula || master.formulaConfig || {};

        if (master.code === 'BASIC') {
          if (master.formulaType === 'PERCENTAGE' && config.percentageOf === 'CTC') {
            basicSalary = Math.round((ctc * (config.percentage || 50)) / 100 / 12);
          } else if (master.formulaType === 'FIXED' && config.fixedAmount) {
            basicSalary = config.fixedAmount;
          } else {
            basicSalary = Math.round(monthlyCTC * 0.5);
          }
          componentValues['BASIC'] = basicSalary;
        }
      }

      if (!basicSalary) basicSalary = Math.round(monthlyCTC * 0.5);
      componentValues['BASIC'] = basicSalary;

      // Second pass: calculate dependent components
      for (const tc of template.components) {
        const master = masterMap[tc.componentCode];
        if (!master || master.code === 'BASIC') continue;

        const config = tc.overrideFormula || master.formulaConfig || {};

        let value = 0;
        if (master.formulaType === 'PERCENTAGE') {
          const base = config.percentageOf === 'CTC' ? monthlyCTC
            : config.percentageOf === 'GROSS' ? grossSalary
            : basicSalary; // default: percentage of BASIC
          value = Math.round((base * (config.percentage || 0)) / 100);
        } else if (master.formulaType === 'FIXED') {
          value = config.fixedAmount || 0;
        } else {
          value = 0;
        }

        componentValues[master.code] = value;

        if (master.isPartOfGross && master.category === 'EARNING') {
          grossSalary += value;
        }
      }

      grossSalary += basicSalary;
    }

    // Supersede any existing active assignment
    await prisma.payrollEmployeeSalary.updateMany({
      where: {
        employeeId,
        organizationId: orgId,
        status: 'Active'
      },
      data: { status: 'Superseded' }
    });

    const assignment = await prisma.payrollEmployeeSalary.create({
      data: {
        employeeId,
        organizationId: orgId,
        templateId: resolvedTemplateId,
        ctc,
        basicSalary,
        grossSalary,
        componentValues,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        revisionReason: revisionReason || 'Joining',
        status: 'Active',
        createdById: authUser.id
      }
    });

    // Save payslipStructure to employee
    let payslipStructureToSave = reqPayslipStructure;
    if (!payslipStructureToSave) {
      // Build one if not provided
      const earnings = [];
      const deductions = [];
      
      for (const [code, val] of Object.entries(componentValues)) {
        const master = masterMap[code];
        if (!master) continue;
        
        const item = {
          code,
          name: master.name,
          enabled: val > 0,
          calculationType: master.formulaType === 'PERCENTAGE' ? 'percentage' : 'fixed',
          percentage: master.formulaType === 'PERCENTAGE' ? (master.formulaConfig?.percentage || 0) : 0,
          fixedAmount: master.formulaType === 'PERCENTAGE' ? 0 : val
        };
        
        if (master.category === 'EARNING') {
          earnings.push(item);
        } else if (master.category === 'DEDUCTION') {
          deductions.push(item);
        }
      }
      
      payslipStructureToSave = {
        basicSalary,
        grossSalary,
        ctc,
        earnings,
        deductions
      };
    }

    // Also update the employee's payslipStructure and statutory fields for backward compatibility
    const employeeDataToUpdate = {
      payslipStructure: payslipStructureToSave
    };

    if (body.pfApplicable !== undefined) employeeDataToUpdate.pfApplicable = body.pfApplicable;
    if (body.esicApplicable !== undefined) employeeDataToUpdate.esicApplicable = body.esicApplicable;
    if (body.isTDSApplicable !== undefined) employeeDataToUpdate.isTDSApplicable = body.isTDSApplicable;
    if (body.gratuityApplicable !== undefined) employeeDataToUpdate.gratuityApplicable = body.gratuityApplicable;
    if (body.hraApplicable !== undefined) employeeDataToUpdate.hraApplicable = body.hraApplicable;

    await prisma.employee.update({
      where: { id: employeeId },
      data: employeeDataToUpdate
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
