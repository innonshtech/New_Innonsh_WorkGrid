import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

async function populateTaskRelations(task) {
  if (!task) return null;
  const taskData = task.taskData || {};
  let assignedTo = null;
  let assignedBy = null;

  const employeeId = task.employeeId || taskData.assignedTo;
  if (employeeId) {
    const emp = await prisma.employee.findFirst({
      where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
    });
    if (emp) {
      assignedTo = {
        _id: emp.id,
        id: emp.id,
        mongoId: emp.mongoId,
        personalDetails: {
          firstName: emp.firstName || "",
          lastName: emp.lastName || "",
          email: emp.email || ""
        }
      };
    }
  }

  const assignedById = taskData.assignedBy;
  if (assignedById) {
    if (taskData.assignedByModel === 'Employee') {
      const emp = await prisma.employee.findFirst({
        where: { OR: [{ id: assignedById }, { mongoId: assignedById }] }
      });
      if (emp) {
        assignedBy = {
          _id: emp.id,
          id: emp.id,
          name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unknown Employee"
        };
      }
    } else {
      const user = await prisma.user.findFirst({
        where: { OR: [{ id: assignedById }, { mongoId: assignedById }] }
      });
      if (user) {
        assignedBy = {
          _id: user.id,
          id: user.id,
          name: user.name || "Unknown User"
        };
      }
    }
  }

  const dueDateStr = task.dueDate ? new Date(task.dueDate).toISOString() : (taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null);
  const startDateStr = taskData.startDate ? new Date(taskData.startDate).toISOString() : (task.createdAt ? new Date(task.createdAt).toISOString() : null);
  const completedAtStr = taskData.completedAt ? new Date(taskData.completedAt).toISOString() : null;

  return {
    ...taskData,
    _id: task.id,
    id: task.id,
    mongoId: task.mongoId,
    projectId: task.projectId || taskData.project,
    employeeId: employeeId,
    title: task.title,
    description: task.description || taskData.description,
    status: task.status,
    priority: task.priority,
    dueDate: dueDateStr,
    startDate: startDateStr,
    completedAt: completedAtStr,
    assignedTo,
    assignedBy,
    project: task.projectId || taskData.project,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function prepareTaskData(existingTask, body) {
  const mainFields = ['projectId', 'employeeId', 'title', 'description', 'status', 'priority', 'dueDate'];
  
  if (body.assignedTo) body.employeeId = body.assignedTo;
  if (body.project) body.projectId = body.project;

  const updateData = {};
  const currentTaskData = existingTask.taskData || {};
  const newTaskData = { ...currentTaskData };

  Object.keys(body).forEach(key => {
    if (mainFields.includes(key)) {
      if (key === 'dueDate') {
        updateData[key] = body[key] ? new Date(body[key]) : null;
      } else {
        updateData[key] = body[key];
      }
    } else if (key !== 'id' && key !== '_id' && key !== 'mongoId') {
      newTaskData[key] = body[key];
    }
  });

  updateData.taskData = newTaskData;
  updateData.updatedAt = new Date();
  return updateData;
}

// GET - Get single task by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const task = await prisma.task.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const transformedTask = await populateTaskRelations(task);
    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });

  } catch (error) {
    console.error('Error in task GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT - Update task by ID
export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📝 PUT request body:', body);

    const existingTask = await prisma.task.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    const updatePayload = prepareTaskData(existingTask, body);

    if (body.status === 'Completed' && !existingTask.taskData?.completedAt) {
      updatePayload.taskData.completedAt = new Date().toISOString();
    } else if (body.status && body.status !== 'Completed') {
      updatePayload.taskData.completedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: existingTask.id },
      data: updatePayload
    });

    const transformedTask = await populateTaskRelations(updatedTask);
    console.log('✅ Task updated successfully:', transformedTask._id);

    let performer = null;
    if (body.updatedBy) {
        performer = await prisma.user.findFirst({ where: { OR: [{ id: body.updatedBy }, { mongoId: body.updatedBy }] } });
    }

    await logActivity({
      action: "updated",
      entity: "Task",
      entityId: updatedTask.id,
      description: `Updated task: ${updatedTask.title}`,
      performedBy: {
        userId: authUser.id, 
        name: authUser.name || performer?.name || "Admin/User",
        email: authUser.email || performer?.email,
        role: authUser.role || performer?.role
      },
      details: {
        status: updatedTask.status,
        priority: updatedTask.priority
      },
      req: request
    });

    return NextResponse.json({ 
      success: true, 
      task: transformedTask 
    });

  } catch (error) {
    console.error('Error in task PUT API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete task by ID
export async function DELETE(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);
    
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: { OR: [{ id: id }, { mongoId: id }] }
    });

    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: existingTask.id }
    });

    console.log('✅ Task deleted successfully:', id);

    await logActivity({
      action: "deleted",
      entity: "Task",
      entityId: id,
      description: `Deleted task: ${id}`,
      req: request
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    });

  } catch (error) {
    console.error('Error in task DELETE API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}