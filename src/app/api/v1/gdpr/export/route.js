import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const authUser = await getAuthUser();
    
    // For GDPR, users should be able to request their own data.
    // If admin, they might request the org data.
    const isOrgLevelExport = req.nextUrl.searchParams.get('scope') === 'organization';

    if (isOrgLevelExport) {
      if (!['admin', 'super_admin'].includes(authUser.role)) {
        return ApiResponse.forbidden('Only admins can export organizational data');
      }
      
      const orgId = authUser.organizationId;
      if (!orgId) return ApiResponse.badRequest('No organization associated with this admin');
      
      const [organization, employees, users] = await Promise.all([
        prisma.organization.findFirst({ where: { OR: [{ id: orgId }, { mongoId: orgId }] } }),
        prisma.employee.findMany({ where: { organizationId: orgId } }),
        prisma.user.findMany({ where: { organizationId: orgId } })
      ]);

      // Strip passwords from users list
      const admins = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });

      const exportData = {
        generatedAt: new Date().toISOString(),
        organization,
        personnel: { admins, employees }
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="org_data_export_${orgId}_${Date.now()}.json"`,
        },
      });
    }

    // Individual User/Employee Export
    let personalData = null;
    if (['admin', 'super_admin', 'recruiter'].includes(authUser.role)) {
       const user = await prisma.user.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
       if (user) {
         const { password, ...rest } = user;
         personalData = rest;
       }
    } else {
       personalData = await prisma.employee.findFirst({ where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] } });
    }

    const exportData = {
      generatedAt: new Date().toISOString(),
      personalData,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="personal_data_export_${authUser.id}_${Date.now()}.json"`,
      },
    });

  } catch (error) {
    console.error('GDPR Export Error:', error);
    return ApiResponse.error(error.message);
  }
}
