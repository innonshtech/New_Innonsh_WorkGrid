import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

// Helper: Transform tasks to handle consistent name structure
function transformTask(task) {
  let displayName = "Unassigned";
  
  if (task.assignedTo) {
    if (task.assignedTo.personalDetails) {
      const { firstName = "", lastName = "" } = task.assignedTo.personalDetails;
      displayName = `${firstName} ${lastName}`.trim() || task.assignedTo.name || "Unknown";
    } else {
      displayName = task.assignedTo.name || "Unknown";
    }
  }

  return {
    ...task,
    assignedTo: task.assignedTo ? {
      ...task.assignedTo,
      name: displayName
    } : null
  };
}

export async function GET(request) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project');
    const viewMode = searchParams.get('view'); // 'board' or 'list'
    const assignee = searchParams.get('assignee');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // SaaS PROTECTION: Restrict by organization
    let where = { };
    if (authUser.role !== 'super_admin') {
        const myOrgEmployees = await prisma.employee.findMany({ where: { organizationId: authUser.organizationId }, select: { id: true, mongoId: true } });
        const myOrgEmployeeIds = myOrgEmployees.flatMap(e => [e.id, e.mongoId]).filter(Boolean);
        // Tasks have no organizationId field in schema explicitly, but taskData might. 
        // We will fetch tasks where employeeId is in org.
        where.employeeId = { in: myOrgEmployeeIds };
    }

    // Employee-specific filtering
    if (authUser.role === "employee") {
        where.employeeId = authUser.id;
        // Or if assignedBy is in taskData
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (assignee) {
      where.employeeId = assignee;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tasksDocs = await prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });

    const empIds = [...new Set(tasksDocs.map(t => t.employeeId).filter(Boolean))];
    const employees = await prisma.employee.findMany({
        where: { OR: [{ id: { in: empIds } }, { mongoId: { in: empIds } }] },
        select: { id: true, mongoId: true, email: true, firstName: true, lastName: true }
    });
    
    const empMap = {};
    employees.forEach(e => {
        const data = {
            _id: e.id,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Unknown',
            email: e.email,
            personalDetails: { firstName: e.firstName, lastName: e.lastName }
        };
        empMap[e.id] = data;
        if (e.mongoId) empMap[e.mongoId] = data;
    });

    const tasks = tasksDocs.map(t => {
        const td = typeof t.taskData === 'object' && t.taskData !== null ? t.taskData : {};
        return {
            _id: t.id,
            ...t,
            ...td,
            assignedTo: empMap[t.employeeId] || null,
            assignedBy: td.assignedBy || null,
            project: td.project || null,
            comments: td.comments || []
        };
    });

    // If board view requested, group by status
    if (viewMode === 'board') {
      const transformedTasks = tasks.map(transformTask);
      const grouped = transformedTasks.reduce((acc, task) => {
        const status = task.status || 'Pending';
        if (!acc[status]) acc[status] = [];
        acc[status].push(task);
        return acc;
      }, {});

      return NextResponse.json({ 
        success: true,
        data: tasks,
        board: grouped,
        count: tasks.length
      }, { status: 200 });
    }

      // Transform for list view
      const transformedTasks = tasks.map(transformTask);

      return NextResponse.json({ 
        success: true,
        data: transformedTasks,
        count: transformedTasks.length
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
    
    const { _id, assignedBy, assignedTo, project, priority, dueDate, ...cleanBody } = body;

    const taskData = {
      ...cleanBody,
      assignedBy: authUser.id,
      assignedByModel: "User",
      project,
      dueDate,
    };
    
    const newTask = await prisma.task.create({
        data: {
            employeeId: assignedTo,
            projectId: project,
            title: cleanBody.title || 'Untitled',
            description: cleanBody.description || '',
            priority: priority || 'Medium',
            dueDate: dueDate ? new Date(dueDate) : null,
            taskData
        }
    });
    
    const transformedTask = {
      ...newTask,
      ...(typeof newTask.taskData === 'object' && newTask.taskData !== null ? newTask.taskData : {}),
      _id: newTask.id,
    };

    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });
    
  } catch (error) {
    console.error('💥 Error in task POST API:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to create task',
    }, { status: 500 });
  }
}
