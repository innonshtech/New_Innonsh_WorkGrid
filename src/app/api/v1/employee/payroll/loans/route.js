import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser } from "@/lib/auth-util";

export async function GET(req) {
    try {
        const user = await getAuthUser();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const employeeId = searchParams.get("employeeId");

        let filter = {};

        // SaaS PROTECTION: Restrict by organization
        if (user.role === "admin" || user.role === "supervisor") {
            const orgEmployees = await prisma.employee.findMany({ 
                where: { organizationId: user.organizationId },
                select: { id: true }
            });
            const validIds = orgEmployees.map(e => e.id);
            filter.employeeId = { in: validIds };
        } else if (user.role === "employee") {
            filter.employeeId = user.id;
        }

        if (status) filter.status = status;
        
        // This handles cases where an admin explicitly searches for an employee id
        if (employeeId && user.role !== "employee") {
            const targetEmp = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] },
                select: { id: true }
            });
            if (targetEmp) {
                filter.employeeId = targetEmp.id;
            } else {
                filter.employeeId = employeeId;
            }
        }

        const rawLoans = await prisma.loan.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' }
        });

        const formattedLoans = await Promise.all(rawLoans.map(async (loan) => {
            const empId = loan.employeeId;
            let emp = null;
            if (empId) {
                emp = await prisma.employee.findFirst({ where: { OR: [{ id: empId }, { mongoId: empId }] } });
                if (!emp) {
                    emp = await prisma.user.findFirst({ where: { OR: [{ id: empId }, { mongoId: empId }] } });
                }
            }

            let name = "Unknown";
            let email = "";
            let finalEmpId = null;

            if (emp) {
                finalEmpId = emp.id;
                name = emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unknown";
                email = emp.email || "";
            }

            let approvedByDetails = null;
            const docData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
            const approverId = docData.approvedBy;
            if (approverId) {
                const approver = await prisma.user.findFirst({ where: { OR: [{ id: approverId }, { mongoId: approverId }] } });
                if (approver) approvedByDetails = { _id: approver.id, name: approver.name };
            }

            return {
                _id: loan.id,
                id: loan.id,
                status: loan.status,
                amount: loan.amount,
                emi: loan.emi,
                ...docData,
                employee: {
                    _id: finalEmpId,
                    name,
                    email,
                },
                approvedBy: approvedByDetails,
                createdAt: loan.createdAt
            };
        }));

        return NextResponse.json({ loans: formattedLoans });
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

        if (!amount || !reason || amount <= 0) {
            return NextResponse.json(
                { message: "Invalid input" },
                { status: 400 }
            );
        }

        // Determine target employee
        let targetEmployeeId = user.id;
        let onModel = user.role === "employee" ? "Employee" : "User";

        if ((user.role === "admin" || user.role === "super_admin") && employeeId) {
            // Admin is creating a loan for a specific employee
            const targetEmployee = await prisma.employee.findFirst({
                where: { OR: [{ id: employeeId }, { mongoId: employeeId }] }
            });

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

        const newLoanRecord = await prisma.loan.create({
            data: {
                employeeId: targetEmployeeId,
                amount: parseFloat(amount),
                status: "Pending",
                loanData: {
                    employee: targetEmployeeId,
                    onModel,
                    amount,
                    reason,
                    type: type || "Advance",
                    installments: installments || 1
                }
            }
        });

        return NextResponse.json({
            message: "Loan requested successfully",
            loan: {
                _id: newLoanRecord.id,
                status: newLoanRecord.status,
                ...newLoanRecord.loanData
            },
        });
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
