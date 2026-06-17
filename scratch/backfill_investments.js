const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🚀 Starting InvestmentDeclaration columns backfill...");

        const declarations = await prisma.investmentDeclaration.findMany();
        console.log(`Found ${declarations.length} InvestmentDeclaration records in total.`);

        let updatedCount = 0;
        for (const decl of declarations) {
            const legacyEmpId = decl.employeeId;
            if (legacyEmpId) {
                // If it is not a valid UUID, it's a mongoId from the import
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(legacyEmpId);
                
                let employee = null;
                if (isUuid) {
                    employee = await prisma.employee.findUnique({ where: { id: legacyEmpId } });
                } else {
                    employee = await prisma.employee.findFirst({
                        where: { OR: [{ id: legacyEmpId }, { mongoId: legacyEmpId }] }
                    });
                }

                if (employee) {
                    await prisma.investmentDeclaration.update({
                        where: { id: decl.id },
                        data: {
                            employeeId: employee.id,
                            organizationId: employee.organizationId
                        }
                    });
                    console.log(`✅ Updated declaration: ${decl.id} to Employee UUID: ${employee.id}`);
                    updatedCount++;
                } else {
                    console.log(`⚠️ Could not find Employee for ID: ${legacyEmpId} on InvestmentDeclaration: ${decl.id}`);
                }
            }
        }
        console.log(`\n🎉 Backfill complete. Updated ${updatedCount} records.`);

    } catch (error) {
        console.error("❌ Error running backfill script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
