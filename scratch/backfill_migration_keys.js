const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🚀 Starting database relational columns backfill...");

        // 1. Backfill LeaveApplication
        const leaveApps = await prisma.leaveApplication.findMany({
            where: { employeeId: null }
        });
        console.log(`Found ${leaveApps.length} LeaveApplication records with null employeeId.`);

        let leaveAppsUpdated = 0;
        for (const app of leaveApps) {
            const legacyEmpId = app.modelData?.employee;
            if (legacyEmpId) {
                const employee = await prisma.employee.findFirst({
                    where: { OR: [{ id: legacyEmpId }, { mongoId: legacyEmpId }] }
                });
                if (employee) {
                    await prisma.leaveApplication.update({
                        where: { id: app.id },
                        data: {
                            employeeId: employee.id,
                            organizationId: employee.organizationId
                        }
                    });
                    leaveAppsUpdated++;
                } else {
                    console.log(`⚠️ Could not find Employee for legacy ID: ${legacyEmpId} on LeaveApplication: ${app.id}`);
                }
            }
        }
        console.log(`✅ Updated ${leaveAppsUpdated} LeaveApplication records.`);

        // 2. Backfill CompOffRequest
        const compOffs = await prisma.compOffRequest.findMany({
            where: { employeeId: null }
        });
        console.log(`Found ${compOffs.length} CompOffRequest records with null employeeId.`);

        let compOffsUpdated = 0;
        for (const req of compOffs) {
            const legacyEmpId = req.modelData?.employee;
            if (legacyEmpId) {
                const employee = await prisma.employee.findFirst({
                    where: { OR: [{ id: legacyEmpId }, { mongoId: legacyEmpId }] }
                });
                if (employee) {
                    await prisma.compOffRequest.update({
                        where: { id: req.id },
                        data: {
                            employeeId: employee.id,
                            organizationId: employee.organizationId
                        }
                    });
                    compOffsUpdated++;
                } else {
                    console.log(`⚠️ Could not find Employee for legacy ID: ${legacyEmpId} on CompOffRequest: ${req.id}`);
                }
            }
        }
        console.log(`✅ Updated ${compOffsUpdated} CompOffRequest records.`);

    } catch (error) {
        console.error("❌ Error running backfill script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
