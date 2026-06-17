const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Checking CompOffRequest and Leave records...");
        
        const compOffCount = await prisma.compOffRequest.count();
        const leaveCount = await prisma.leave.count();
        
        console.log(`\n📊 Database Counts:`);
        console.log(`- CompOffRequest: ${compOffCount} records`);
        console.log(`- Leave: ${leaveCount} records`);
        
        if (compOffCount > 0) {
            console.log("\n📄 Sample CompOffRequest (up to 3):");
            const comps = await prisma.compOffRequest.findMany({ take: 3 });
            console.log(JSON.stringify(comps, null, 2));
        } else {
            console.log("\n❌ No CompOffRequest records found.");
        }

        if (leaveCount > 0) {
            console.log("\n📄 Sample Leave (up to 3):");
            const leaves = await prisma.leave.findMany({ take: 3 });
            console.log(JSON.stringify(leaves, null, 2));
        } else {
            console.log("\n❌ No Leave records found.");
        }
    } catch (error) {
        console.error("❌ Error running diagnostic script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
