import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth-util';
import { ApiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const authUser = await getAuthUser();
    
    if (!['admin', 'super_admin'].includes(authUser.role)) {
      return ApiResponse.forbidden('Insufficient permissions');
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    const templatesDocs = await prisma.template.findMany({
        where: { organizationId: authUser.organizationId },
        orderBy: { createdAt: 'desc' }
    });

    let templates = templatesDocs.map(t => {
        const td = typeof t.templateData === 'object' && t.templateData !== null ? t.templateData : {};
        return {
            _id: t.id,
            name: t.name,
            organizationId: t.organizationId,
            ...td,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
        };
    });

    if (type) {
        templates = templates.filter(t => t.type === type);
    }

    return ApiResponse.success({ templates });
  } catch (error) {
    console.error('Fetch Templates Error:', error);
    return ApiResponse.error('Failed to fetch templates');
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser();
    
    if (!['admin', 'super_admin'].includes(authUser.role)) {
      return ApiResponse.forbidden('Insufficient permissions');
    }

    const body = await req.json();
    const { name, type, subject, content, isDefault } = body;

    if (!name || !type || !content) {
      return ApiResponse.badRequest('Name, type, and content are required');
    }

    if (isDefault) {
      const allOrgTemplates = await prisma.template.findMany({
          where: { organizationId: authUser.organizationId }
      });
      for (const t of allOrgTemplates) {
          const td = typeof t.templateData === 'object' && t.templateData !== null ? t.templateData : {};
          if (td.type === type && td.isDefault === true) {
              await prisma.template.update({
                  where: { id: t.id },
                  data: {
                      templateData: {
                          ...td,
                          isDefault: false
                      }
                  }
              });
          }
      }
    }

    const newTemplate = await prisma.template.create({
      data: {
          organizationId: authUser.organizationId,
          name,
          templateData: {
              type,
              subject,
              content,
              isDefault: isDefault || false,
              createdBy: authUser.id
          }
      }
    });

    const template = {
        _id: newTemplate.id,
        name: newTemplate.name,
        organizationId: newTemplate.organizationId,
        ...(typeof newTemplate.templateData === 'object' && newTemplate.templateData !== null ? newTemplate.templateData : {})
    };

    return ApiResponse.success({ template }, 201, 'Template saved successfully');
  } catch (error) {
    console.error('Create Template Error:', error);
    return ApiResponse.error(error.message);
  }
}
