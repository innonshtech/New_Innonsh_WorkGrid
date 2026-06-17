const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Checking Leave Applications and Approval Workflow records...");
        
        const leaveAppsCount = await prisma.leaveApplication.count();
        const approvalWorkflowsCount = await prisma.approvalWorkflow.count();
        
        console.log(`\n📊 Database Counts:`);
        console.log(`- LeaveApplication: ${leaveAppsCount} records`);
        console.log(`- ApprovalWorkflow: ${approvalWorkflowsCount} records`);
        
        if (leaveAppsCount > 0) {
            console.log("\n📄 Sample Leave Applications (up to 3):");
            const apps = await prisma.leaveApplication.findMany({ take: 3 });
            console.log(JSON.stringify(apps, null, 2));
        } else {
            console.log("\n❌ No LeaveApplication records found.");
        }

        if (approvalWorkflowsCount > 0) {
            console.log("\n📄 Sample Approval Workflows (up to 3):");
            const workflows = await prisma.approvalWorkflow.findMany({ take: 3 });
            console.log(JSON.stringify(workflows, null, 2));
        } else {
            console.log("\n❌ No ApprovalWorkflow records found.");
        }
    } catch (error) {
        console.error("❌ Error running diagnostic script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
