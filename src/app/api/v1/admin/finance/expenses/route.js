import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { z } from 'zod';
import { getAuthUser, authorize } from '@/lib/auth-util';

const expenseSchema = z.object({
    employee: z.string().optional(),
    title: z.string().min(1),
    category: z.enum(['Travel', 'Food', 'Accommodation', 'Equipment', 'Software', 'Utilities', 'Other']),
    amount: z.preprocess((val) => (val === "" || val === null ? 0 : Number(val)), z.number().min(0).default(0)),
    maxAmount: z.preprocess((val) => (val === "" || val === null ? 0 : Number(val)), z.number().min(0).default(0)),
    date: z.string().transform(val => new Date(val)).optional(),
    description: z.string().optional(),
    receiptUrl: z.string().optional(),
    claimType: z.enum(['Personal', 'Team', 'Department']).default('Personal'),
    teamMembers: z.string().optional(),
    status: z.enum(['Draft', 'Pending', 'Approved', 'Rejected', 'Paid']).default('Pending'),
    costCenter: z.string().optional(),
    gstDetails: z.object({
        gstNumber: z.string().optional(),
        gstAmount: z.number().optional(),
        isGstIncluded: z.boolean().default(true)
    }).optional()
});

export async function GET(request) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);

        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const search = searchParams.get('search');
        const claimType = searchParams.get('claimType');
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        // Fetch all active employees in organization for tenant isolation
        let allowedEmployeeIds = null;
        if (authUser.role !== 'super_admin') {
            const orgEmployees = await prisma.employee.findMany({
                where: { organizationId: authUser.organizationId }
            });
            allowedEmployeeIds = orgEmployees.map(e => e.id);
        }

        // Fetch expenses
        const allExpenses = await prisma.expense.findMany();

        // Hydrate all employees in-memory for response population
        const allEmployees = await prisma.employee.findMany();
        const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
        const employeeMongoMap = new Map(allEmployees.filter(e => e.mongoId).map(e => [e.mongoId, e]));

        // In-memory filter and format
        let expenses = allExpenses.map(exp => {
            const mData = exp.modelData && typeof exp.modelData === 'object' ? exp.modelData : {};
            const empId = exp.employeeId || mData.employee;
            const emp = employeeMap.get(empId) || employeeMongoMap.get(empId) || null;

            return {
                _id: exp.id,
                id: exp.id,
                mongoId: exp.mongoId,
                organizationId: exp.organizationId,
                employee: emp ? {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    personalDetails: emp.personalDetails
                } : empId,
                employeeId: emp ? emp.id : empId,
                title: mData.title,
                category: mData.category,
                amount: mData.amount,
                maxAmount: mData.maxAmount,
                date: mData.date || exp.createdAt,
                description: mData.description,
                receiptUrl: mData.receiptUrl,
                claimType: mData.claimType,
                teamMembers: mData.teamMembers,
                status: exp.status || mData.status || 'Pending',
                costCenter: mData.costCenter,
                gstDetails: mData.gstDetails,
                createdAt: exp.createdAt,
                updatedAt: exp.updatedAt
            };
        });

        // Filter by organization (tenant isolation)
        if (allowedEmployeeIds) {
            expenses = expenses.filter(exp => allowedEmployeeIds.includes(exp.employeeId));
        }

        // Filter by employeeId
        if (employeeId) {
            if (allowedEmployeeIds && !allowedEmployeeIds.includes(employeeId)) {
                return NextResponse.json({ error: "Forbidden: Access is denied" }, { status: 403 });
            }
            expenses = expenses.filter(exp => exp.employeeId === employeeId);
        }

        // Filter by status
        if (status && status !== 'all') {
            expenses = expenses.filter(exp => exp.status.toLowerCase() === status.toLowerCase());
        }

        // Filter by claimType
        if (claimType && claimType !== 'all') {
            expenses = expenses.filter(exp => exp.claimType?.toLowerCase() === claimType.toLowerCase());
        }

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase();
            expenses = expenses.filter(exp => {
                const titleMatch = exp.title?.toLowerCase().includes(searchLower);
                const categoryMatch = exp.category?.toLowerCase().includes(searchLower);
                const empNameMatch = exp.employee && typeof exp.employee === 'object' && 
                    (`${exp.employee.firstName} ${exp.employee.lastName}`).toLowerCase().includes(searchLower);
                return titleMatch || categoryMatch || empNameMatch;
            });
        }

        // Filter by date
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            expenses = expenses.filter(exp => {
                const expDate = new Date(exp.date);
                if (start && expDate < start) return false;
                if (end && expDate > end) return false;
                return true;
            });
        }

        // Sort by date/createdAt descending
        expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        if (pageParam || limitParam) {
            const page = parseInt(pageParam) || 1;
            const limit = parseInt(limitParam) || 10;
            const skip = (page - 1) * limit;
            const paginatedExpenses = expenses.slice(skip, skip + limit);
            const total = expenses.length;

            return NextResponse.json({
                expenses: paginatedExpenses,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            });
        }

        return NextResponse.json({ expenses });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const authUser = await getAuthUser();
        const body = await request.json();
        const validatedData = expenseSchema.parse(body);

        let resolvedEmployeeId = validatedData.employee || authUser.id;
        if (resolvedEmployeeId) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: resolvedEmployeeId }, { mongoId: resolvedEmployeeId }] }
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
            }
        }

        const org = authUser.organizationId ? await prisma.organization.findFirst({
            where: { OR: [{ id: authUser.organizationId }, { mongoId: authUser.organizationId }] }
        }) : null;

        const expense = await prisma.expense.create({
            data: {
                employeeId: resolvedEmployeeId,
                status: validatedData.status || 'Pending',
                organizationId: org ? org.id : authUser.organizationId,
                modelData: validatedData
            }
        });

        // Flatten modelData for legacy response consistency
        const formatted = {
            ...expense,
            _id: expense.id,
            ...validatedData
        };

        return NextResponse.json({ expense: formatted, message: "Expense claim submitted successfully" }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });

        const existingExpense = await prisma.expense.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!existingExpense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        // Only block editing fields if it's not Pending/Draft AND update is trying to change more than status/comments
        const isOnlyStatusUpdate = Object.keys(updateData).every(k => ['status', 'paymentDetails', 'adminComments'].includes(k));
        if (!['Pending', 'Draft'].includes(existingExpense.status) && !isOnlyStatusUpdate) {
            return NextResponse.json({ error: "Cannot edit expense after it is approved or paid" }, { status: 403 });
        }

        // Merge modelData
        const currentData = existingExpense.modelData && typeof existingExpense.modelData === 'object' ? existingExpense.modelData : {};
        const mergedData = { ...currentData, ...updateData };

        let resolvedEmployeeId = updateData.employee || existingExpense.employeeId;
        if (updateData.employee) {
            const emp = await prisma.employee.findFirst({
                where: { OR: [{ id: updateData.employee }, { mongoId: updateData.employee }] }
            });
            if (emp) {
                resolvedEmployeeId = emp.id;
            }
        }

        const expense = await prisma.expense.update({
            where: { id: existingExpense.id },
            data: {
                status: updateData.status || existingExpense.status,
                employeeId: resolvedEmployeeId,
                modelData: mergedData
            }
        });

        const formatted = {
            ...expense,
            _id: expense.id,
            ...mergedData
        };

        return NextResponse.json({ expense: formatted, message: "Expense updated successfully" });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });

        const expense = await prisma.expense.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

        if (expense.status !== 'Pending' && expense.status !== 'Draft') {
            return NextResponse.json({ error: "Only Pending or Draft expenses can be deleted" }, { status: 403 });
        }

        await prisma.expense.delete({ where: { id: expense.id } });

        return NextResponse.json({ message: "Expense deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
