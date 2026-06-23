import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET all salary templates
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = authUser.organizationId;

    const templates = await prisma.payrollSalaryTemplate.findMany({
      where: {
        organizationId: orgId,
        isActive: true
      },
      include: {
        components: true,
        _count: { select: { assignments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new salary template
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const orgId = authUser.organizationId;

    const { name, description, employeeType, isDefault, componentCodes } = body;

    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }

    // Create template
    const template = await prisma.payrollSalaryTemplate.create({
      data: {
        organizationId: orgId,
        name,
        description: description || '',
        employeeType: employeeType || 'FULL_TIME',
        isDefault: isDefault || false,
        isActive: true,
        createdById: authUser.id
      }
    });

    // Attach component mappings
    if (componentCodes && componentCodes.length > 0) {
      const componentMappings = componentCodes.map((code, idx) => ({
        templateId: template.id,
        componentCode: code,
        isMandatory: true,
        displayOrder: idx,
        isActive: true
      }));

      await prisma.payrollTemplateComponent.createMany({
        data: componentMappings
      });
    }

    // Reload with components
    const fullTemplate = await prisma.payrollSalaryTemplate.findUnique({
      where: { id: template.id },
      include: { components: true }
    });

    return NextResponse.json({ success: true, template: fullTemplate }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
