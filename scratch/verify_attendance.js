const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function verify() {
    try {
        console.log("1. Fetching first employee record...");
        const employee = await prisma.employee.findFirst();
        if (!employee) {
            console.log("No employees found in DB.");
            return;
        }
        console.log(`Found employee: ${employee.firstName} ${employee.lastName} (ID: ${employee.id})`);

        console.log("\n2. Testing AttendanceRegularization queries...");
        const regularizations = await prisma.attendanceRegularization.findMany({
            where: { employeeId: employee.id },
            take: 5
        });
        console.log(`Found ${regularizations.length} regularization records.`);

        console.log("\n3. Testing Attendance queries with actualFilter simulation...");
        const targetId = employee.id;
        const actualFilter = {
            OR: [
                ...(isValidUUID(targetId) ? [{ employeeId: targetId }] : []),
                { employee: { mongoId: targetId } }
            ]
        };
        const attendances = await prisma.attendance.findMany({
            where: actualFilter,
            take: 5
        });
        console.log(`Found ${attendances.length} attendance records.`);

        console.log("\n4. Testing OvertimeRequest queries...");
        const overtimes = await prisma.overtimeRequest.findMany({
            where: { employeeId: employee.id },
            take: 5
        });
        console.log(`Found ${overtimes.length} overtime records.`);

        console.log("\n5. Testing PayrollConfig companyId query...");
        const config = await prisma.payrollConfig.findFirst({
            where: isValidUUID(employee.organizationId)
                ? { OR: [{ companyId: employee.organizationId }, { mongoId: employee.organizationId }] }
                : { mongoId: employee.organizationId }
        });
        console.log("PayrollConfig fetch successful:", !!config);

        console.log("\nAll employee payroll and attendance database queries completed successfully without exceptions!");
    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
