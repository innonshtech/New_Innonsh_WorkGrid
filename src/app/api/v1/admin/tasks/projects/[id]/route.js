import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';


import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const project = await prisma.project.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        const projectData = (project.projectData && typeof project.projectData === 'object') ? project.projectData : {};

        // Fetch all employees referenced in this project to map profiles
        const referencedEmpIds = [
            projectData.projectManager,
            ...(projectData.members || []),
            ...(projectData.leads || [])
        ].filter(Boolean);

        const employees = await prisma.employee.findMany({
            where: {
                OR: [
                    { id: { in: referencedEmpIds } },
                    { mongoId: { in: referencedEmpIds } }
                ]
            }
        });

        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.id] = emp;
            if (emp.mongoId) {
                employeeMap[emp.mongoId] = emp;
            }
        });

        // Map projectManager
        let projectManager = null;
        const pmId = projectData.projectManager;
        if (pmId && employeeMap[pmId]) {
            const emp = employeeMap[pmId];
            projectManager = {
                id: emp.id,
                _id: emp.id,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName
                },
                jobDetails: {
                    designation: emp.designation
                }
            };
        } else if (pmId) {
            projectManager = pmId;
        }

        // Map members
        const members = (projectData.members || []).map(mId => {
            if (employeeMap[mId]) {
                const emp = employeeMap[mId];
                return {
                    id: emp.id,
                    _id: emp.id,
                    personalDetails: {
                        firstName: emp.firstName,
                        lastName: emp.lastName
                    }
                };
            }
            return mId;
        });

        // Map leads
        const leads = (projectData.leads || []).map(lId => {
            if (employeeMap[lId]) {
                const emp = employeeMap[lId];
                return {
                    id: emp.id,
                    _id: emp.id
                };
            }
            return lId;
        });

        const formattedProject = {
            id: project.id,
            _id: project.id,
            mongoId: project.mongoId,
            name: project.name,
            description: project.description,
            status: project.status,
            organizationId: project.organizationId,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            ...projectData,
            projectManager,
            members,
            leads
        };

        const tasks = await prisma.task.findMany({ where: { projectId: id } });
        
        const stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'Completed').length,
            pendingTasks: tasks.filter(t => t.status === 'Pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'In Progress').length,
            totalEstimatedHours: tasks.reduce((acc, t) => acc + (t.estimatedHours || 0), 0),
            overallProgress: tasks.length > 0 
                ? Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / tasks.length) 
                : 0
        };

        // Fetch total logged hours from timesheets and aggregate per member
        const allTimeEntries = await prisma.timesheetEntry.findMany();
        const rawTimeEntries = allTimeEntries.filter(e => {
            const data = e.modelData || {};
            return data.project === id || data.projectId === id;
        });

        const timeEntries = await Promise.all(rawTimeEntries.map(async (entry) => {
            const data = entry.modelData || {};
            let employee = null;
            const empId = entry.employeeId || data.employee;
            if (empId) {
                const emp = await prisma.employee.findFirst({
                    where: { OR: [{ id: empId }, { mongoId: empId }] }
                });
                if (emp) {
                    employee = {
                        _id: emp.id,
                        personalDetails: {
                            firstName: emp.firstName || "",
                            lastName: emp.lastName || ""
                        }
                    };
                }
            }
            return {
                ...data,
                id: entry.id,
                mongoId: entry.mongoId,
                hours: data.hours || 0,
                employee
            };
        }));
        
        stats.totalLoggedHours = timeEntries.reduce((acc, e) => acc + (e.hours || 0), 0);
        
        const memberStats = {};
        timeEntries.forEach(entry => {
            const memberId = entry.employee?._id?.toString();
            if (!memberId) return;
            if (!memberStats[memberId]) {
                memberStats[memberId] = {
                    name: `${entry.employee.personalDetails?.firstName || ""} ${entry.employee.personalDetails?.lastName || ""}`.trim() || "Unknown Employee",
                    hours: 0
                };
            }
            memberStats[memberId].hours += (entry.hours || 0);
        });
        stats.memberAggregation = Object.values(memberStats);

        return NextResponse.json({ success: true, project: formattedProject, stats });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const authUser = await getAuthUser();
        
        const { id } = await params;
        const body = await request.json();

        // Authorization: Admin OR Project Manager
        const existingProject = await prisma.project.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!existingProject) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        const existingProjectData = (existingProject.projectData && typeof existingProject.projectData === 'object') ? existingProject.projectData : {};
        const projectManagerId = existingProjectData.projectManager;
        
        // Find matching employee for authUser.id
        const authEmployee = await prisma.employee.findFirst({
            where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }, { email: authUser.email }] }
        });

        const isManager = projectManagerId && authEmployee && (projectManagerId === authEmployee.id || projectManagerId === authEmployee.mongoId);
        const isAdmin = ["admin", "super_admin"].includes(authUser.role);

        if (!isAdmin && !isManager) {
            return NextResponse.json({ success: false, error: 'Unauthorized: Only Admins or Project Managers can edit this project' }, { status: 403 });
        }

        const { name, description, status, organizationId, ...rest } = body;
        
        // Merge projectData updates
        const projectData = {
            ...existingProjectData,
            ...rest
        };

        const targetId = existingProject.id;
        const project = await prisma.project.update({
            where: { id: targetId },
            data: {
                name,
                description,
                status: status || existingProject.status,
                organizationId: organizationId || existingProject.organizationId,
                projectData
            }
        });

        await logActivity({
            action: "updated",
            entity: "Project",
            entityId: project.id,
            description: `Updated project: ${project.name}`,
            details: body,
            req: request
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { id } = await params;
        const project = await prisma.project.delete({ where: { id: (await prisma.project.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] }, select: { id: true } }))?.id || id } });

        if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

        await logActivity({
            action: "deleted",
            entity: "Project",
            entityId: project._id,
            description: `Deleted project: ${project.name}`,
            req: request
        });

        return NextResponse.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
