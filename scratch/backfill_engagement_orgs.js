const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetOrgId = "1713d3da-2293-43c2-a7f9-c15a35b9c453";
  console.log("=== STARTING ENGAGEMENT DATA BACKFILL ===");

  // Fetch all employees to map MongoID -> UUID
  const employees = await prisma.employee.findMany();
  const empMap = {};
  employees.forEach(e => {
    empMap[e.id] = e.id;
    if (e.mongoId) {
      empMap[e.mongoId] = e.id;
    }
  });

  // 1. Backfill PulseSurveys
  const surveys = await prisma.pulseSurvey.findMany();
  console.log(`Processing ${surveys.length} surveys...`);
  for (const s of surveys) {
    await prisma.pulseSurvey.update({
      where: { id: s.id },
      data: {
        organizationId: targetOrgId
      }
    });
    console.log(`- Updated Survey ${s.id} with orgId = ${targetOrgId}`);
  }

  // 2. Backfill PulseResponses
  const responses = await prisma.pulseResponse.findMany();
  console.log(`Processing ${responses.length} responses...`);
  for (const r of responses) {
    const resolvedEmpId = empMap[r.employeeId] || r.employeeId || null;
    await prisma.pulseResponse.update({
      where: { id: r.id },
      data: {
        organizationId: targetOrgId,
        employeeId: resolvedEmpId
      }
    });
    console.log(`- Updated Response ${r.id} with orgId = ${targetOrgId}, employeeId = ${resolvedEmpId}`);
  }

  // 3. Backfill ShoutOuts
  const shoutouts = await prisma.shoutOut.findMany();
  console.log(`Processing ${shoutouts.length} shoutouts...`);
  for (const so of shoutouts) {
    const resolvedFrom = empMap[so.fromEmployeeId] || so.fromEmployeeId || null;
    const resolvedTo = empMap[so.toEmployeeId] || so.toEmployeeId || null;

    const currentData = so.shoutOutData && typeof so.shoutOutData === 'object' ? so.shoutOutData : {};
    const updatedData = {
      ...currentData,
      organizationId: targetOrgId
    };

    await prisma.shoutOut.update({
      where: { id: so.id },
      data: {
        fromEmployeeId: resolvedFrom,
        toEmployeeId: resolvedTo,
        shoutOutData: updatedData
      }
    });
    console.log(`- Updated ShoutOut ${so.id} with from = ${resolvedFrom}, to = ${resolvedTo}`);
  }

  console.log("=== ENGAGEMENT DATA BACKFILL COMPLETE ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
