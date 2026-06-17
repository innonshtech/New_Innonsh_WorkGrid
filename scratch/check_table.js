const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== EmployeeType Columns ===");
        const etCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'EmployeeType'
        `;
        console.log(etCols);

        console.log("\n=== EmployeeSubCategory Columns ===");
        const escCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'EmployeeSubCategory'
        `;
        console.log(escCols);

        console.log("\n=== Document Columns ===");
        const docCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Document'
        `;
        console.log(docCols);

        console.log("\n=== Employee Columns ===");
        const empCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Employee'
        `;
        console.log(empCols);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
