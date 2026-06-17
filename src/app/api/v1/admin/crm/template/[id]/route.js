import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

// Get single template by ID
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    const template = await prisma.template.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }]
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(template, { status: 200 })
  } catch (error) {
    console.error('Get template error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update template by ID
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const updateData = await request.json()
    
    // TODO: Add authentication - you need to get the user ID from the session/token
    const createdBy = updateData.createdBy || 'placeholder-user-id'
    
    // If setting as default, remove default from other templates
    if (updateData.isDefault) {
      await prisma.template.updateMany({
        where: { 
          OR: [{ id: { not: id } }, { mongoId: { not: id } }],
          createdBy: createdBy,
          isDefault: true 
        },
        data: { isDefault: false }
      })
    }
    
    // Update the template
    const template = await prisma.template.update({ where: { id: (await prisma.template.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id },
      data: { 
        ...updateData,
        updatedAt: new Date()
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(template, { status: 200 })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete template by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params
    
    // Check if template exists
    const template = await prisma.template.findFirst({
      where: {
        OR: [{ id: id }, { mongoId: id }]
      }
    })
    
    if (!template) {
      return NextResponse.json(
        { message: 'Template not found' },
        { status: 404 }
      )
    }
    
    // Prevent deletion of default template if it's the only one
    if (template.isDefault) {
      const templateCount = await prisma.template.count({ 
        where: { createdBy: template.createdBy }
      })
      
      if (templateCount <= 1) {
        return NextResponse.json(
          { message: 'Cannot delete the only template' },
          { status: 400 }
        )
      }
      
      // If deleting default template, set another template as default
      const anotherTemplate = await prisma.template.findFirst({ 
        where: { 
          OR: [{ id: { not: id } }, { mongoId: { not: id } }],
          createdBy: template.createdBy
        }
      })
      
      if (anotherTemplate) {
        await prisma.template.update({
          where: { id: anotherTemplate.id }, // Assuming 'id' is the primary key in Prisma
          data: { isDefault: true }
        })
      }
    }
    
    // Delete the template
    await prisma.template.delete({ where: { id: (await prisma.template.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id }
    })
    
    return NextResponse.json(
      { message: 'Template deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}