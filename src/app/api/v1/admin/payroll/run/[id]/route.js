import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { logActivity } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });

        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        // Fetch all payslips for this run
        const payslips = await prisma.payslip.findMany({ where: { payrollRunId: run.id } });

        // Enrich payslips with employee data for the frontend
        const employeeIds = [...new Set(payslips.map(p => p.employeeId).filter(Boolean))];
        const employees = employeeIds.length > 0 ? await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                designation: true,
                employeeType: true,
                category: true,
                organizationId: true
            }
        }) : [];

        const employeeMap = {};
        employees.forEach(e => {
            employeeMap[e.id] = e;
        });

        const enrichedPayslips = payslips.map(p => {
            const emp = employeeMap[p.employeeId];
            return {
                ...p,
                _id: p.id,
                employee: emp ? {
                    _id: emp.id,
                    id: emp.id,
                    employeeId: emp.employeeId,
                    personalDetails: {
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email
                    },
                    jobDetails: {
                        department: emp.department,
                        designation: emp.designation,
                        employeeType: emp.employeeType,
                        category: emp.category,
                        organizationId: emp.organizationId
                    },
                    employeeType: emp.employeeType,
                    category: emp.category
                } : null
            };
        });

        const formattedRun = {
            _id: run.id,
            id: run.id,
            status: run.status,
            month: run.month,
            year: run.year,
            organizationId: run.organizationId,
            processedBy: run.processedBy,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            ...(run.runData && typeof run.runData === 'object' ? run.runData : {})
        };

        return NextResponse.json({ run: formattedRun, payslips: enrichedPayslips });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, updatedBy } = body;

        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        // Prevent transitions from Locked/Cancelled
        if (run.status === 'Locked' || run.status === 'Cancelled') {
            return NextResponse.json({ error: "Cannot modify a Locked or Cancelled payroll run." }, { status: 400 });
        }

        const updateData = { status: status || run.status };
        if (status === 'Locked') {
            const currentRunData = run.runData && typeof run.runData === 'object' ? run.runData : {};
            updateData.runData = {
                ...currentRunData,
                lockedBy: updatedBy,
                lockedAt: new Date()
            };
        }

        const updatedRun = await prisma.payrollRun.update({
            where: { id: run.id },
            data: updateData
        });

        const runIdVal = run.runData && typeof run.runData === 'object' ? (run.runData.runId || run.id) : run.id;

        await logActivity({
            action: "updated",
            entity: "PayrollRun",
            entityId: runIdVal,
            description: `Payroll run status changed to ${updateData.status}`,
            performedBy: { userId: updatedBy },
            req: request
        });

        const formattedRun = {
            _id: updatedRun.id,
            id: updatedRun.id,
            status: updatedRun.status,
            month: updatedRun.month,
            year: updatedRun.year,
            organizationId: updatedRun.organizationId,
            processedBy: updatedRun.processedBy,
            createdAt: updatedRun.createdAt,
            updatedAt: updatedRun.updatedAt,
            ...(updatedRun.runData && typeof updatedRun.runData === 'object' ? updatedRun.runData : {})
        };

        return NextResponse.json(formattedRun);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;

        const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
        if (!run) return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });

        if (run.status === 'Locked') {
            return NextResponse.json({ error: "Cannot rollback a Locked payroll run." }, { status: 400 });
        }

        // Rollback: Delete all payslips generated in this run
        await prisma.payslip.deleteMany({
            where: {
                month: run.month,
                year: run.year,
                status: 'Draft'
            }
        });

        // Reset RetroAdjustments to 'Pending' in-memory / JSON columns
        const retros = await prisma.retroAdjustment.findMany();
        for (const retro of retros) {
            const mData = retro.modelData && typeof retro.modelData === 'object' ? retro.modelData : {};
            if (mData.appliedInMonth === run.month && mData.appliedInYear === run.year) {
                const updatedMData = { ...mData };
                delete updatedMData.appliedInMonth;
                delete updatedMData.appliedInYear;
                await prisma.retroAdjustment.update({
                    where: { id: retro.id },
                    data: {
                        status: 'Pending',
                        modelData: updatedMData
                    }
                });
            }
        }

        await prisma.payrollRun.delete({ where: { id: run.id } });

        const runIdVal = run.runData && typeof run.runData === 'object' ? (run.runData.runId || run.id) : run.id;
        const generatedByVal = run.runData && typeof run.runData === 'object' ? (run.runData.generatedBy || 'system') : 'system';

        await logActivity({
            action: "deleted",
            entity: "PayrollRun",
            entityId: runIdVal,
            description: `Rolled back and deleted payroll run for ${run.month}/${run.year}`,
            performedBy: { userId: generatedByVal },
            req: request
        });

        return NextResponse.json({ message: "Payroll run rolled back and deleted successfully" });
    } catch (error) {
        console.error("Rollback Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
