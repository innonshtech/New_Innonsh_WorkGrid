import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const runRecord = await prisma.payrollRun.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });

        if (!runRecord) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        let org = null;
        if (runRecord.organizationId) {
            org = await prisma.organization.findFirst({
                where: { id: runRecord.organizationId },
                select: { name: true }
            });
        }

        let generatedBy = null;
        const genById = runRecord.processedBy || (runRecord.runData && runRecord.runData.generatedBy);
        if (genById) {
            generatedBy = await prisma.user.findFirst({
                where: { OR: [{ id: genById }, { mongoId: genById }] },
                select: { name: true }
            });
        }

        const run = {
            _id: runRecord.id,
            status: runRecord.status,
            month: runRecord.month,
            year: runRecord.year,
            ...(runRecord.runData && typeof runRecord.runData === 'object' ? runRecord.runData : {}),
            organizationId: org,
            generatedBy
        };

        // Fetch all payslips for this run
        const rawPayslips = await prisma.payslip.findMany({
            where: {
                OR: [
                    { payrollRunId: runRecord.id },
                    { payrollRunId: runRecord.mongoId || undefined }
                ]
            }
        });

        const payslips = await Promise.all(rawPayslips.map(async p => {
            let employee = null;
            const empId = p.employeeId;
            if (empId) {
                const e = await prisma.employee.findFirst({
                    where: { OR: [{ id: empId }, { mongoId: empId }] }
                });
                if (e) {
                    employee = {
                        _id: e.id,
                        id: e.id,
                        employeeId: e.employeeId,
                        personalDetails: {
                            firstName: e.firstName,
                            lastName: e.lastName,
                            email: e.email,
                            phone: e.phone,
                            bloodGroup: e.bloodGroup,
                            dateOfJoining: e.dateOfJoining,
                            dateOfBirth: e.dateOfBirth,
                            gender: e.gender,
                            address: e.address
                        },
                        jobDetails: {
                            department: e.department,
                            departmentId: e.departmentId,
                            employeeType: e.employeeType,
                            employeeTypeId: e.employeeTypeId,
                            category: e.category,
                            categoryId: e.categoryId,
                            organizationId: e.organizationId,
                            designation: e.designation,
                            reportingManager: e.reportingManager
                        }
                    };
                }
            }
            return {
                _id: p.id,
                id: p.id,
                mongoId: p.mongoId,
                payslipId: p.payslipId,
                month: p.month,
                year: p.year,
                basicSalary: p.basicSalary,
                grossSalary: p.grossSalary,
                totalDeductions: p.totalDeductions,
                netSalary: p.netSalary,
                workingDays: p.workingDays,
                presentDays: p.presentDays,
                leaveDays: p.leaveDays,
                paidLeaveDays: p.paidLeaveDays,
                unpaidLeaveDays: p.unpaidLeaveDays,
                overtimeHours: p.overtimeHours,
                overtimeAmount: p.overtimeAmount,
                totalDays: p.totalDays,
                weeklyOffs: p.weeklyOffs,
                halfDays: p.halfDays,
                holidays: p.holidays,
                paidDays: p.paidDays,
                lopDays: p.lopDays,
                status: p.status,
                paymentDate: p.paymentDate,
                paymentMethod: p.paymentMethod,
                notes: p.notes,
                organizationName: p.organizationName,
                salaryType: p.salaryType,
                employeeType: p.employeeType,
                earnings: p.earnings || [],
                deductions: p.deductions || [],
                pfDetails: p.pfDetails || {},
                esicDetails: p.esicDetails || {},
                professionalTax: p.professionalTax,
                leaveDetails: p.leaveDetails || {},
                isPFApplicable: p.isPFApplicable,
                isESICApplicable: p.isESICApplicable,
                isPTApplicable: p.isPTApplicable,
                generatedBy: p.generatedById,
                approvedBy: p.approvedById,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                employee
            };
        }));

        return NextResponse.json({ run, payslips });
    } catch (error) {
        console.error("GET Payroll Run Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, updatedBy } = body;

        let run = await prisma.payrollRun.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        // Prevent transitions from Locked/Cancelled
        if (run.status === 'Locked' || run.status === 'Cancelled') {
            return NextResponse.json({ error: "Cannot modify a Locked or Cancelled payroll run." }, { status: 400 });
        }

        const newStatus = status || run.status;
        const updates = {
            status: newStatus,
            runData: {
                ...(run.runData && typeof run.runData === 'object' ? run.runData : {})
            }
        };

        if (status === 'Locked') {
            if (!updates.runData.lockedBy) {
                updates.runData.lockedBy = updatedBy;
                updates.runData.lockedAt = new Date().toISOString();
            }
        }

        run = await prisma.payrollRun.update({
            where: { id: run.id },
            data: updates
        });

        await logActivity({
            action: "updated",
            entity: "PayrollRun",
            entityId: (run.runData && run.runData.runId) || run.id,
            description: `Payroll run status changed to ${run.status}`,
            performedBy: { userId: updatedBy },
            req: request
        });

        const formatted = {
            _id: run.id,
            status: run.status,
            ...(run.runData && typeof run.runData === 'object' ? run.runData : {})
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("PUT Payroll Run Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const run = await prisma.payrollRun.findFirst({
            where: { OR: [{ id }, { mongoId: id }] }
        });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        if (run.status === 'Locked') {
            return NextResponse.json({ error: "Cannot rollback a Locked payroll run." }, { status: 400 });
        }

        // Rollback: Delete all payslips generated in this run
        // Delete only Drafts
        const slipsToDelete = await prisma.payslip.findMany({
            where: {
                payrollRunId: run.id,
                status: 'Draft',
                month: run.month,
                year: run.year
            }
        });

        if (slipsToDelete.length > 0) {
            await prisma.payslip.deleteMany({
                where: { id: { in: slipsToDelete.map(s => s.id) } }
            });
        }

        // Wait, what about RetroAdjustment?
        // We'll reset them.
        const retrosToReset = await prisma.retroAdjustment.findMany();
        
        // Filter in memory for year
        const rToUpdate = retrosToReset.filter(r => 
            r.modelData && typeof r.modelData === 'object' &&
            r.modelData.appliedInMonth === run.month &&
            r.modelData.appliedInYear === run.year
        );
        
        for (const retro of rToUpdate) {
            const newModelData = { ...retro.modelData };
            delete newModelData.appliedInMonth;
            delete newModelData.appliedInYear;
            await prisma.retroAdjustment.update({
                where: { id: retro.id },
                data: { status: 'Pending', modelData: newModelData }
            });
        }

        await prisma.payrollRun.delete({ where: { id: run.id } });

        await logActivity({
            action: "deleted",
            entity: "PayrollRun",
            entityId: (run.runData && run.runData.runId) || run.id,
            description: `Rolled back and deleted payroll run for ${run.month}/${run.year}`,
            performedBy: { userId: (run.runData && run.runData.generatedBy) },
            req: request
        });

        return NextResponse.json({ message: "Payroll run rolled back and deleted successfully" });
    } catch (error) {
        console.error("Rollback Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

