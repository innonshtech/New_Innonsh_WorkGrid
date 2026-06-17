import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';
import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin", "employee", "supervisor"]);
        
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const memberId = searchParams.get('memberId');

        // SaaS PROTECTION: Restrict by organization
        let query = { organizationId: authUser.organizationId };
        if (status) query.status = status;

        let projects = await prisma.project.findMany({
            where: query,
            orderBy: { createdAt: 'desc' }
        });

        // In-memory filter for employee/supervisor access and memberId
        if (authUser.role === "employee" || authUser.role === "supervisor") {
            // Fetch corresponding Employee record to get correct IDs used in project assignments
            // If the user logged in as an employee, authUser.id is their employee ID.
            // If they logged in as a User, authUser.id is their User ID.
            let emp = null;
            if (authUser.email) {
                emp = await prisma.employee.findFirst({
                    where: { email: authUser.email },
                    select: { id: true, mongoId: true }
                });
            } else if (authUser.id) {
                emp = await prisma.employee.findFirst({
                    where: { OR: [{ id: authUser.id }, { mongoId: authUser.id }] },
                    select: { id: true, mongoId: true }
                });
            }
            
            const validIds = [
                authUser.id, 
                authUser.mongoId, 
                ...(emp ? [emp.id, emp.mongoId] : [])
            ].filter(Boolean);

            projects = projects.filter(proj => {
                const data = (proj.projectData && typeof proj.projectData === 'object') ? proj.projectData : {};
                const pm = data.projectManager;
                const members = data.members || [];
                const leads = data.leads || [];
                
                const isPm = validIds.includes(pm);
                const isMember = validIds.some(id => members.includes(id));
                const isLead = validIds.some(id => leads.includes(id));
                
                return isPm || isMember || isLead;
            });
        }

        if (memberId) {
            projects = projects.filter(proj => {
                const data = (proj.projectData && typeof proj.projectData === 'object') ? proj.projectData : {};
                const members = data.members || [];
                return members.includes(memberId) || (members.some(m => m === memberId));
            });
        }

        // Fetch all employees in organization to map managers/members quickly
        const employees = await prisma.employee.findMany({
            where: { organizationId: authUser.organizationId }
        });

        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.id] = emp;
            if (emp.mongoId) {
                employeeMap[emp.mongoId] = emp;
            }
        });

        const formattedProjects = projects.map(proj => {
            const projectData = (proj.projectData && typeof proj.projectData === 'object') ? proj.projectData : {};
            
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

            return {
                id: proj.id,
                _id: proj.id, // Ensure both id and _id are defined & unique
                mongoId: proj.mongoId,
                name: proj.name,
                description: proj.description,
                status: proj.status,
                organizationId: proj.organizationId,
                createdAt: proj.createdAt,
                updatedAt: proj.updatedAt,
                ...projectData,
                projectManager,
                members,
                leads
            };
        });

        return NextResponse.json({ success: true, projects: formattedProjects });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const body = await request.json();

        // Auto-assign organizationId from the authenticated user
        if (authUser.role === "admin" && authUser.organizationId) {
            body.organizationId = authUser.organizationId;
        }

        const { name, description, status, organizationId, ...rest } = body;

        const project = await prisma.project.create({
            data: {
                name: name || "Untitled Project",
                description: description || "",
                status: status || "Active",
                organizationId: organizationId || null,
                projectData: rest
            }
        });

        await logActivity({
            action: "created",
            entity: "Project",
            entityId: project.id,
            description: `Created project: ${project.name}`,
            details: project,
            req: request
        });

        return NextResponse.json({ success: true, project }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

