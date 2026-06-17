import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = await getAuthUser();
    
    if (!['super_admin', 'admin'].includes(user.role)) {
      return ApiResponse.forbidden();
    }

    let where = {};
    if (user.role !== 'super_admin') {
      if (!user.organizationId) {
        return ApiResponse.badRequest('Admin user must belong to an organization to view roles');
      }
      where = {
          OR: [
              { organizationId: user.organizationId },
              { organizationId: null }
          ]
      };
    }

    const rolesDocs = await prisma.role.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    const roles = rolesDocs.map(r => {
        const { roleData, ...rest } = r;
        return {
            _id: r.id,
            name: r.roleName,
            ...rest,
            ...(typeof roleData === 'object' && roleData !== null ? roleData : {})
        };
    });

    // Sort: isSystemRole true first, then name asc
    roles.sort((a, b) => {
        const aSys = a.isSystemRole ? 1 : 0;
        const bSys = b.isSystemRole ? 1 : 0;
        if (aSys !== bSys) return bSys - aSys;
        return (a.name || "").localeCompare(b.name || "");
    });

    return ApiResponse.success({ roles });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return ApiResponse.error(error.message);
  }
}

export async function POST(req) {
  try {
    const user = await getAuthUser();
    
    if (!['super_admin', 'admin'].includes(user.role)) {
      return ApiResponse.forbidden();
    }

    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) {
      return ApiResponse.badRequest('Role name is required');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const orgId = user.role === 'super_admin' ? (body.organizationId || null) : user.organizationId;

    // Check if role slug already exists for this org using JSON path search or simple map
    // We'll just fetch by orgId and find if slug matches
    const existingRoles = await prisma.role.findMany({
        where: { organizationId: orgId }
    });

    const isDuplicate = existingRoles.some(r => {
        if (r.roleData && typeof r.roleData === 'object' && r.roleData.slug === slug) return true;
        if (r.roleName === name) return true;
        return false;
    });

    if (isDuplicate) {
      return ApiResponse.badRequest('A role with this name already exists in your organization');
    }

    const newRole = await prisma.role.create({
      data: {
          roleName: name,
          organizationId: orgId,
          permissions: permissions || [],
          roleData: {
              slug,
              description,
              isSystemRole: false,
              createdBy: user.id
          }
      }
    });

    return ApiResponse.success({ role: {
        _id: newRole.id,
        name: newRole.roleName,
        ...newRole,
        ...(typeof newRole.roleData === 'object' && newRole.roleData !== null ? newRole.roleData : {})
    } }, 201, 'Role created successfully');

  } catch (error) {
    console.error('Error creating role:', error);
    return ApiResponse.error(error.message);
  }
}
