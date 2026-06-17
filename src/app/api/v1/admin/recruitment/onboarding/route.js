import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

import { getAuthUser, authorize } from '@/lib/auth-util';

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');

        let query = {};
        
        // SaaS PROTECTION
        let orgQueryVal = undefined;
        const orgId = authUser.role === 'admin' ? authUser.organizationId : searchParams.get('organizationId');
        if (orgId) {
            const org = await prisma.organization.findFirst({
                where: { OR: [{ id: orgId }, { mongoId: orgId }] }
            });
            if (org) {
                orgQueryVal = { in: [org.id, org.mongoId].filter(Boolean) };
                query.organizationId = orgQueryVal;
            } else {
                orgQueryVal = orgId;
                query.organizationId = orgId;
            }
        }

        if (employeeId) {
            query.OR = [
                { employeeId: employeeId },
                { mongoId: employeeId }
            ];
        }

        const checklistsRecords = await prisma.onboardingChecklist.findMany({ where: query });

        // Fetch employees to populate employee structures
        const employees = await prisma.employee.findMany({
            where: orgQueryVal ? { organizationId: orgQueryVal } : {}
        });
        const employeeMap = {};
        employees.forEach(emp => {
            const empObj = {
                id: emp.id,
                _id: emp.id,
                personalDetails: {
                    firstName: emp.firstName,
                    lastName: emp.lastName
                },
                employmentDetails: {
                    designation: emp.designation,
                    department: emp.department,
                    joiningDate: emp.dateOfJoining
                }
            };
            employeeMap[emp.id] = empObj;
            if (emp.mongoId) {
                employeeMap[emp.mongoId] = empObj;
            }
        });

        const checklists = checklistsRecords.map(c => {
            const modelDataObj = (c.modelData && typeof c.modelData === 'object') ? c.modelData : {};
            const empKey = c.employeeId || modelDataObj.employee || modelDataObj.employeeId;
            const employee = empKey ? employeeMap[empKey] : null;
            return {
                ...c,
                ...modelDataObj,
                id: c.id,
                _id: c.id,
                employee
            };
        });

        return NextResponse.json({ success: true, checklists });
    } catch (error) {
        console.error("GET ONBOARDING ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        
        // SaaS PROTECTION
        const orgId = authUser.role !== 'super_admin' ? authUser.organizationId : body.organizationId;
        const { employeeId, tasks, status, ...rest } = body;

        const checklist = await prisma.onboardingChecklist.create({ 
            data: { 
                employeeId,
                status: status || 'Not Started',
                organizationId: orgId,
                modelData: {
                    tasks,
                    ...rest
                }
            } 
        });

        const modelDataObj = (checklist.modelData && typeof checklist.modelData === 'object') ? checklist.modelData : {};
        const formatted = {
            ...checklist,
            ...modelDataObj,
            id: checklist.id,
            _id: checklist.id
        };

        return NextResponse.json({ success: true, checklist: formatted, message: "Onboarding checklist created" }, { status: 201 });
    } catch (error) {
        console.error("POST ONBOARDING ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "hr", "company_admin", "super_admin"]);
        
        const body = await request.json();
        const { id, ...updateData } = body;

        const checklistRecord = await prisma.onboardingChecklist.findFirst({ 
            where: { OR: [{ id: id }, { mongoId: id }] } 
        });
        if (!checklistRecord) return NextResponse.json({ error: "Checklist not found" }, { status: 404 });

        let currentModelData = checklistRecord.modelData ? (typeof checklistRecord.modelData === 'string' ? JSON.parse(checklistRecord.modelData) : checklistRecord.modelData) : {};
        let updateDataObj = {};

        Object.keys(updateData).forEach(key => {
            if (key === 'status') {
                updateDataObj.status = updateData[key];
            } else if (key === 'employeeId') {
                updateDataObj.employeeId = updateData[key];
            } else {
                currentModelData[key] = updateData[key];
            }
        });
        updateDataObj.modelData = currentModelData;

        const updatedChecklist = await prisma.onboardingChecklist.update({ 
            where: { id: checklistRecord.id }, 
            data: updateDataObj 
        });

        const modelDataObj = (updatedChecklist.modelData && typeof updatedChecklist.modelData === 'object') ? updatedChecklist.modelData : {};
        const formatted = {
            ...updatedChecklist,
            ...modelDataObj,
            id: updatedChecklist.id,
            _id: updatedChecklist.id
        };

        return NextResponse.json({ success: true, checklist: formatted, message: "Checklist updated" });
    } catch (error) {
        console.error("PUT ONBOARDING ERROR:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
