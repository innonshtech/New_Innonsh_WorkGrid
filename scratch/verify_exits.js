const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function verify() {
    try {
        console.log("1. Fetching exit requests...");
        const exitRequests = await prisma.exitRequest.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(`Found ${exitRequests.length} exit requests.`);

        console.log("\n2. Processing employee details with UUID guards...");
        const employeeIds = [...new Set(exitRequests.map(r => r.employeeId).filter(Boolean))];
        
        // Add a dummy legacy Mongo ID to test if it causes database crashes
        employeeIds.push("66123abc456def7890123456");
        
        const validUUIDEmployeeIds = employeeIds.filter(isValidUUID);
        
        const employees = await prisma.employee.findMany({
            where: {
                OR: [
                    { id: { in: validUUIDEmployeeIds } },
                    { mongoId: { in: employeeIds } }
                ]
            },
            select: { id: true, mongoId: true, firstName: true, lastName: true, email: true }
        });
        console.log(`Successfully fetched ${employees.length} employees (including legacy mongoId checks without crashing PostgreSQL)!`);

        console.log("\nQuery verification complete. All database operations succeeded without UUID syntax errors.");
    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
