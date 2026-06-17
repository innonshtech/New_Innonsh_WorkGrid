import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { logActivity } from "@/lib/logger";
import { getAuthUser, authorize } from "@/lib/auth-util";

export async function PUT(request, { params }) {
  try {
    const authUser = await getAuthUser();
    authorize(authUser, ["admin", "super_admin"]);

    const { id } = await params;

    const run = await prisma.payrollRun.findFirst({ where: { OR: [{ id: id }, { mongoId: id }] } });
    if (!run) {
      return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
    }

    // SaaS PROTECTION
    if (authUser.role === "admin" && run.organizationId !== authUser.organizationId) {
       return NextResponse.json({ error: "Forbidden: This payroll run belongs to another organization" }, { status: 403 });
    }

    if (run.status !== 'Draft') {
        return NextResponse.json({ error: `Cannot lock a run that is currently ${run.status}` }, { status: 400 });
    }

    const runData = run.runData && typeof run.runData === 'object' ? run.runData : {};

    // Lock the run
    const updatedRun = await prisma.payrollRun.update({
        where: { id: run.id },
        data: {
            status: 'Locked',
            runData: {
                ...runData,
                status: 'Locked',
                updatedBy: authUser.id
            }
        }
    });

    // Lock all associated payslips
    await prisma.payslip.updateMany({
        where: { payrollRunId: run.id, status: 'Draft' },
        data: { 
            status: 'Locked',
            generatedById: authUser.id 
        }
    });

    const runIdVal = runData.runId || run.id;

    await logActivity({
      action: "locked",
      entity: "PayrollRun",
      entityId: runIdVal,
      description: `Locked payroll run ${runIdVal} for ${run.month}/${run.year}`,
      performedBy: { userId: authUser.id, name: authUser.name },
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

    return NextResponse.json({ message: "Payroll run locked successfully", run: formattedRun }, { status: 200 });

  } catch (error) {
    console.error("Lock Payroll Run Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
