import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    
    const user = await getAuthUser();
    
    if (!['super_admin', 'admin'].includes(user.role)) {
      return ApiResponse.forbidden();
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, permissions, isActive } = body;

    const role = await prisma.role.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!role) {
      return ApiResponse.notFound('Role not found');
    }

    // Ensure they have permission to edit this role
    if (user.role !== 'super_admin' && role.organizationId?.toString() !== user.organizationId?.toString()) {
      return ApiResponse.forbidden('You cannot edit roles outside your organization');
    }

    // Prevent modifying system roles
    if (role.isSystemRole) {
      // Allow modifying permissions of system role if super admin, else block completely
      if (user.role !== 'super_admin') {
         return ApiResponse.forbidden('System roles cannot be modified');
      }
    }

    let updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions && Array.isArray(permissions)) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedRole = await prisma.role.update({
      where: { id: role.id },
      data: updateData
    });
    return ApiResponse.success({ role: updatedRole }, 200, 'Role updated successfully');

  } catch (error) {
    console.error('Error updating role:', error);
    return ApiResponse.error(error.message);
  }
}

export async function DELETE(req, { params }) {
  try {
    
    const user = await getAuthUser();
    
    if (!['super_admin', 'admin'].includes(user.role)) {
      return ApiResponse.forbidden();
    }

    const { id } = await params;
    const role = await prisma.role.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    
    if (!role) {
      return ApiResponse.notFound('Role not found');
    }

    // Check permissions
    if (user.role !== 'super_admin' && role.organizationId?.toString() !== user.organizationId?.toString()) {
      return ApiResponse.forbidden('You cannot delete roles outside your organization');
    }

    if (role.isSystemRole) {
      return ApiResponse.forbidden('System roles cannot be deleted');
    }

    await prisma.role.delete({ where: { id: (await prisma.role.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });
    return ApiResponse.success({}, 200, 'Role deleted successfully');

  } catch (error) {
    console.error('Error deleting role:', error);
    return ApiResponse.error(error.message);
  }
}
