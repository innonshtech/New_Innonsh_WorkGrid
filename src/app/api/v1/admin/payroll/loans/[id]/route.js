import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function PUT(req, { params }) {
    try {
        const authUser = await getAuthUser();
        authorize(authUser, ["admin", "super_admin"]);
        
        const { id } = await params;
        const body = await req.json();
        const { status, rejectionReason } = body;

        const loan = await prisma.loan.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!loan) {
            return NextResponse.json({ message: "Loan not found" }, { status: 404 });
        }

        const empId = loan.employeeId || (loan.loanData && loan.loanData.employee);

        // SaaS PROTECTION: Admin restricted to their org
        if (authUser.role === "admin" && empId) {
            const loanEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: empId }, { mongoId: empId }] } });
            if (!loanEmployee || loanEmployee.organizationId !== authUser.organizationId) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        }

        const updateData = {};
        if (status) {
            updateData.status = status;
            const loanData = loan.loanData && typeof loan.loanData === 'object' ? loan.loanData : {};
            
            if (status === "Approved") {
                loanData.approvedBy = authUser.id;
                loanData.approvalDate = new Date().toISOString();
                
                const installments = Number(loanData.installments || 1);
                const amount = loan.amount || loanData.amount || 0;
                const installmentAmount = Math.round(amount / installments);
                updateData.emi = installmentAmount;
                
                // --- AUTOMATIC REPAYMENT SCHEDULE GENERATION ---
                if (!loanData.repaymentSchedule || loanData.repaymentSchedule.length === 0) {
                    const schedule = [];
                    const startDate = new Date();
                    
                    for (let i = 1; i <= installments; i++) {
                        const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 10);
                        schedule.push({
                            dueDate: dueDate.toISOString(),
                            amount: i === installments ? (amount - (installmentAmount * (i - 1))) : installmentAmount,
                            status: "Pending"
                        });
                    }
                    loanData.repaymentSchedule = schedule;
                }
            } else if (status === "Rejected") {
                loanData.rejectionReason = rejectionReason;
            }
            updateData.loanData = loanData;
        }

        const updatedLoan = await prisma.loan.update({
            where: { id: loan.id },
            data: updateData
        });
        
        return NextResponse.json({ message: "Loan updated successfully", loan: updatedLoan });
    } catch (error) {
        console.error("Error updating loan:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const authUser = await getAuthUser();
        
        const { id } = await params;
        const loan = await prisma.loan.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!loan) {
            return NextResponse.json({ message: "Loan not found" }, { status: 404 });
        }

        // Only allow delete if Pending
        if (loan.status !== "Pending") {
            return NextResponse.json({ message: "Cannot delete processed loan" }, { status: 400 });
        }

        const empId = loan.employeeId || (loan.loanData && loan.loanData.employee);

        // SaaS PROTECTION
        if (authUser.role === 'admin' && empId) {
            const loanEmployee = await prisma.employee.findFirst({ where: { OR: [{ id: empId }, { mongoId: empId }] } });
            if (!loanEmployee || loanEmployee.organizationId !== authUser.organizationId) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        } else if (authUser.role === 'employee' && empId?.toString() !== authUser.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await prisma.loan.delete({ where: { id: loan.id } });
        return NextResponse.json({ message: "Loan request deleted" });

    } catch (error) {
        console.error("Error deleting loan:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
