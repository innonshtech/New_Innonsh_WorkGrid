const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfillTeamOrgIds() {
  console.log("Starting backfill process for Team organizationId...");
  
  // Find all teams with null organizationId
  const teamsWithNullOrg = await prisma.team.findMany({
    where: { organizationId: null }
  });
  
  console.log(`Found ${teamsWithNullOrg.length} teams with null organizationId.`);
  
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const team of teamsWithNullOrg) {
    if (!team.departmentId) {
      console.log(`Team ${team.name} (ID: ${team.id}) has no departmentId. Cannot backfill.`);
      failedCount++;
      continue;
    }
    
    // Find the department to get its organizationId
    const department = await prisma.department.findFirst({
      where: {
        OR: [
          { id: team.departmentId },
          { mongoId: team.departmentId }
        ]
      }
    });
    
    if (department && department.organizationId) {
      await prisma.team.update({
        where: { id: team.id },
        data: { organizationId: department.organizationId }
      });
      console.log(`Updated team ${team.name} (ID: ${team.id}) with organizationId: ${department.organizationId}`);
      updatedCount++;
    } else {
      console.log(`Could not find a valid department or organizationId for team ${team.name} (ID: ${team.id}).`);
      failedCount++;
    }
  }
  
  console.log(`\nBackfill complete!`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Failed/Skipped: ${failedCount}`);
}

backfillTeamOrgIds()
  .catch(e => console.error("Error during backfill:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
