const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== EmployeeTypeexport Records ===");
        const et = await prisma.employeeTypeexport.findMany();
        console.log(et);

        console.log("\n=== EmployeeCategoryexport Records ===");
        const ec = await prisma.employeeCategoryexport.findMany();
        console.log(ec);

        console.log("\n=== EmployeeSubCategoryexport Records ===");
        const esc = await prisma.employeeSubCategoryexport.findMany();
        console.log(esc);

        console.log("\n=== Documentexport Records ===");
        const doc = await prisma.documentexport.findMany();
        console.log(doc);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
