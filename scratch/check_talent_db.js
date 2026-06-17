const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log("=== COUNT OF TALENT TABLES ===");
  const appraisalCount = await prisma.appraisal.count();
  const goalCount = await prisma.performanceGoal.count();
  const skillCount = await prisma.skill.count();
  const careerPathCount = await prisma.careerPath.count();
  const employeeCount = await prisma.employee.count();
  
  console.log(`Appraisal: ${appraisalCount}`);
  console.log(`PerformanceGoal: ${goalCount}`);
  console.log(`Skill: ${skillCount}`);
  console.log(`CareerPath: ${careerPathCount}`);
  console.log(`Employee: ${employeeCount}`);

  console.log("\n=== APPRAISAL SAMPLES ===");
  const appraisals = await prisma.appraisal.findMany({ take: 3 });
  console.log(JSON.stringify(appraisals, null, 2));

  console.log("\n=== PERFORMANCE GOAL SAMPLES ===");
  const goals = await prisma.performanceGoal.findMany({ take: 3 });
  console.log(JSON.stringify(goals, null, 2));

  console.log("\n=== SKILL SAMPLES ===");
  const skills = await prisma.skill.findMany({ take: 5 });
  console.log(JSON.stringify(skills, null, 2));

  console.log("\n=== CAREER PATH SAMPLES ===");
  const careerPaths = await prisma.careerPath.findMany({ take: 3 });
  console.log(JSON.stringify(careerPaths, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
