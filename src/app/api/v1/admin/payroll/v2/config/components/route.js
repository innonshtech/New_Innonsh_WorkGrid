import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

// GET all salary components for this org
export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = authUser.organizationId;

    const components = await prisma.payrollComponentMaster.findMany({
      where: {
        organizationId: orgId,
        isActive: true
      },
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, components });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create a new salary component
export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const orgId = authUser.organizationId;

    const {
      code, name, category, subCategory,
      formulaType, formulaConfig, dependsOn,
      isTaxable, isPartOfGross, isPartOfCTC,
      isPFWageComponent, isESIWageComponent,
      displayOrder
    } = body;

    if (!code || !name || !category || !formulaType) {
      return NextResponse.json({ error: "code, name, category, formulaType are required" }, { status: 400 });
    }

    // Check duplicate code for same org
    const existing = await prisma.payrollComponentMaster.findFirst({
      where: {
        organizationId: orgId,
        code: code.toUpperCase(),
        isActive: true
      }
    });

    if (existing) {
      return NextResponse.json({ error: `Component with code '${code}' already exists` }, { status: 409 });
    }

    const component = await prisma.payrollComponentMaster.create({
      data: {
        organizationId: orgId,
        code: code.toUpperCase(),
        name,
        category,
        subCategory: subCategory || 'FIXED',
        formulaType: formulaType || 'FIXED',
        formulaConfig: formulaConfig || {},
        dependsOn: dependsOn || [],
        isTaxable: isTaxable !== undefined ? isTaxable : true,
        isPartOfGross: isPartOfGross !== undefined ? isPartOfGross : (category === 'EARNING'),
        isPartOfCTC: isPartOfCTC !== undefined ? isPartOfCTC : true,
        isPFWageComponent: isPFWageComponent || false,
        isESIWageComponent: isESIWageComponent || false,
        displayOrder: displayOrder || 0,
        isActive: true,
        createdById: authUser.id
      }
    });

    return NextResponse.json({ success: true, component }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT update a component
export async function PUT(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Component id is required" }, { status: 400 });
    }

    // Verify org ownership
    const existing = await prisma.payrollComponentMaster.findUnique({ where: { id } });
    if (!existing || (authUser.role === 'admin' && existing.organizationId !== authUser.organizationId)) {
      return NextResponse.json({ error: "Component not found or unauthorized" }, { status: 404 });
    }

    if (updateData.code) updateData.code = updateData.code.toUpperCase();

    const component = await prisma.payrollComponentMaster.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, component });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE (soft-delete by deactivating)
export async function DELETE(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Component id is required" }, { status: 400 });
    }

    const existing = await prisma.payrollComponentMaster.findUnique({ where: { id } });
    if (!existing || (authUser.role === 'admin' && existing.organizationId !== authUser.organizationId)) {
      return NextResponse.json({ error: "Component not found or unauthorized" }, { status: 404 });
    }

    await prisma.payrollComponentMaster.update({
      where: { id },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: "Component deactivated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
