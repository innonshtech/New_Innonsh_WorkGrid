import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
    
    // SaaS PROTECTION: Restrict by organization
    let where = {};
    
    // In our quick schema map, Task has taskData for extra fields like organizationId
    // For now we will rely on employee matching or taskData filtering
    
    if (authUser.role === "admin" || authUser.role === "supervisor") {
      // In PostgreSQL we can use JSON filtering if needed:
      // where.taskData = { path: ['organizationId'], equals: authUser.organizationId }
      // Or fetch employees in the org and filter tasks by them
      const orgEmployees = await prisma.employee.findMany({
        where: { organizationId: authUser.organizationId },
        select: { id: true, mongoId: true }
      });
      const empIds = orgEmployees.map(e => e.id).concat(orgEmployees.map(e => e.mongoId).filter(Boolean));
      where.employeeId = { in: empIds };
    }

    // Employee-specific filtering
    if (authUser.role === "employee") {
       where.OR = [
         { employeeId: authUser.id },
         { mongoId: authUser.id }
       ];
    }

    // Fetch all tasks from the database matching the org
    const tasksDocs = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // In a real relation we would use include: { employee: true }, but since we didn't define strict FKs
    // we fetch the assignees manually
    const assigneeIds = [...new Set(tasksDocs.map(t => t.employeeId).filter(Boolean))];
    const assignees = await prisma.employee.findMany({
      where: { OR: [{ id: { in: assigneeIds } }, { mongoId: { in: assigneeIds } }] }
    });
    
    const assigneeMap = {};
    assignees.forEach(emp => {
      assigneeMap[emp.id] = emp;
      if (emp.mongoId) assigneeMap[emp.mongoId] = emp;
    });

    const tasks = tasksDocs.map(task => {
      let displayName = "Unassigned";
      let assignedToObj = null;

      if (task.employeeId && assigneeMap[task.employeeId]) {
        const emp = assigneeMap[task.employeeId];
        displayName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || "Unknown";
        assignedToObj = {
          _id: emp.id,
          id: emp.id,
          name: displayName,
          email: emp.email
        };
      }

      // Reconstruct legacy Mongoose object format for frontend compatibility
      return {
        _id: task.id,
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignedTo: assignedToObj,
        ...(typeof task.taskData === 'object' && task.taskData !== null ? task.taskData : {})
      };
    });

    return NextResponse.json({ 
      success: true,
      data: tasks,
      count: tasks.length
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error in tasks API:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: 'Check server logs for more information'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
    
    const body = await request.json();
    
    // CRITICAL: Remove _id to let database generate a unique one
    const { _id, id, assignedBy, assignedTo, title, description, status, priority, dueDate, ...cleanBody } = body;

    // Auto-assign organizationId from the authenticated user
    if (authUser.role === "admin" && authUser.organizationId) {
        cleanBody.organizationId = authUser.organizationId;
    }
    
    const newTask = await prisma.task.create({
      data: {
        title: title || "Untitled Task",
        description: description,
        status: status || "Pending",
        priority: priority || "Medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        employeeId: assignedTo,
        taskData: {
           ...cleanBody,
           assignedBy: authUser.id
        }
      }
    });

    console.log('✅ Task created with new ID:', newTask.id);
    
    const transformedTask = {
      ...newTask,
      _id: newTask.id,
      ...newTask.taskData
    };

    // Commented out logActivity temporarily if it relies on Mongoose
    // await logActivity({...});

    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });
    
  } catch (error) {
    console.error('💥 Error in task POST API:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to create task',
      details: 'Check server logs for more information'
    }, { status: 500 });
  }
}
