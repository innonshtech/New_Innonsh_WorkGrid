const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== EmployeeCategory Records ===");
        const ec = await prisma.employeeCategory.findMany({ take: 5 });
        console.log(ec);

        console.log("\n=== EmployeeCategoryexport Records ===");
        const ecexport = await prisma.employeeCategoryexport.findMany({ take: 5 });
        console.log(ecexport);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
