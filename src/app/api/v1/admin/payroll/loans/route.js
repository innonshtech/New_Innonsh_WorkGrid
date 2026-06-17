import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser } from "@/lib/auth-util";

export async function GET(req) {
    try {
        const user = await getAuthUser();
        
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const employeeId = searchParams.get("employeeId");

        // SaaS PROTECTION: Restrict by organization
        let allowedEmployeeIds = null;
        if (user.role === "admin" || user.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({ 
                where: { organizationId: user.organizationId } 
            });
            allowedEmployeeIds = orgEmployees.map(e => e.id);
        } else if (user.role === "employee") {
            allowedEmployeeIds = [user.id];
        }

        // Fetch loans
        const rawLoans = await prisma.loan.findMany();

        // Hydrate employees
        const allEmployees = await prisma.employee.findMany();
        const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
        const employeeMongoMap = new Map(allEmployees.filter(e => e.mongoId).map(e => [e.mongoId, e]));

        let loans = rawLoans.map(loan => {
            const mData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
            const empId = loan.employeeId || mData.employee;
            const emp = employeeMap.get(empId) || employeeMongoMap.get(empId) || null;

            return {
                _id: loan.id,
                id: loan.id,
                mongoId: loan.mongoId,
                amount: loan.amount,
                emi: loan.emi,
                status: loan.status,
                reason: mData.reason,
                type: mData.type,
                installments: mData.installments,
                employeeId: empId,
                createdAt: loan.createdAt,
                updatedAt: loan.updatedAt,
                employee: emp ? {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    name: `${emp.firstName} ${emp.lastName}`.trim() || "Unknown",
                    email: emp.email || ""
                } : {
                    _id: null,
                    name: "Unknown",
                    email: ""
                }
            };
        });

        // Filter by allowedEmployeeIds
        if (allowedEmployeeIds) {
            loans = loans.filter(l => allowedEmployeeIds.includes(l.employeeId));
        }

        // Filter by employeeId
        if (employeeId && user.role !== "employee") {
            loans = loans.filter(l => l.employeeId === employeeId);
        }

        // Filter by status
        if (status) {
            loans = loans.filter(l => l.status.toLowerCase() === status.toLowerCase());
        }

        return NextResponse.json({ loans });
    } catch (error) {
        console.error("Error fetching loans:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const user = await getAuthUser();
        const body = await req.json();
        const { amount, reason, type, installments, employeeId } = body;

        const loanAmount = parseFloat(amount);
        if (isNaN(loanAmount) || loanAmount <= 0 || !reason) {
            return NextResponse.json(
                { message: "Invalid input" },
                { status: 400 }
            );
        }

        // Determine target employee
        let targetEmployeeId = user.id;
        let onModel = user.role === "employee" ? "Employee" : "User";

        if ((user.role === "admin" || user.role === "super_admin") && employeeId) {
            const targetEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: employeeId }, { mongoId: employeeId }] } });
            if (!targetEmployee) {
                return NextResponse.json({ message: "Employee not found" }, { status: 404 });
            }
            // SaaS PROTECTION: Admin can only create loans for employees in their org
            if (user.role === "admin" && targetEmployee.organizationId !== user.organizationId) {
                return NextResponse.json({ message: "Forbidden: Employee not in your organization" }, { status: 403 });
            }
            targetEmployeeId = targetEmployee.id;
            onModel = "Employee";
        }

        const loanData = {
            employee: targetEmployeeId,
            onModel,
            amount: loanAmount,
            reason,
            type: type || "Advance",
            installments: installments || 1,
            status: "Pending"
        };

        const newLoan = await prisma.loan.create({ 
            data: {
                employeeId: targetEmployeeId,
                amount: loanAmount,
                status: "Pending",
                loanData: loanData
            } 
        });

        // Map output for legacy compatibility
        const formatted = {
            ...newLoan,
            _id: newLoan.id,
            ...loanData
        };

        return NextResponse.json({
            message: "Loan requested successfully",
            loan: formatted,
        });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
