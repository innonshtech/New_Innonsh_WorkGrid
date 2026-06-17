const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const goals = await prisma.performanceGoal.findMany();
    const skills = await prisma.skill.findMany();
    const careers = await prisma.careerPath.findMany();

    console.log('--- GOALS IN DB ---');
    for (const g of goals) {
      const emp = g.employeeId ? await prisma.employee.findUnique({ where: { id: g.employeeId }, select: { firstName: true, lastName: true } }) : null;
      console.log(`Goal: "${g.title}" - employeeId: ${g.employeeId} (${emp ? emp.firstName + ' ' + emp.lastName : 'N/A'})`);
    }

    console.log('\n--- SKILLS IN DB ---');
    for (const s of skills) {
      const emp = s.employeeId ? await prisma.employee.findUnique({ where: { id: s.employeeId }, select: { firstName: true, lastName: true } }) : null;
      console.log(`Skill: "${s.name}" (Proficiency: ${s.proficiency}) - employeeId: ${s.employeeId} (${emp ? emp.firstName + ' ' + emp.lastName : 'N/A'})`);
    }

    console.log('\n--- CAREER PATHS IN DB ---');
    for (const c of careers) {
      const emp = c.employeeId ? await prisma.employee.findUnique({ where: { id: c.employeeId }, select: { firstName: true, lastName: true } }) : null;
      console.log(`Career Path: employeeId: ${c.employeeId} (${emp ? emp.firstName + ' ' + emp.lastName : 'N/A'})`);
    }

  } catch (error) {
    console.error('Error running script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
