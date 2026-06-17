import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function GET(req) {
    try {
        const user = await getAuthUser();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        let filter = {};

        if (user.role === 'employee') {
            const employee = await prisma.employee.findFirst({
                where: { OR: [{ id: user.id }, { mongoId: user.id }] }
            });
            const deptId = employee?.departmentId;

            // In Prisma, we will fetch those matching organization and then filter in JS for json arrays
            if (employee?.organizationId) {
                filter.organizationId = employee.organizationId;
            } else {
                filter.OR = [{ organizationId: null }, { organizationId: { equals: null } }];
            }
            filter.status = { not: 'Cancelled' };
        } else if (user.role === 'admin' || user.role === 'supervisor') {
            if (user.organizationId) {
                filter.organizationId = user.organizationId;
            }
            if (status) filter.status = status;
        } else {
            if (status) filter.status = status;
        }

        const rawBonuses = await prisma.bonus.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });

        let bonuses = rawBonuses.map(b => ({
            _id: b.id,
            status: b.status,
            ...b.modelData,
            organizationId: b.organizationId
        }));

        if (user.role === 'employee') {
            const employee = await prisma.employee.findFirst({
                where: { OR: [{ id: user.id }, { mongoId: user.id }] }
            });
            const deptId = employee?.departmentId || employee?.department;
            
            bonuses = bonuses.filter(b => {
                if (b.targetAudience === 'All') return true;
                if (b.targetAudience === 'Individual' && b.employees && b.employees.includes(user.id)) return true;
                if (b.targetAudience === 'Individual' && b.employees && b.employees.includes(user.mongoId)) return true;
                if (b.targetAudience === 'Department' && b.department && (b.department === deptId || (b.department._id && b.department._id === deptId))) return true;
                return false;
            });
        }

        // Populate manual references
        bonuses = await Promise.all(bonuses.map(async b => {
            if (b.employees && Array.isArray(b.employees)) {
                b.employees = await Promise.all(b.employees.map(async empId => {
                    const e = await prisma.employee.findFirst({
                        where: { OR: [{ id: empId }, { mongoId: empId }] },
                        select: { firstName: true, lastName: true, email: true }
                    });
                    return e ? {
                        _id: empId,
                        personalDetails: {
                            firstName: e.firstName,
                            lastName: e.lastName,
                            email: e.email
                        }
                    } : empId;
                }));
            }
            if (b.department) {
                const d = await prisma.department.findFirst({
                    where: { OR: [{ id: b.department }, { mongoId: b.department }] },
                    select: { departmentName: true }
                });
                if (d) b.department = { _id: b.department, departmentName: d.departmentName };
            }
            if (b.createdBy) {
                const c = await prisma.user.findFirst({ where: { OR: [{ id: b.createdBy }, { mongoId: b.createdBy }] }, select: { name: true } });
                if (c) b.createdBy = { _id: b.createdBy, name: c.name };
            }
            if (b.approvedBy) {
                const a = await prisma.user.findFirst({ where: { OR: [{ id: b.approvedBy }, { mongoId: b.approvedBy }] }, select: { name: true } });
                if (a) b.approvedBy = { _id: b.approvedBy, name: a.name };
            }
            return b;
        }));

        return NextResponse.json({ bonuses });
    } catch (error) {
        console.error("Error fetching bonuses:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getAuthUser();
        authorize(user, ['admin', 'super_admin']); // Assuming only admin/super_admin create bonus

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

        if (!title || !amount || !paymentDate) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (targetAudience === 'Individual' && (!employees || employees.length === 0)) {
            return NextResponse.json({ message: "Please select employees for Individual bonus" }, { status: 400 });
        }

        if (targetAudience === 'Department' && !department) {
            return NextResponse.json({ message: "Please select a department" }, { status: 400 });
        }

        const orgId = user.role === 'admin' ? user.organizationId : body.organizationId;

        const newBonusRecord = await prisma.bonus.create({
            data: {
                organizationId: orgId,
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
            }
        });

        const newBonus = {
            _id: newBonusRecord.id,
            status: newBonusRecord.status,
            ...newBonusRecord.modelData,
            organizationId: newBonusRecord.organizationId
        };

        // Notification logic
        let targetEmployeeIds = [];
        let empFilter = {};

        if (user.role === 'admin' && user.organizationId) {
            empFilter.organizationId = user.organizationId;
        } else if (orgId) {
            empFilter.organizationId = orgId;
        }

        if (targetAudience === 'Individual') {
            targetEmployeeIds = employees;
        } else if (targetAudience === 'Department') {
            const departmentEmployees = await prisma.employee.findMany({
                where: {
                    ...empFilter,
                    OR: [
                        { departmentId: department },
                        { department: department }
                    ]
                },
                select: { id: true }
            });
            targetEmployeeIds = departmentEmployees.map(e => e.id);
        } else if (targetAudience === 'All') {
            const allEmployees = await prisma.employee.findMany({ where: empFilter, select: { id: true } });
            targetEmployeeIds = allEmployees.map(e => e.id);
        }

        if (targetEmployeeIds.length > 0) {
            const notifications = targetEmployeeIds.map(empId => ({
                organizationId: orgId,
                status: "Active",
                modelData: {
                    type: 'bonus',
                    title: `New Bonus: ${title}`,
                    message: `A new ${type} bonus has been initiated. Status: Pending.`,
                    priority: 'medium',
                    employee: empId,
                    details: {
                        bonusId: newBonusRecord.id,
                        amount: issuanceType === 'Fixed' ? amount : `${amount}% of ${percentageBasis}`,
                        paymentDate
                    }
                }
            }));

            try {
                await prisma.notificationConfig.createMany({ data: notifications });
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
