const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log('🚀 Starting replication of Talent Hub data (Appraisals, Goals, Skills, Career Paths)...');

    const aniketId = 'd1d32ec1-e8d9-4df5-8ac8-ca18296b55a0';

    // 1. Fetch Aniket's template records
    const appraisals = await prisma.appraisal.findMany({ where: { employeeId: aniketId } });
    const goals = await prisma.performanceGoal.findMany({ where: { employeeId: aniketId } });
    const skills = await prisma.skill.findMany({ where: { employeeId: aniketId } });
    const careerPaths = await prisma.careerPath.findMany({ where: { employeeId: aniketId } });

    console.log(`Aniket's source records:`);
    console.log(`- Appraisals: ${appraisals.length}`);
    console.log(`- Goals: ${goals.length}`);
    console.log(`- Skills: ${skills.length}`);
    console.log(`- Career Paths: ${careerPaths.length}`);

    // Fetch all other employees
    const employees = await prisma.employee.findMany({
      where: { id: { not: aniketId } }
    });

    console.log(`Found ${employees.length} other employees to replicate data for.`);

    let replicatedAppraisals = 0;
    let replicatedGoals = 0;
    let replicatedSkills = 0;
    let replicatedCareers = 0;

    for (const emp of employees) {
      console.log(`Processing ${emp.firstName} ${emp.lastName} (${emp.id})...`);

      // A. Replicate Appraisals
      for (const app of appraisals) {
        const exists = await prisma.appraisal.findFirst({
          where: { employeeId: emp.id }
        });
        if (!exists) {
          await prisma.appraisal.create({
            data: {
              employeeId: emp.id,
              managerId: app.managerId,
              status: app.status,
              appraisalData: app.appraisalData
            }
          });
          replicatedAppraisals++;
        }
      }

      // B. Replicate Goals
      for (const goal of goals) {
        const exists = await prisma.performanceGoal.findFirst({
          where: { employeeId: emp.id, title: goal.title }
        });
        if (!exists) {
          await prisma.performanceGoal.create({
            data: {
              employeeId: emp.id,
              title: goal.title,
              status: goal.status,
              progress: goal.progress,
              goalData: goal.goalData
            }
          });
          replicatedGoals++;
        }
      }

      // C. Replicate Skills
      for (const skill of skills) {
        const exists = await prisma.skill.findUnique({
          where: {
            employeeId_name: {
              employeeId: emp.id,
              name: skill.name
            }
          }
        });
        if (!exists) {
          await prisma.skill.create({
            data: {
              employeeId: emp.id,
              name: skill.name,
              category: skill.category,
              proficiency: skill.proficiency,
              lastAssessed: skill.lastAssessed
            }
          });
          replicatedSkills++;
        }
      }

      // D. Replicate Career Paths
      for (const cp of careerPaths) {
        const exists = await prisma.careerPath.findFirst({
          where: { employeeId: emp.id }
        });
        if (!exists) {
          await prisma.careerPath.create({
            data: {
              employeeId: emp.id,
              organizationId: emp.organizationId,
              status: cp.status,
              modelData: cp.modelData
            }
          });
          replicatedCareers++;
        }
      }
    }

    console.log('\n🎉 Replication finished successfully!');
    console.log(`- Created ${replicatedAppraisals} Appraisal records.`);
    console.log(`- Created ${replicatedGoals} Performance Goal records.`);
    console.log(`- Created ${replicatedSkills} Skill records.`);
    console.log(`- Created ${replicatedCareers} Career Path records.`);

  } catch (error) {
    console.error('❌ Error during replication:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
