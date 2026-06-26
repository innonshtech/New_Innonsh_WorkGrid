import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function PUT(req, { params }) {
    try {
        const authUser = await getAuthUser();
        
        const { id } = await params;
        const body = await req.json();
        const { status, rejectionReason } = body;

        let loan = await prisma.loan.findFirst({
            where: { OR: [{ id }, { mongoId: id }] },
            include: {
                employee: { select: { organizationId: true, id: true, mongoId: true } }
            }
        });
        
        if (!loan) {
            return NextResponse.json({ message: "Loan not found" }, { status: 404 });
        }

        // SaaS PROTECTION: Admin restricted to their org
        if (authUser.role === "admin") {
            const orgId = loan.employee?.organizationId || loan.loanData?.employee?.organizationId;
            if (orgId !== authUser.organizationId) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        }

        let loanData = { ...loan.loanData };

        // Admin Operations: Approve/Reject
        if (authUser.role === "admin" || authUser.role === "super_admin") {
            if (status) {
                loan.status = status;
                loanData.status = status;
                
                if (status === "Approved") {
                    loanData.approvedBy = authUser.id;
                    loanData.approvalDate = new Date().toISOString();
                    
                    // --- AUTOMATIC REPAYMENT SCHEDULE GENERATION ---
                    if (!loanData.repaymentSchedule || loanData.repaymentSchedule.length === 0) {
                        const schedule = [];
                        const installmentAmount = Math.round(loan.amount / (loanData.installments || 1));
                        const startDate = new Date();
                        
                        for (let i = 1; i <= (loanData.installments || 1); i++) {
                            const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 10); // 10th of each following month
                            schedule.push({
                                dueDate: dueDate.toISOString(),
                                amount: i === loanData.installments ? (loan.amount - (installmentAmount * (i - 1))) : installmentAmount,
                                status: "Pending"
                            });
                        }
                        loanData.repaymentSchedule = schedule;
                    }
                } else if (status === "Rejected") {
                    loanData.rejectionReason = rejectionReason;
                }
            }
        } else {
            return NextResponse.json({ message: "Unauthorized to update status" }, { status: 403 });
        }

        const updatePayload = {
            status: loan.status,
            loanData: loanData
        };
        if (loan.status === "Approved") {
            const installments = Number(loanData.installments || 1);
            const installmentAmount = Math.round(loan.amount / installments);
            updatePayload.emi = installmentAmount;
        }

        const updatedLoan = await prisma.loan.update({
            where: { id: loan.id },
            data: updatePayload
        });

        return NextResponse.json({ message: "Loan updated successfully", loan: { _id: updatedLoan.id, ...updatedLoan.loanData } });
    } catch (error) {
        console.error("Error updating loan:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const authUser = await getAuthUser();

        const { id } = await params;
        const loan = await prisma.loan.findFirst({
            where: { OR: [{ id }, { mongoId: id }] },
            include: {
                employee: { select: { organizationId: true, id: true, mongoId: true } }
            }
        });
        
        if (!loan) {
            return NextResponse.json({ message: "Loan not found" }, { status: 404 });
        }

        // Only allow delete if Pending
        if (loan.status !== "Pending" && loan.loanData?.status !== "Pending") {
            return NextResponse.json({ message: "Cannot delete processed loan" }, { status: 400 });
        }

        // SaaS PROTECTION
        if (authUser.role === 'admin') {
            const orgId = loan.employee?.organizationId || loan.loanData?.employee?.organizationId;
            if (orgId !== authUser.organizationId) {
                return NextResponse.json({ message: "Forbidden" }, { status: 403 });
            }
        } else if (authUser.role === 'employee' && loan.employeeId !== authUser.id && loan.employee?.mongoId !== authUser.id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await prisma.loan.delete({
            where: { id: loan.id }
        });
        
        return NextResponse.json({ message: "Loan request deleted" });

    } catch (error) {
        console.error("Error deleting loan:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
