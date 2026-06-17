import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { resolveOrgIds } from "@/lib/utils/flatten-model";




import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(req) {
    try {
        const user = await getAuthUser();
        
        let filter = {};

        if (user.role === 'employee') {
            const employee = await prisma.employee.findFirst({ where: { OR: [{ id: user.id }, { mongoId: user.id }] } });
            if (employee?.organizationId) {
                const orgIds = await resolveOrgIds(employee.organizationId);
                filter.organizationId = { in: orgIds };
            } else {
                filter.OR = [{ organizationId: null }, { organizationId: { equals: null } }];
            }
            filter.status = { not: 'Cancelled' };
        } else if (user.role === 'admin' || user.role === 'supervisor') {
            if (user.organizationId) {
                const orgIds = await resolveOrgIds(user.organizationId);
                filter.organizationId = { in: orgIds };
            }
            const { searchParams } = new URL(req.url);
            const status = searchParams.get("status");
            if (status) filter.status = status;
        } else {
            const { searchParams } = new URL(req.url);
            const status = searchParams.get("status");
            if (status) filter.status = status;
        }

        const rawBonuses = await prisma.bonus.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });

        let bonuses = rawBonuses.map(b => ({
            _id: b.id,
            status: b.status,
            amount: b.amount,
            reason: b.reason,
            date: b.date,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
            ...b.modelData,
            organizationId: b.organizationId
        }));

        if (user.role === 'employee') {
            const employee = await prisma.employee.findFirst({ where: { OR: [{ id: user.id }, { mongoId: user.id }] } });
            const deptId = employee?.departmentId;
            bonuses = bonuses.filter(b => {
                if (b.targetAudience === 'All') return true;
                if (b.targetAudience === 'Individual' && b.employees && b.employees.includes(user.id)) return true;
                if (b.targetAudience === 'Individual' && b.employees && b.employees.includes(user.mongoId)) return true;
                if (b.targetAudience === 'Department' && b.department && (b.department === deptId || b.department?._id === deptId)) return true;
                return false;
            });
        }

        return NextResponse.json({ bonuses });

    } catch (error) {
        console.error("Error fetching bonuses:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getAuthUser();
        authorize(user, ["admin", "super_admin"]);

        const body = await req.json();
        const {
            title,
            description,
            type,
            amount,
            issuanceType,
            percentageBasis,
            targetAudience,
            employees,
            department,
            paymentDate
        } = body;

        // Validation
        if (!title || !amount || !paymentDate) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (targetAudience === 'Individual' && (!employees || employees.length === 0)) {
            return NextResponse.json({ message: "Please select employees for Individual bonus" }, { status: 400 });
        }

        if (targetAudience === 'Department' && !department) {
            return NextResponse.json({ message: "Please select a department" }, { status: 400 });
        }

        // SaaS PROTECTION: Admin must use their org
        const orgId = user.role === 'admin' ? user.organizationId : body.organizationId;

        const newBonusRecord = await prisma.bonus.create({ data: {
            organizationId: orgId,
            amount: parseFloat(amount),
            reason: title,
            date: new Date(paymentDate),
            status: "Pending",
            modelData: {
                title,
                description,
                type,
                amount,
                issuanceType,
                percentageBasis,
                targetAudience,
                employees: targetAudience === 'Individual' ? employees : [],
                department: targetAudience === 'Department' ? department : null,
                paymentDate,
                createdBy: user.id
            }
        } });

        const newBonus = {
            _id: newBonusRecord.id,
            status: newBonusRecord.status,
            amount: newBonusRecord.amount,
            reason: newBonusRecord.reason,
            date: newBonusRecord.date,
            createdAt: newBonusRecord.createdAt,
            updatedAt: newBonusRecord.updatedAt,
            ...newBonusRecord.modelData,
            organizationId: newBonusRecord.organizationId
        };

        // --- Notification Logic ---
        let targetEmployeeIds = [];
        let empFilter = {};

        // SaaS PROTECTION: Notifications only for org employees
        if (user.role === 'admin' && user.organizationId) {
            const orgIds = await resolveOrgIds(user.organizationId);
            empFilter.organizationId = { in: orgIds };
        } else if (orgId) {
            const orgIds = await resolveOrgIds(orgId);
            empFilter.organizationId = { in: orgIds };
        }

        if (targetAudience === 'Individual') {
            targetEmployeeIds = employees;
        } else if (targetAudience === 'Department') {
            const departmentEmployees = await prisma.employee.findMany({ where: empFilter });
            targetEmployeeIds = departmentEmployees
                .filter(e => {
                    const jobDeptId = e.departmentId || e.department;
                    return jobDeptId === department;
                })
                .map(e => e.id);
        } else if (targetAudience === 'All') {
            const allEmployees = await prisma.employee.findMany({ where: empFilter, select: { id: true } });
            targetEmployeeIds = allEmployees.map(e => e.id);
        }

        if (targetEmployeeIds.length > 0) {
            const notifications = targetEmployeeIds.map(empId => ({
                type: 'bonus',
                title: `New Bonus: ${title}`,
                message: `A new ${type} bonus has been initiated. Status: Pending.`,
                employeeId: empId,
                isRead: false
            }));

            try {
                await prisma.notification.createMany({ data: notifications });
            } catch (notifError) {
                console.error("Error inserting notifications:", notifError);
            }
        }

        return NextResponse.json({ message: "Bonus created successfully", bonus: newBonus });

    } catch (error) {
        console.error("Error creating bonus:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
