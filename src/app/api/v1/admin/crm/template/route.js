// api/crm/template/route.js
import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'; // Rule 1: Replace dbConnect with prisma
// Rule 3: Remove Mongoose model imports (Template, User)
import { logActivity } from '@/lib/logger';

// Get all templates for user
export async function GET(request) {
  try {
    // Rule 2: Remove 

    // Rule 4: Replace prisma.template.findMany() with prisma.template.findMany()
    const templates = await prisma.template.findMany();
    console.log(templates);

    return NextResponse.json({
     success: true,
      data: templates,
    }, { status: 200 })

  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new template
export async function POST(request) {
  try {
    // Rule 2: Remove 
    const templateData = await request.json()

    console.log(templateData);


    // TODO: Add authentication - you need to get the user ID from the session/token
    // For now, I'll use a placeholder. You should replace this with actual auth logic.
    const createdBy = templateData.createdBy || '6923fc13158ac11b5f1d88e3'; // Replace with actual user ID

    // If setting as default, remove default from other templates
    if (templateData.isDefault) {
      // Rule 4: Replace Mongoose updateMany with Prisma updateMany
      await prisma.template.updateMany({
        where: {
          createdBy: createdBy,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Rule 4: Replace Mongoose create method with Prisma create method
    const template = await prisma.template.create({
      data: {
        ...templateData,
        createdBy: createdBy,
        isActive: true,
        // createdAt and updatedAt are automatically handled by Prisma if your schema has @updatedAt and @createdAt
      }
    });

    // Rule 4 & 5: Replace prisma.user.findFirst({ where: { OR: [{ id: createdBy }, { mongoId: createdBy }] } }) with Prisma findFirst and OR condition for ID
    const performer = await prisma.user.findFirst({
      where: {
        OR: [{ id: createdBy }, { mongoId: createdBy }]
      }
    });

    await logActivity({
      action: "created",
      entity: "Template",
      entityId: template.id, // Mongoose _id becomes Prisma id
      description: `Created payslip template: ${template.name}`,
      performedBy: {
        userId: createdBy, // This remains the ID used for lookup
        name: performer?.name || "Admin/User",
        email: performer?.email,
        role: performer?.role
      },
      req: request
    });

    return NextResponse.json(template, { status: 201 })

  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}