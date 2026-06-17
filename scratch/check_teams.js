const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== Team Columns ===");
        const teamCols = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Team'
        `;
        console.log(teamCols);

        console.log("\n=== Team Records ===");
        const teams = await prisma.team.findMany({ take: 3 });
        console.log(teams);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
