const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== EmployeeType Records ===");
        const ets = await prisma.employeeType.findMany({ take: 3 });
        console.log(ets);

        console.log("\n=== EmployeeSubCategory Records ===");
        const escs = await prisma.employeeSubCategory.findMany({ take: 3 });
        console.log(escs);

        console.log("\n=== Document Records ===");
        const docs = await prisma.document.findMany({ take: 3 });
        console.log(docs);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
