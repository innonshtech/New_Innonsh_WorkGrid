const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🔍 Checking InvestmentDeclaration records...");
        
        const count = await prisma.investmentDeclaration.count();
        console.log(`\n📊 Database Counts:`);
        console.log(`- InvestmentDeclaration: ${count} records`);
        
        if (count > 0) {
            console.log("\n📄 Sample InvestmentDeclarations (up to 5):");
            const declarations = await prisma.investmentDeclaration.findMany({ take: 5 });
            console.log(JSON.stringify(declarations, null, 2));
        } else {
            console.log("\n❌ No InvestmentDeclaration records found.");
        }
    } catch (error) {
        console.error("❌ Error running diagnostic script:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
