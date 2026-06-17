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

    if (run.status !== 'Locked') {
        return NextResponse.json({ error: "A payroll run must be Locked before it can be Published" }, { status: 400 });
    }

    const runData = run.runData && typeof run.runData === 'object' ? run.runData : {};

    // Publish the run
    const updatedRun = await prisma.payrollRun.update({
        where: { id: run.id },
        data: {
            status: 'Published',
            runData: {
                ...runData,
                status: 'Published',
                updatedBy: authUser.id
            }
        }
    });

    // Publish all associated payslips
    await prisma.payslip.updateMany({
        where: { payrollRunId: run.id, status: 'Locked' },
        data: { 
            status: 'Published',
            generatedById: authUser.id 
        }
    });

    const runIdVal = runData.runId || run.id;

    await logActivity({
      action: "published",
      entity: "PayrollRun",
      entityId: runIdVal,
      description: `Published payroll run ${runIdVal} for ${run.month}/${run.year}`,
      performedBy: { userId: authUser.id, name: authUser.name },
      req: request
    });

    return NextResponse.json({ message: "Payroll run published successfully. Payslips are now visible to employees.", run: updatedRun }, { status: 200 });

  } catch (error) {
    console.error("Publish Payroll Run Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
