import { NextResponse } from "next/server";
import prisma from '@/lib/db/prisma';
import { syncLeaveApplicationToPayroll } from "@/lib/payroll/leave-sync-engine";

export async function GET() {
    try {
        const employees = await prisma.employee.findMany();
        const lokeek = employees.find(e => 
            e.firstName === "Lokeek" || 
            (e.personalDetails && typeof e.personalDetails === "object" && e.personalDetails.firstName === "Lokeek")
        );

        if (!lokeek) return NextResponse.json({ error: "Lokeek not found" });

        const apps = await prisma.leaveApplication.findMany({
            where: {
                employeeId: lokeek.id
            }
        });

        // Filter apps by status = "approved" in memory to be DB-agnostic
        const approvedApps = apps.filter(a => {
            const status = a.status || (a.modelData && typeof a.modelData === "object" && a.modelData.status) || "";
            return /^approved$/i.test(status);
        });
        
        let syncStatus = "No approved apps found";
        if (approvedApps.length > 0) {
            await syncLeaveApplicationToPayroll(approvedApps[0].id);
            syncStatus = "Sync triggered successfully";
        }

        const leaves = await prisma.leave.findMany({
            where: { employeeId: lokeek.id }
        });

        return NextResponse.json({
            syncStatus,
            appsCount: approvedApps.length,
            apps: approvedApps.map(a => {
                const data = a.modelData && typeof a.modelData === "object" ? a.modelData : {};
                return {
                    start: a.startDate || data.startDate,
                    end: a.endDate || data.endDate,
                    type: a.leaveType || data.leaveType,
                    status: a.status || data.status
                };
            }),
            leaves: leaves.map(l => ({
                month: l.month,
                status: l.status,
                summary: l.summary,
                used: l.annualLeaveBalance?.used || 0,
                remaining: l.annualLeaveBalance?.remaining || 0,
                leavesCount: l.leaves ? (Array.isArray(l.leaves) ? l.leaves.length : 0) : 0
            }))
        });
    } catch (e) {
        return NextResponse.json({ error: e.message, stack: e.stack });
    }
}
