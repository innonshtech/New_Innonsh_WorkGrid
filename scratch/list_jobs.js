const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.jobRequisition.findMany();
  console.log("ALL JOBS:", JSON.stringify(jobs.map(j => ({ id: j.id, mongoId: j.mongoId, title: j.title })), null, 2));

  const candidates = await prisma.candidate.findMany();
  console.log("ALL CANDIDATES:", JSON.stringify(candidates, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

